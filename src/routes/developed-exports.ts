import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { pool } from '../db/pool.js';

const querySchema = z.object({
  scope: z.enum(['all','related','transit','main','bridges']).default('all'),
  limit: z.coerce.number().int().min(1).max(120000).default(120000)
});

export async function developedExportRoutes(app: FastifyInstance) {
  app.get('/rows', async request => {
    const { scope, limit } = querySchema.parse(request.query);
    const where: string[] = [];
    const values: unknown[] = [];

    if (scope === 'related') where.push('l.id IS NOT NULL');
    if (scope === 'transit') where.push("l.department = 'محاور النقل العام'");
    if (scope === 'main') where.push("l.department = 'المحاور الرئيسية'");
    if (scope === 'bridges') where.push("l.department = 'الجسور والأنفاق'");

    values.push(limit);
    const sql = `
      SELECT
        s.license_number,
        s.raw_payload,
        s.updated_at AS source_updated_at,
        l.id AS developed_id,
        l.dependency,
        l.department,
        l.status AS internal_status,
        l.closure_request_status,
        l.contractor,
        l.consultant,
        l.owner_entity,
        l.project_name,
        l.street_name,
        l.route_name,
        l.municipality,
        l.district,
        l.latitude,
        l.longitude,
        l.closure_order_number,
        l.processing_deadline,
        l.closure_date,
        l.status_date,
        l.rejection_reason,
        l.updated_at AS developed_updated_at
      FROM developed_licenses.source_licenses s
      LEFT JOIN developed_licenses.licenses l
        ON l.license_number = s.license_number
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY COALESCE(l.updated_at, s.updated_at) DESC
      LIMIT $1
    `;

    const { rows } = await pool.query(sql, values);
    return { scope, count: rows.length, rows };
  });
}
