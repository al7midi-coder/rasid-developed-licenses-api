import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { pool } from '../db/pool.js';

const GOOGLE_SHEET_API_URL = process.env.GOOGLE_SHEET_API_URL || 'https://script.google.com/macros/s/AKfycbwrCeFugL6G88ZaqGzno5glW2zU2nMpHlHOplxKcq5w8-moVkkfyDLre2V6vXSyBTdC/exec';

const querySchema = z.object({
  scope: z.enum(['all','related','unrelated','related-routes','transit','main','bridges']).default('all'),
  limit: z.coerce.number().int().min(1).max(120000).default(120000)
});

const decisionSchema = z.object({
  decision: z.enum(['مقبول','مرفوض','مقبول تلقائياً','تحت معالجة جهة أخرى']),
  rejectionReason: z.string().max(500).optional(),
  actor: z.string().max(150).default('راصد'),
  previousClosureStatus: z.string().max(150).optional(),
  centerApplied: z.boolean().default(false),
  centerStatus: z.string().max(150).optional()
}).superRefine((value, ctx) => {
  if (value.decision === 'مرفوض' && !String(value.rejectionReason || '').trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['rejectionReason'], message: 'سبب الرفض مطلوب' });
  }
});

const RELATED_SCOPE_SQL = `(
  TRIM(COALESCE(l.dependency,'')) = 'تابع'
  OR l.department IN ('محاور النقل العام','المحاور الرئيسية','الجسور والأنفاق')
  OR (
    l.id IS NOT NULL
    AND TRIM(COALESCE(l.dependency,'')) <> 'غير تابع'
  )
)`;

const SUPERVISOR_STATUSES = new Set(['تحت معالجة الجهة المشرفة','تحت معالجة الجهة الإشرافية','تحت معالجة الجهة الاشرافية']);
const OWNER_STATUS = 'تحت معالجة الجهة المالكة';

function normalizeArabic(value: unknown) {
  return String(value || '')
    .trim()
    .normalize('NFKD')
    .replace(/[\u064B-\u065F\u0670ـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function terminalDecisionFromCenterStatus(status: unknown): 'مقبول' | 'مرفوض' | '' {
  const s = normalizeArabic(status);
  if (!s) return '';
  if (/معاد|اعاده|اعيد|مرفوض|رفض/u.test(s)) return 'مرفوض';
  if (/مقبول|تم القبول|مغلق/u.test(s)) return 'مقبول';
  return '';
}

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
    let data: unknown = null;
    try { data = JSON.parse(text); } catch {}
    if (!response.ok) throw Object.assign(Error(`Google Sheet API HTTP ${response.status}`), { statusCode: 502 });
    if (!data || typeof data !== 'object' || !('ok' in data) || !(data as { ok?: boolean }).ok) {
      const message = data && typeof data === 'object' && 'error' in data ? String((data as { error?: unknown }).error || '') : text;
      throw Object.assign(Error(message || 'فشل تحديث قاعدة الجامع'), { statusCode: 502 });
    }
    return data as Record<string, unknown>;
  } finally {
    clearTimeout(timeout);
  }
}

async function syncDecisionToCollectorSheets(licenseNumber: string, decision: string, reason: string | null, actor: string) {
  const now = new Date().toISOString();
  const record = {
    licenseNumber,
    fields: {
      'رقم الرخصة': licenseNumber,
      'حالة طلب الإغلاق': decision,
      'الحالة': decision,
      'السبب': reason || '',
      'اسم المعالج': actor,
      'تاريخ آخر إجراء': now
    }
  };
  const results: Array<{ sheetName: string; ok: boolean; error?: string }> = [];
  for (const sheetName of ['التراخيص التابعة', 'التراخيص']) {
    try {
      await sheetPost({ action: 'upsertBatch', sheetName, records: [record] });
      results.push({ sheetName, ok: true });
    } catch (error) {
      results.push({ sheetName, ok: false, error: error instanceof Error ? error.message : String(error) });
    }
  }
  return { ok: results.every(item => item.ok), results };
}

export async function developedExportRoutes(app: FastifyInstance) {
  app.get('/rows', async request => {
    const { scope, limit } = querySchema.parse(request.query);
    const where: string[] = [];
    const values: unknown[] = [];

    if (scope === 'related') where.push(RELATED_SCOPE_SQL);
    if (scope === 'unrelated') where.push("TRIM(COALESCE(l.dependency,'')) = 'غير تابع'");
    if (scope === 'related-routes') where.push("l.department IN ('محاور النقل العام','المحاور الرئيسية','الجسور والأنفاق') AND TRIM(COALESCE(l.dependency,'')) <> 'غير تابع'");
    if (scope === 'transit') where.push("l.department = 'محاور النقل العام' AND TRIM(COALESCE(l.dependency,'')) <> 'غير تابع'");
    if (scope === 'main') where.push("l.department = 'المحاور الرئيسية' AND TRIM(COALESCE(l.dependency,'')) <> 'غير تابع'");
    if (scope === 'bridges') where.push("l.department = 'الجسور والأنفاق' AND TRIM(COALESCE(l.dependency,'')) <> 'غير تابع'");

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
        l.extra_payload,
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

  app.post('/closure-decision-synced/:id', async request => {
    const id = z.string().uuid().parse((request.params as { id: string }).id);
    const body = decisionSchema.parse(request.body);
    const client = await pool.connect();
    let updatedRow: Record<string, unknown> | null = null;
    let licenseNumber = '';
    let reason: string | null = null;
    try {
      await client.query('BEGIN');
      const current = await client.query(`SELECT * FROM developed_licenses.licenses WHERE id=$1 FOR UPDATE`, [id]);
      const row = current.rows[0];
      if (!row) throw Object.assign(Error('الرخصة غير موجودة'), { statusCode: 404 });
      licenseNumber = String(row.license_number || '').trim();
      const currentClosure = String(row.closure_request_status || '').trim();
      const centerTerminalDecision = terminalDecisionFromCenterStatus(body.centerStatus);
      const normalizedCenterStatus = normalizeArabic(body.centerStatus);
      const isOwnerReturnedByCenter = Boolean(
        currentClosure === OWNER_STATUS &&
        body.centerApplied &&
        body.decision === 'مرفوض' &&
        centerTerminalDecision === 'مرفوض' &&
        /معاد.*الجهه المالك|اعاد.*الجهه المالك|مرفوض.*الجهه المالك/u.test(normalizedCenterStatus)
      );
      if (currentClosure === OWNER_STATUS && !isOwnerReturnedByCenter) {
        throw Object.assign(Error('حالة طلب الإغلاق ما زالت في مرحلة الجهة المالكة ولم تثبت إعادة الطلب من المركز.'), { statusCode: 409 });
      }
      if (!SUPERVISOR_STATUSES.has(currentClosure) && !isOwnerReturnedByCenter) {
        throw Object.assign(Error(`تغيرت حالة طلب الإغلاق إلى «${currentClosure || 'غير محددة'}». حدّث الصفحة قبل المعالجة.`), { statusCode: 409 });
      }
      if (body.previousClosureStatus && String(body.previousClosureStatus).trim() !== currentClosure && !isOwnerReturnedByCenter) {
        throw Object.assign(Error(`تغيرت حالة طلب الإغلاق من «${body.previousClosureStatus}» إلى «${currentClosure}». أعد التحديث قبل المعالجة.`), { statusCode: 409 });
      }

      const isVerifiedCenterReconciliation = Boolean(
        body.centerApplied &&
        centerTerminalDecision &&
        centerTerminalDecision === body.decision &&
        (SUPERVISOR_STATUSES.has(currentClosure) || isOwnerReturnedByCenter)
      );

      if (
        row.processing_deadline &&
        new Date(String(row.processing_deadline)).getTime() <= Date.now() &&
        !isVerifiedCenterReconciliation
      ) {
        throw Object.assign(Error('انتهت فترة المعالجة لهذه الرخصة. أعد قراءة حالتها من المركز قبل اتخاذ قرار.'), { statusCode: 409 });
      }
      if ((body.decision === 'مقبول' || body.decision === 'مرفوض') && !body.centerApplied) {
        throw Object.assign(Error('لم يتم تأكيد تنفيذ القرار في المركز؛ تم منع تحديث قواعد البيانات.'), { statusCode: 409 });
      }

      reason = body.decision === 'مرفوض' ? String(body.rejectionReason || '').trim() : null;
      const updated = await client.query(`UPDATE developed_licenses.licenses
        SET status=$2,closure_request_status=$2,rejection_reason=$3,status_date=now(),
            closure_date=CASE WHEN $2::text IN ('مقبول','مقبول تلقائياً') THEN COALESCE(closure_date,now()) ELSE closure_date END,
            updated_at=now()
        WHERE id=$1 RETURNING *`, [id, body.decision, reason]);
      updatedRow = updated.rows[0] as Record<string, unknown>;
      await client.query(`INSERT INTO developed_licenses.closure_events(id,license_id,license_number,decision,rejection_reason,decided_by,decided_at,previous_status,new_status,previous_closure_request_status,new_closure_request_status,source_system,metadata)
        VALUES($1,$2,$3,$4,$5,$6,now(),$7,$8,$9,$10,'developed_api_v3570',$11::jsonb)`, [randomUUID(), id, row.license_number, body.decision, reason, body.actor, row.status, body.decision, row.closure_request_status, body.decision, JSON.stringify({ centerApplied: body.centerApplied, centerStatus: body.centerStatus || null })]);
      await client.query(`INSERT INTO developed_licenses.status_history(id,license_id,license_number,status,closure_request_status,rejection_reason,source,occurred_at)
        VALUES($1,$2,$3,$4,$5,$6,'closure_decision_v3570',now())`, [randomUUID(), id, row.license_number, body.decision, body.decision, reason]);
      await client.query('COMMIT');
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch {}
      throw error;
    } finally {
      client.release();
    }

    const sheetSync = await syncDecisionToCollectorSheets(licenseNumber, body.decision, reason, body.actor);
    return {
      ok: true,
      row: updatedRow,
      sheetSync,
      message: sheetSync.ok
        ? 'تم اعتماد حالة المركز وتحديث راصد وقاعدة الجامع.'
        : 'تم اعتماد حالة المركز وتحديث راصد، وتعذرت مزامنة بعض شيتات الجامع.'
    };
  });
}
