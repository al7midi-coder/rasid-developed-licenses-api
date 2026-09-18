import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { pool } from '../db/pool.js';

const paramsSchema = z.object({ licenseNumber: z.string().min(1).max(120) });
const bodySchema = z.object({
  dependency: z.enum(['تابع', 'غير تابع']),
  department: z.string().max(200).optional(),
  actor: z.string().max(150).default('rasid'),
  source: z.string().max(100).default('developed-upload-map')
});

export async function manualClassificationOverrideRoutes(app: FastifyInstance) {
  app.patch('/classification/by-license/:licenseNumber', async request => {
    const { licenseNumber } = paramsSchema.parse(request.params);
    const body = bodySchema.parse(request.body);
    const department = String(body.department || '').trim() || null;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`
        INSERT INTO developed_licenses.manual_classification_overrides
          (license_number, dependency, department, actor, source, created_at, updated_at)
        VALUES ($1,$2,$3,$4,$5,now(),now())
        ON CONFLICT (license_number) DO UPDATE SET
          dependency=EXCLUDED.dependency,
          department=EXCLUDED.department,
          actor=EXCLUDED.actor,
          source=EXCLUDED.source,
          updated_at=now()
      `, [licenseNumber, body.dependency, department, body.actor, body.source]);

      const updated = await client.query(`
        UPDATE developed_licenses.licenses
        SET dependency=$2, department=$3, manual_classification=$4, manual_department=$3, updated_at=now()
        WHERE license_number=$1
        RETURNING *
      `, [licenseNumber, body.dependency, department, body.actor]);

      const row = updated.rows[0];
      if (row) {
        await client.query(`
          INSERT INTO developed_licenses.status_history
            (id,license_id,license_number,status,closure_request_status,rejection_reason,source,occurred_at)
          VALUES ($1,$2,$3,$4,$5,$6,'manual_classification',now())
        `, [randomUUID(), row.id, row.license_number, row.status, row.closure_request_status, row.rejection_reason]);
      }

      await client.query('COMMIT');
      return { ok: true, licenseNumber, dependency: body.dependency, department, appliedToExisting: Boolean(row), persisted: true };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  });
}
