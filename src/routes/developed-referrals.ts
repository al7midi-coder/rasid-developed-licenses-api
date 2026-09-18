import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { pool } from '../db/pool.js';

const referralBody = z.object({
  licenseNumbers: z.array(z.string().min(1).max(120)).max(20000).default([]),
  actor: z.string().max(150).default('system')
});

export async function developedReferralRoutes(app: FastifyInstance) {
  app.post('/referrals', async (request, reply) => {
    const body = referralBody.parse(request.body ?? {});
    const numbers = [...new Set(body.licenseNumbers.map(x => x.trim()).filter(Boolean))];
    if (!numbers.length) {
      return { ok: true, requested: 0, eligible: 0, referred: 0, alreadyReferred: 0, processed: 0, complete: true, missingNumbers: [], ineligibleNumbers: [] };
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Feature 2/3/4 referral contract: every requested related license must be handled
      // in one transaction. Closure-request status is NOT allowed to silently drop a
      // related/matched license from the referral count.
      const selected = await client.query(
        `SELECT id, license_number, dependency, status, closure_request_status
         FROM developed_licenses.licenses
         WHERE license_number = ANY($1::text[])
         FOR UPDATE`,
        [numbers]
      );

      const byNumber = new Map(selected.rows.map(row => [String(row.license_number), row]));
      const missingNumbers = numbers.filter(n => !byNumber.has(n));
      const ineligibleNumbers = numbers.filter(n => {
        const row = byNumber.get(n);
        return row && row.dependency !== 'تابع';
      });

      // Never perform a partial referral. If even one requested number is missing or
      // is not stored as related, roll the whole request back and tell the UI exactly why.
      if (missingNumbers.length || ineligibleNumbers.length) {
        await client.query('ROLLBACK');
        return reply.code(409).send({
          ok: false,
          error: `تعذر إحالة كامل العدد: المطلوب ${numbers.length}، المفقود ${missingNumbers.length}، وغير التابع ${ineligibleNumbers.length}. لم تتم إحالة أي رخصة من هذه الدفعة.`,
          requested: numbers.length,
          eligible: numbers.length - missingNumbers.length - ineligibleNumbers.length,
          referred: 0,
          alreadyReferred: 0,
          processed: 0,
          complete: false,
          missingNumbers,
          ineligibleNumbers
        });
      }

      let referred = 0;
      let alreadyReferred = 0;
      for (const number of numbers) {
        const row = byNumber.get(number)!;
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

      const processed = referred + alreadyReferred;
      if (processed !== numbers.length) {
        throw new Error(`REFERRAL_COUNT_MISMATCH requested=${numbers.length} processed=${processed}`);
      }

      await client.query('COMMIT');
      return {
        ok: true,
        requested: numbers.length,
        eligible: numbers.length,
        referred,
        alreadyReferred,
        processed,
        complete: true,
        missingNumbers: [],
        ineligibleNumbers: []
      };
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch {}
      throw error;
    } finally {
      client.release();
    }
  });
}
