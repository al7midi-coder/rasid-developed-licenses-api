import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import type { PoolClient } from 'pg';
import { z } from 'zod';
import { pool } from '../db/pool.js';

const page = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(8)
});

const license = z.object({
  licenseNumber: z.string().min(1).max(120),
  dependency: z.enum(['تابع', 'غير تابع']).default('غير تابع'),
  department: z.string().max(200).optional(),
  internalStatus: z.string().max(120).optional(),
  closureRequestStatus: z.string().max(120).optional(),
  contractor: z.string().max(300).optional(),
  ownerEntity: z.string().max(300).optional(),
  consultant: z.string().max(300).optional(),
  roadName: z.string().max(300).optional(),
  latitude: z.number().finite().optional(),
  longitude: z.number().finite().optional(),
  processingDeadline: z.string().datetime().optional(),
  rawData: z.record(z.unknown()).default({})
});

const collectorRows = z.object({
  rows: z.array(license).min(1).max(1000)
});

export async function developedLicenseRoutes(app: FastifyInstance) {
  app.get('/summary', async () => {
    const { rows } = await pool.query(`
      SELECT
        count(*)::int total,
        count(*) FILTER (WHERE closure_request_status='مغلق أوليًا')::int initially_closed,
        count(*) FILTER (WHERE closure_request_status='مغلق')::int closed,
        count(*) FILTER (WHERE status='تحت الإجراء')::int pending
      FROM developed_licenses.licenses
      WHERE dependency='تابع'
    `);
    return rows[0];
  });

  app.get('/licenses', async request => {
    const q = request.query as Record<string, unknown>;
    const p = page.parse(q);
    const where: string[] = [`l.dependency='تابع'`];
    const values: unknown[] = [];

    for (const [key, column] of [
      ['search', 'l.license_number'],
      ['department', 'l.department'],
      ['internalStatus', 'l.status'],
      ['closureRequestStatus', 'l.closure_request_status']
    ] as const) {
      if (q[key]) {
        values.push(key === 'search' ? `%${String(q[key])}%` : q[key]);
        where.push(
          key === 'search'
            ? `${column} ILIKE $${values.length}`
            : `${column}=$${values.length}`
        );
      }
    }

    values.push(p.pageSize, (p.page - 1) * p.pageSize);
    const result = await pool.query(
      `SELECT
         l.id,
         l.license_number,
         l.department,
         l.status AS internal_status,
         l.closure_request_status,
         l.contractor,
         l.owner_entity,
         l.processing_deadline,
         l.updated_at,
         (
           SELECT count(*)::int
           FROM developed_licenses.status_history sh
           WHERE sh.license_number=l.license_number
             AND sh.closure_request_status LIKE 'معاد%'
         ) AS return_count
       FROM developed_licenses.licenses l
       WHERE ${where.join(' AND ')}
       ORDER BY l.updated_at DESC
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    return { page: p.page, pageSize: p.pageSize, rows: result.rows };
  });

  app.get('/facets', async () => {
    const { rows } = await pool.query(`
      SELECT department, count(*)::int count
      FROM developed_licenses.licenses
      WHERE dependency='تابع'
      GROUP BY department
      ORDER BY count DESC
      LIMIT 50
    `);
    return { departments: rows };
  });

  app.post('/upload', async request => {
    const body = z.object({ rows: z.array(license).min(1).max(5000) }).parse(request.body);
    return upsert(body.rows, 'upload');
  });

  app.post('/collector-jobs', async () => {
    const client = await pool.connect();
    try {
      const sourceId = await ensureSource(client, 'collector', 'Center Collector', 'collector');
      const { rows } = await client.query(
        `INSERT INTO developed_licenses.collector_jobs(id,source_id,status)
         VALUES($1,$2,'waiting_for_login')
         RETURNING *`,
        [randomUUID(), sourceId]
      );
      return rows[0];
    } finally {
      client.release();
    }
  });

  app.get('/collector-jobs/:id', async request => {
    const id = z.string().uuid().parse((request.params as { id: string }).id);
    const { rows } = await pool.query(
      `SELECT * FROM developed_licenses.collector_jobs WHERE id=$1`,
      [id]
    );
    if (!rows[0]) throw Object.assign(Error('Collector job غير موجود'), { statusCode: 404 });
    return rows[0];
  });

  app.post('/collector-jobs/:id/heartbeat', async request =>
    jobUpdate((request.params as { id: string }).id, 'collecting'));
  app.post('/collector-jobs/:id/pause', async request =>
    jobUpdate((request.params as { id: string }).id, 'paused'));
  app.post('/collector-jobs/:id/resume', async request =>
    jobUpdate((request.params as { id: string }).id, 'collecting'));
  app.post('/collector-jobs/:id/complete', async request =>
    jobUpdate((request.params as { id: string }).id, 'completed'));
  app.post('/collector-jobs/:id/fail', async request =>
    jobUpdate((request.params as { id: string }).id, 'failed'));

  app.post('/collector-jobs/:id/records', async request => {
    const id = z.string().uuid().parse((request.params as { id: string }).id);
    const body = collectorRows.parse(request.body);
    const out = await upsert(body.rows, 'collector');
    await pool.query(
      `UPDATE developed_licenses.collector_jobs
       SET counters=jsonb_set(
             counters,
             '{received_rows}',
             to_jsonb(COALESCE((counters->>'received_rows')::int,0)+$2::int),
             true
           ),
           status='collecting',
           heartbeat_at=now(),
           updated_at=now()
       WHERE id=$1`,
      [id, body.rows.length]
    );
    return out;
  });

  app.patch('/:id/classification', async request => {
    const id = z.string().uuid().parse((request.params as { id: string }).id);
    const body = z.object({
      dependency: z.enum(['تابع', 'غير تابع']),
      department: z.string().max(200).optional(),
      actor: z.string().max(150).default('system')
    }).parse(request.body);

    const { rows } = await pool.query(
      `UPDATE developed_licenses.licenses
       SET dependency=$2,
           department=$3,
           manual_classification=$4,
           manual_department=$3,
           updated_at=now()
       WHERE id=$1
       RETURNING *`,
      [id, body.dependency, body.department || null, body.actor]
    );

    if (!rows[0]) throw Object.assign(Error('الرخصة غير موجودة'), { statusCode: 404 });

    await pool.query(
      `INSERT INTO developed_licenses.status_history(
         id,license_id,license_number,status,closure_request_status,rejection_reason,source,occurred_at
       ) VALUES($1,$2,$3,$4,$5,$6,'manual_classification',now())`,
      [
        randomUUID(),
        rows[0].id,
        rows[0].license_number,
        rows[0].status,
        rows[0].closure_request_status,
        rows[0].rejection_reason
      ]
    );

    return rows[0];
  });

  app.get('/closure-queue', async () => {
    const { rows } = await pool.query(`
      SELECT *,
             EXTRACT(EPOCH FROM (processing_deadline-now()))::bigint AS remaining_seconds
      FROM developed_licenses.licenses
      WHERE dependency='تابع'
        AND closure_request_status='تحت معالجة الجهة المشرفة'
        AND status='تحت الإجراء'
      ORDER BY processing_deadline NULLS LAST
      LIMIT 500
    `);
    return { rows };
  });

  app.get('/map', async request => {
    const q = request.query as Record<string, unknown>;
    const box = String(q.bbox || '').split(',').map(Number);
    if (box.length !== 4 || box.some(x => !Number.isFinite(x))) {
      throw Object.assign(Error('bbox غير صالح'), { statusCode: 400 });
    }

    const { rows } = await pool.query(
      `SELECT id,license_number,latitude,longitude,status AS internal_status,
              closure_request_status,department,contractor,consultant,owner_entity,
              project_name,route_name,street_name,closure_date,status_date,processing_deadline
       FROM developed_licenses.licenses
       WHERE dependency='تابع'
         AND longitude BETWEEN $1 AND $3
         AND latitude BETWEEN $2 AND $4
       LIMIT 2000`,
      box
    );

    return {
      type: 'FeatureCollection',
      features: rows.map(row => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [Number(row.longitude), Number(row.latitude)]
        },
        properties: row
      }))
    };
  });

  app.post('/sync', async () => {
    const { rows } = await pool.query(
      `INSERT INTO developed_licenses.sync_runs(id,direction,status)
       VALUES($1,'developed-to-current','queued')
       RETURNING *`,
      [randomUUID()]
    );
    return rows[0];
  });
}

async function jobUpdate(idValue: string, status: string) {
  const id = z.string().uuid().parse(idValue);
  const { rows } = await pool.query(
    `UPDATE developed_licenses.collector_jobs
     SET status=$2,
         heartbeat_at=now(),
         updated_at=now(),
         completed_at=CASE
           WHEN $2::text IN ('completed','partial','failed','cancelled') THEN now()
           ELSE completed_at
         END
     WHERE id=$1
     RETURNING *`,
    [id, status]
  );
  if (!rows[0]) throw Object.assign(Error('Collector job غير موجود'), { statusCode: 404 });
  return rows[0];
}

async function ensureSource(
  client: PoolClient,
  code: string,
  name: string,
  sourceType: string
): Promise<string> {
  const existing = await client.query<{ id: string }>(
    `SELECT id FROM developed_licenses.sources WHERE code=$1`,
    [code]
  );
  if (existing.rows[0]) return existing.rows[0].id;

  const id = randomUUID();
  const inserted = await client.query<{ id: string }>(
    `INSERT INTO developed_licenses.sources(id,code,name,source_type)
     VALUES($1,$2,$3,$4)
     ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,source_type=EXCLUDED.source_type,updated_at=now()
     RETURNING id`,
    [id, code, name, sourceType]
  );
  return inserted.rows[0].id;
}

async function upsert(rows: z.infer<typeof license>[], source: string) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const sourceId = await ensureSource(
      client,
      source,
      source === 'collector' ? 'Center Collector' : 'Excel Upload',
      source === 'collector' ? 'collector' : 'excel'
    );

    let dependent = 0;

    for (const row of rows) {
      await client.query(
        `INSERT INTO developed_licenses.source_licenses(
           id,source_id,license_number,raw_payload,created_at,updated_at
         ) VALUES($1,$2,$3,$4,now(),now())
         ON CONFLICT(license_number) DO UPDATE SET
           source_id=EXCLUDED.source_id,
           raw_payload=EXCLUDED.raw_payload,
           updated_at=now()`,
        [randomUUID(), sourceId, row.licenseNumber, row.rawData]
      );

      if (row.dependency !== 'تابع') continue;
      dependent++;

      await client.query(
        `INSERT INTO developed_licenses.licenses(
           id,license_number,source_id,dependency,department,status,
           closure_request_status,contractor,owner_entity,consultant,route_name,
           latitude,longitude,processing_deadline,extra_payload,created_at,updated_at
         ) VALUES(
           $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,now(),now()
         )
         ON CONFLICT(license_number) DO UPDATE SET
           source_id=EXCLUDED.source_id,
           dependency=CASE
             WHEN developed_licenses.licenses.manual_classification IS NOT NULL
               THEN developed_licenses.licenses.dependency
             ELSE EXCLUDED.dependency
           END,
           department=CASE
             WHEN developed_licenses.licenses.manual_classification IS NOT NULL
               THEN COALESCE(developed_licenses.licenses.manual_department,developed_licenses.licenses.department)
             ELSE EXCLUDED.department
           END,
           status=COALESCE(EXCLUDED.status,developed_licenses.licenses.status),
           closure_request_status=COALESCE(EXCLUDED.closure_request_status,developed_licenses.licenses.closure_request_status),
           contractor=COALESCE(EXCLUDED.contractor,developed_licenses.licenses.contractor),
           owner_entity=COALESCE(EXCLUDED.owner_entity,developed_licenses.licenses.owner_entity),
           consultant=COALESCE(EXCLUDED.consultant,developed_licenses.licenses.consultant),
           route_name=COALESCE(EXCLUDED.route_name,developed_licenses.licenses.route_name),
           latitude=COALESCE(EXCLUDED.latitude,developed_licenses.licenses.latitude),
           longitude=COALESCE(EXCLUDED.longitude,developed_licenses.licenses.longitude),
           processing_deadline=COALESCE(EXCLUDED.processing_deadline,developed_licenses.licenses.processing_deadline),
           extra_payload=EXCLUDED.extra_payload,
           updated_at=now()`,
        [
          randomUUID(),
          row.licenseNumber,
          sourceId,
          row.dependency,
          row.department || null,
          row.internalStatus || 'تحت الإجراء',
          row.closureRequestStatus || null,
          row.contractor || null,
          row.ownerEntity || null,
          row.consultant || null,
          row.roadName || null,
          row.latitude ?? null,
          row.longitude ?? null,
          row.processingDeadline || null,
          row.rawData
        ]
      );
    }

    await client.query('COMMIT');
    return { received: rows.length, storedDependent: dependent };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
