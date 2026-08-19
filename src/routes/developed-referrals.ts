import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { pool } from '../db/pool.js';

const referralBody = z.object({
  licenseNumbers: z.array(z.string().min(1).max(120)).max(5000).default([]),
  actor: z.string().max(150).default('system')
});

export async function developedReferralRoutes(app: FastifyInstance) {
  app.post('/referrals', async request => {
    const body = referralBody.parse(request.body ?? {});
    const numbers = [...new Set(body.licenseNumbers.map(x => x.trim()).filter(Boolean))];
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const values: unknown[] = [];
      let numberFilter = '';
      if (numbers.length) {
        values.push(numbers);
        numberFilter = ` AND license_number = ANY($1::text[])`;
      }

      const eligible = await client.query(
        `SELECT id, license_number, status, closure_request_status
         FROM developed_licenses.licenses
         WHERE dependency = 'تابع'
           AND closure_request_status = 'تحت معالجة الجهة المشرفة'
           ${numberFilter}
         FOR UPDATE`,
        values
      );

      let referred = 0;
      let alreadyReferred = 0;

      for (const row of eligible.rows) {
        if (row.status === 'تحت الإجراء') {
          alreadyReferred++;
          continue;
        }

        await client.query(
          `UPDATE developed_licenses.licenses
           SET status = 'تحت الإجراء', status_date = now(), updated_at = now()
           WHERE id = $1`,
          [row.id]
        );

        await client.query(
          `INSERT INTO developed_licenses.status_history
             (id, license_id, license_number, status, closure_request_status, rejection_reason, source, occurred_at)
           VALUES ($1,$2,$3,'تحت الإجراء',$4,NULL,'manual_referral',now())`,
          [randomUUID(), row.id, row.license_number, row.closure_request_status]
        );

        referred++;
      }

      await client.query('COMMIT');
      return {
        ok: true,
        requested: numbers.length,
        eligible: eligible.rowCount ?? eligible.rows.length,
        referred,
        alreadyReferred
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  });
}
