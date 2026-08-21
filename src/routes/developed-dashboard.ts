import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { pool } from '../db/pool.js';

const dashboardQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().max(300).optional().default(''),
  department: z.string().max(200).optional().default(''),
  internalStatus: z.string().max(120).optional().default(''),
  closureRequestStatus: z.string().max(120).optional().default(''),
  contractor: z.string().max(300).optional().default(''),
  ownerEntity: z.string().max(300).optional().default(''),
  consultant: z.string().max(300).optional().default(''),
  from: z.string().max(40).optional().default(''),
  to: z.string().max(40).optional().default('')
});

function normSql(column: string) {
  return `regexp_replace(replace(replace(COALESCE(${column},''), chr(160), ' '), chr(8206), ''), '\\s+', ' ', 'g')`;
}

export async function developedDashboardRoutes(app: FastifyInstance) {
  app.get('/dashboard', async request => {
    const q = dashboardQuery.parse(request.query || {});
    const where: string[] = [`${normSql('l.dependency')} = 'تابع'`];
    const values: unknown[] = [];
    const add = (sql: string, value: unknown) => { values.push(value); where.push(sql.replace('$?', `$${values.length}`)); };

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
    if (q.department) add(`${normSql('l.department')} = ${normSql('$?::text')}`, q.department);
    if (q.internalStatus) add(`${normSql('l.status')} = ${normSql('$?::text')}`, q.internalStatus);
    if (q.closureRequestStatus) add(`${normSql('l.closure_request_status')} = ${normSql('$?::text')}`, q.closureRequestStatus);
    if (q.contractor) add(`${normSql('l.contractor')} = ${normSql('$?::text')}`, q.contractor);
    if (q.ownerEntity) add(`${normSql('l.owner_entity')} = ${normSql('$?::text')}`, q.ownerEntity);
    if (q.consultant) add(`${normSql('l.consultant')} = ${normSql('$?::text')}`, q.consultant);
    if (q.from) add(`COALESCE(l.status_date,l.created_at)::date >= $?::date`, q.from);
    if (q.to) add(`COALESCE(l.status_date,l.created_at)::date <= $?::date`, q.to);

    const whereSql = `WHERE ${where.join(' AND ')}`;
    const countValues = [...values];
    const dataValues = [...values, q.pageSize, (q.page - 1) * q.pageSize];
    const limitIndex = dataValues.length - 1;
    const offsetIndex = dataValues.length;

    const [data, counts, departments, statuses, closureStatuses, contractors, owners, consultants] = await Promise.all([
      pool.query(`SELECT l.id,l.license_number,l.department,l.status AS internal_status,l.closure_request_status,l.contractor,l.consultant,l.owner_entity,l.project_name,l.street_name,l.route_name,l.district,l.municipality,l.latitude,l.longitude,l.closure_order_number,l.processing_deadline,l.closure_date,l.status_date,l.created_at,l.updated_at,l.extra_payload FROM developed_licenses.licenses l ${whereSql} ORDER BY COALESCE(l.updated_at,l.created_at) DESC LIMIT $${limitIndex} OFFSET $${offsetIndex}`, dataValues),
      pool.query(`SELECT
        count(*)::int total,
        count(*) FILTER (WHERE ${normSql('l.status')}='تحت الإجراء')::int pending,
        count(*) FILTER (WHERE ${normSql('l.status')}='مقبول')::int accepted,
        count(*) FILTER (WHERE ${normSql('l.status')}='مرفوض' OR ${normSql('l.closure_request_status')} LIKE 'معاد%')::int rejected,
        count(*) FILTER (WHERE ${normSql('l.closure_request_status')}='تحت معالجة الجهة المشرفة')::int supervisor_processing,
        count(*) FILTER (WHERE l.processing_deadline IS NOT NULL)::int with_processing_date,
        count(*) FILTER (WHERE l.created_at >= now()-interval '7 days')::int recent_added
       FROM developed_licenses.licenses l ${whereSql}`, countValues),
      pool.query(`SELECT COALESCE(NULLIF(${normSql('l.department')},''),'غير محدد') value,count(*)::int count FROM developed_licenses.licenses l ${whereSql} GROUP BY 1 ORDER BY count DESC`, countValues),
      pool.query(`SELECT COALESCE(NULLIF(${normSql('l.status')},''),'غير محدد') value,count(*)::int count FROM developed_licenses.licenses l ${whereSql} GROUP BY 1 ORDER BY count DESC`, countValues),
      pool.query(`SELECT COALESCE(NULLIF(${normSql('l.closure_request_status')},''),'غير محدد') value,count(*)::int count FROM developed_licenses.licenses l ${whereSql} GROUP BY 1 ORDER BY count DESC`, countValues),
      pool.query(`SELECT ${normSql('l.contractor')} value,count(*)::int count FROM developed_licenses.licenses l ${whereSql} AND ${normSql('l.contractor')}<>'' GROUP BY 1 ORDER BY count DESC LIMIT 100`, countValues),
      pool.query(`SELECT ${normSql('l.owner_entity')} value,count(*)::int count FROM developed_licenses.licenses l ${whereSql} AND ${normSql('l.owner_entity')}<>'' GROUP BY 1 ORDER BY count DESC LIMIT 100`, countValues),
      pool.query(`SELECT ${normSql('l.consultant')} value,count(*)::int count FROM developed_licenses.licenses l ${whereSql} AND ${normSql('l.consultant')}<>'' GROUP BY 1 ORDER BY count DESC LIMIT 100`, countValues)
    ]);

    const total = Number(counts.rows[0]?.total || 0);
    return {
      ok: true,
      page: q.page,
      pageSize: q.pageSize,
      total,
      pages: Math.max(1, Math.ceil(total / q.pageSize)),
      counts: counts.rows[0] || {},
      facets: {
        departments: departments.rows,
        statuses: statuses.rows,
        closureStatuses: closureStatuses.rows,
        contractors: contractors.rows,
        owners: owners.rows,
        consultants: consultants.rows
      },
      rows: data.rows
    };
  });

  app.get('/closure-queue-stable', async () => {
    const dep = normSql('l.dependency');
    const status = normSql('l.status');
    const closure = normSql('l.closure_request_status');
    const [rowsResult, diagnostic] = await Promise.all([
      pool.query(`SELECT l.*,EXTRACT(EPOCH FROM (l.processing_deadline-now()))::bigint AS remaining_seconds
        FROM developed_licenses.licenses l
        WHERE ${dep}='تابع' AND ${closure}='تحت معالجة الجهة المشرفة' AND ${status}='تحت الإجراء'
        ORDER BY l.processing_deadline NULLS LAST,l.updated_at DESC LIMIT 500`),
      pool.query(`SELECT
        count(*) FILTER (WHERE ${dep}='تابع')::int dependent,
        count(*) FILTER (WHERE ${dep}='تابع' AND ${closure}='تحت معالجة الجهة المشرفة')::int supervisor_processing,
        count(*) FILTER (WHERE ${dep}='تابع' AND ${closure}='تحت معالجة الجهة المشرفة' AND ${status}='تحت الإجراء')::int eligible
        FROM developed_licenses.licenses l`)
    ]);
    return { ok:true, rows:rowsResult.rows, diagnostic:diagnostic.rows[0] || {} };
  });
}
