import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import type { PoolClient } from 'pg';
import { z } from 'zod';
import { pool } from '../db/pool.js';

const GOOGLE_SHEET_API_URL = process.env.GOOGLE_SHEET_API_URL || 'https://script.google.com/macros/s/AKfycbwrCeFugL6G88ZaqGzno5glW2zU2nMpHlHOplxKcq5w8-moVkkfyDLre2V6vXSyBTdC/exec';

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

const commitBody = z.object({ rows: z.array(license).min(1).max(5000) });

async function sheetPost(body: Record<string, unknown>) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  try {
    const response = await fetch(GOOGLE_SHEET_API_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
      redirect: 'follow'
    });
    const text = await response.text();
    let data: unknown;
    try { data = JSON.parse(text); } catch { data = null; }
    if (!response.ok) throw Object.assign(Error(`Google Sheet API HTTP ${response.status}`), { statusCode: 502 });
    if (!data || typeof data !== 'object' || !('ok' in data) || !(data as { ok?: boolean }).ok) {
      const message = data && typeof data === 'object' && 'error' in data ? String((data as { error?: unknown }).error || '') : text;
      throw Object.assign(Error(message || 'فشل Google Sheet API'), { statusCode: 502 });
    }
    return data as Record<string, unknown>;
  } finally {
    clearTimeout(timeout);
  }
}

async function ensureSource(client: PoolClient): Promise<string> {
  const existing = await client.query<{ id: string }>(`SELECT id FROM developed_licenses.sources WHERE code='google_sheet'`);
  if (existing.rows[0]) return existing.rows[0].id;
  const id = randomUUID();
  const inserted = await client.query<{ id: string }>(`INSERT INTO developed_licenses.sources(id,code,name,source_type) VALUES($1,'google_sheet','Google Sheet - راصد جامع التراخيص','google_sheet') ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,source_type=EXCLUDED.source_type,updated_at=now() RETURNING id`, [id]);
  const source = inserted.rows[0];
  if (!source) throw new Error('تعذر إنشاء مصدر Google Sheet');
  return source.id;
}

async function storeRows(rows: z.infer<typeof license>[]) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const sourceId = await ensureSource(client);
    let dependent = 0;
    for (const row of rows) {
      await client.query(`INSERT INTO developed_licenses.source_licenses(id,source_id,license_number,raw_payload,created_at,updated_at) VALUES($1,$2,$3,$4,now(),now()) ON CONFLICT(license_number) DO UPDATE SET source_id=EXCLUDED.source_id,raw_payload=CASE WHEN EXCLUDED.raw_payload='{}'::jsonb THEN developed_licenses.source_licenses.raw_payload ELSE developed_licenses.source_licenses.raw_payload || EXCLUDED.raw_payload END,updated_at=now()`, [randomUUID(), sourceId, row.licenseNumber, row.rawData]);
      if (row.dependency !== 'تابع') continue;
      dependent++;
      const status = row.closureRequestStatus === 'تحت معالجة الجهة المشرفة' ? 'تحت الإجراء' : (row.internalStatus || 'تحت الإجراء');
      await client.query(`INSERT INTO developed_licenses.licenses(id,license_number,source_id,dependency,department,status,closure_request_status,contractor,owner_entity,consultant,route_name,latitude,longitude,processing_deadline,extra_payload,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,now(),now()) ON CONFLICT(license_number) DO UPDATE SET source_id=EXCLUDED.source_id,dependency=CASE WHEN developed_licenses.licenses.manual_classification IS NOT NULL THEN developed_licenses.licenses.dependency ELSE EXCLUDED.dependency END,department=CASE WHEN developed_licenses.licenses.manual_classification IS NOT NULL THEN COALESCE(developed_licenses.licenses.manual_department,developed_licenses.licenses.department) ELSE COALESCE(EXCLUDED.department,developed_licenses.licenses.department) END,status=CASE WHEN EXCLUDED.closure_request_status='تحت معالجة الجهة المشرفة' THEN 'تحت الإجراء' ELSE COALESCE(NULLIF(EXCLUDED.status,''),developed_licenses.licenses.status) END,closure_request_status=COALESCE(NULLIF(EXCLUDED.closure_request_status,''),developed_licenses.licenses.closure_request_status),contractor=COALESCE(NULLIF(EXCLUDED.contractor,''),developed_licenses.licenses.contractor),owner_entity=COALESCE(NULLIF(EXCLUDED.owner_entity,''),developed_licenses.licenses.owner_entity),consultant=COALESCE(NULLIF(EXCLUDED.consultant,''),developed_licenses.licenses.consultant),route_name=COALESCE(NULLIF(EXCLUDED.route_name,''),developed_licenses.licenses.route_name),latitude=COALESCE(EXCLUDED.latitude,developed_licenses.licenses.latitude),longitude=COALESCE(EXCLUDED.longitude,developed_licenses.licenses.longitude),processing_deadline=COALESCE(EXCLUDED.processing_deadline,developed_licenses.licenses.processing_deadline),extra_payload=developed_licenses.licenses.extra_payload || EXCLUDED.extra_payload,updated_at=now()`, [randomUUID(), row.licenseNumber, sourceId, row.dependency, row.department || null, status, row.closureRequestStatus || null, row.contractor || null, row.ownerEntity || null, row.consultant || null, row.roadName || null, row.latitude ?? null, row.longitude ?? null, row.processingDeadline || null, row.rawData]);
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

export async function googleSheetRoutes(app: FastifyInstance) {
  app.post('/merged', async () => {
    return sheetPost({ action: 'readAllMerged' });
  });

  app.post('/commit', async request => {
    const body = commitBody.parse(request.body);
    const stored = await storeRows(body.rows);
    const affiliated = body.rows.filter(row => row.dependency === 'تابع').map(row => row.rawData);
    let sheetSynced = true;
    let sheetResult: Record<string, unknown> | null = null;
    let sheetError: string | null = null;
    if (affiliated.length) {
      try {
        sheetResult = await sheetPost({ action: 'upsertBatch', sheetName: 'التراخيص التابعة', records: affiliated });
      } catch (error) {
        sheetSynced = false;
        sheetError = error instanceof Error ? error.message : String(error);
      }
    }
    return { ...stored, affiliated: affiliated.length, sheetSynced, sheetResult, sheetError };
  });
}
