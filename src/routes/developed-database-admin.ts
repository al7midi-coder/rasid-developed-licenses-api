import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { pool } from '../db/pool.js';

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().max(300).optional().default(''),
  department: z.string().max(200).optional().default(''),
  internalStatus: z.string().max(120).optional().default(''),
  closureRequestStatus: z.string().max(120).optional().default(''),
  dependency: z.enum(['تابع','غير تابع']).optional()
});

const deleteSelectedBody = z.object({
  licenseNumbers: z.array(z.string().min(1).max(120)).min(1).max(5000),
  actor: z.string().max(200).optional().default('rasid')
});

const deleteAllBody = z.object({
  confirmation: z.literal('حذف كامل رخص القاعدة'),
  actor: z.string().max(200).optional().default('rasid')
});

function pushFilter(where: string[], values: unknown[], sql: string, value: unknown) {
  values.push(value);
  where.push(sql.replace('$?', `$${values.length}`));
}

async function deleteByNumbers(numbers: string[]) {
  const unique = [...new Set(numbers.map(x => String(x).trim()).filter(Boolean))];
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const before = await client.query(`SELECT count(*)::int count FROM developed_licenses.licenses WHERE license_number=ANY($1::text[])`, [unique]);
    const sourceBefore = await client.query(`SELECT count(*)::int count FROM developed_licenses.source_licenses WHERE license_number=ANY($1::text[])`, [unique]);
    await client.query(`DELETE FROM developed_licenses.closure_events WHERE license_number=ANY($1::text[])`, [unique]);
    await client.query(`DELETE FROM developed_licenses.analysis_results WHERE license_number=ANY($1::text[])`, [unique]);
    await client.query(`DELETE FROM developed_licenses.status_history WHERE license_number=ANY($1::text[])`, [unique]);
    await client.query(`DELETE FROM developed_licenses.sync_events WHERE license_number=ANY($1::text[])`, [unique]);
    await client.query(`DELETE FROM developed_licenses.sync_map WHERE license_number=ANY($1::text[])`, [unique]);
    await client.query(`DELETE FROM developed_licenses.licenses WHERE license_number=ANY($1::text[])`, [unique]);
    await client.query(`DELETE FROM developed_licenses.source_licenses WHERE license_number=ANY($1::text[])`, [unique]);
    await client.query('COMMIT');
    return {
      ok: true,
      deletedLicenses: Number(before.rows[0]?.count || 0),
      deletedSourceRows: Number(sourceBefore.rows[0]?.count || 0),
      requested: unique.length
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function developedDatabaseAdminRoutes(app: FastifyInstance) {
  app.get('/database', async request => {
    const q = listQuery.parse(request.query || {});
    const where: string[] = [];
    const values: unknown[] = [];
    const term = q.search.trim();
    if (term) {
      values.push(`%${term}%`);
      const i = values.length;
      where.push(`(
        l.license_number ILIKE $${i} OR COALESCE(l.contractor,'') ILIKE $${i} OR COALESCE(l.consultant,'') ILIKE $${i} OR
        COALESCE(l.project_name,'') ILIKE $${i} OR COALESCE(l.owner_entity,'') ILIKE $${i} OR COALESCE(l.street_name,'') ILIKE $${i} OR
        COALESCE(l.route_name,'') ILIKE $${i} OR COALESCE(l.district,'') ILIKE $${i} OR COALESCE(l.municipality,'') ILIKE $${i} OR
        COALESCE(l.closure_order_number,'') ILIKE $${i} OR COALESCE(l.extra_payload::text,'') ILIKE $${i}
      )`);
    }
    if (q.department) pushFilter(where, values, `l.department=$?`, q.department);
    if (q.internalStatus) pushFilter(where, values, `l.status=$?`, q.internalStatus);
    if (q.closureRequestStatus) pushFilter(where, values, `l.closure_request_status=$?`, q.closureRequestStatus);
    if (q.dependency) pushFilter(where, values, `l.dependency=$?`, q.dependency);
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const countParams = [...values];
    values.push(q.pageSize, (q.page - 1) * q.pageSize);
    const [data, totalResult, departments, statuses, closureStatuses] = await Promise.all([
      pool.query(`SELECT l.id,l.license_number,l.contractor,l.consultant,l.project_name,l.owner_entity,l.street_name,l.route_name,l.district,l.municipality,l.dependency,l.department,l.status AS internal_status,l.closure_request_status,l.processing_deadline,l.updated_at FROM developed_licenses.licenses l ${whereSql} ORDER BY l.updated_at DESC,l.license_number DESC LIMIT $${values.length-1} OFFSET $${values.length}`, values),
      pool.query(`SELECT count(*)::int total FROM developed_licenses.licenses l ${whereSql}`, countParams),
      pool.query(`SELECT COALESCE(department,'غير محدد') value,count(*)::int count FROM developed_licenses.licenses GROUP BY department ORDER BY count DESC,value`),
      pool.query(`SELECT COALESCE(status,'غير محدد') value,count(*)::int count FROM developed_licenses.licenses GROUP BY status ORDER BY count DESC,value`),
      pool.query(`SELECT COALESCE(closure_request_status,'غير محدد') value,count(*)::int count FROM developed_licenses.licenses GROUP BY closure_request_status ORDER BY count DESC,value`)
    ]);
    const total = Number(totalResult.rows[0]?.total || 0);
    return {
      page: q.page,
      pageSize: q.pageSize,
      total,
      pages: Math.max(1, Math.ceil(total / q.pageSize)),
      rows: data.rows,
      facets: { departments: departments.rows, statuses: statuses.rows, closureStatuses: closureStatuses.rows }
    };
  });

  app.post('/database/delete', async request => {
    const body = deleteSelectedBody.parse(request.body);
    return deleteByNumbers(body.licenseNumbers);
  });

  app.post('/database/delete-all', async request => {
    deleteAllBody.parse(request.body);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const before = await client.query(`SELECT count(*)::int count FROM developed_licenses.licenses`);
      const sourceBefore = await client.query(`SELECT count(*)::int count FROM developed_licenses.source_licenses`);
      await client.query(`DELETE FROM developed_licenses.closure_events`);
      await client.query(`DELETE FROM developed_licenses.analysis_results`);
      await client.query(`DELETE FROM developed_licenses.status_history`);
      await client.query(`DELETE FROM developed_licenses.sync_events`);
      await client.query(`DELETE FROM developed_licenses.sync_map`);
      await client.query(`DELETE FROM developed_licenses.licenses`);
      await client.query(`DELETE FROM developed_licenses.source_licenses`);
      await client.query('COMMIT');
      return { ok: true, deletedLicenses: Number(before.rows[0]?.count || 0), deletedSourceRows: Number(sourceBefore.rows[0]?.count || 0) };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  });
}
