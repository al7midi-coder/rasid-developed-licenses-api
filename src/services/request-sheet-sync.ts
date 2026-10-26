import { pool } from '../db/pool.js';

/** Pushes DEPENDENT (تابع) unblocking requests, with their attachments, to the Collector Google Sheet
 *  (sheet «طلبات رفع الحظر التابعة» + Drive folder) through the collector Apps Script action `upsertRequests`. */
const SHEET_NAME = 'طلبات رفع الحظر التابعة';
const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwrCeFugL6G88ZaqGzno5glW2zU2nMpHlHOplxKcq5w8-moVkkfyDLre2V6vXSyBTdC/exec';
const MAX_PAYLOAD = 24 * 1024 * 1024;

async function scriptUrl() {
  const { rows } = await pool.query<{ settings: Record<string, unknown> }>(`SELECT settings FROM developed_licenses.sources WHERE code='governance:collector' LIMIT 1`);
  return String(rows[0]?.settings?.appsScriptUrl || DEFAULT_SCRIPT_URL).trim();
}

const s = (v: unknown) => (v == null ? '' : String(v));

function fields(r: any): Record<string, unknown> {
  const snap = r.row_snapshot || {};
  const ci = snap.centerInfo || {};
  const cls = r.classification || {};
  const coords = Array.isArray(snap.coordinates) && snap.coordinates.length
    ? snap.coordinates.slice(0, 1).map((c: any) => `${c.lat},${c.lng}`).join('')
    : (cls.latitude != null ? `${cls.latitude},${cls.longitude}` : '');
  return {
    'رقم الطلب': s(r.center_request_id),
    'رقم الرخصة': s(r.license_number),
    'حالة الطلب في المركز': s(r.center_status),
    'حالة الطلب في راصد': s(r.status),
    'التبعية': s(cls.dependency),
    'الإدارة': s(r.department),
    'سبب التصنيف': s(cls.reason),
    'مشرف الحظر': s(ci.blockingSupervisor),
    'جوال مشرف الحظر': s(ci.blockingSupervisorPhone),
    'اسم المشرف': s(ci.supervisor),
    'جوال المشرف': s(ci.supervisorPhone),
    'رقم المشرف': s(ci.supervisorNo),
    'رقم القيد': s(ci.regNo),
    'اسم المقاول': s(r.contractor),
    'اسم الاستشاري': s(r.consultant),
    'اسم الجهة المالكة': s(r.owner),
    'اسم المشروع': s(r.project),
    'الطريق': s(r.road),
    'نوع الحفر': s(r.dig_type),
    'طول الرخصة': r.length_m == null ? '' : s(r.length_m),
    'تصنيف الترخيص': s(ci.licenseClass),
    'نوع الترخيص': s(ci.licenseType),
    'حالة الرخصة': s(ci.licenseStatus),
    'تاريخ بداية الحفر': s(ci.startDate),
    'تاريخ انتهاء الرخصة': s(ci.endDate),
    'نوع التقاطع': s(ci.intersectionType),
    'وصف العمل': s(ci.workDescription || r.works_description),
    'الإحداثيات': coords,
    'تاريخ استلام الطلب': r.received_at ? new Date(r.received_at).toISOString() : ''
  };
}

export async function pushDependentRequests(opts: { ids?: string[]; limit?: number } = {}) {
  const url = await scriptUrl();
  const limit = Math.min(Math.max(opts.limit ?? 10, 1), 25);
  const params: unknown[] = [];
  let where = `classification->>'dependency' = 'تابع' AND center_request_id IS NOT NULL`;
  if (opts.ids && opts.ids.length) { params.push(opts.ids); where += ` AND id = ANY($1::uuid[])`; }
  else where += ` AND (row_snapshot->'sheetSync'->>'at' IS NULL OR updated_at > (row_snapshot->'sheetSync'->>'at')::timestamptz OR EXISTS (SELECT 1 FROM developed_licenses.coordination_request_attachments a WHERE a.request_id = coordination_requests.id AND NOT a.deleted AND a.created_at > (row_snapshot->'sheetSync'->>'at')::timestamptz))`;
  const reqs = (await pool.query(`SELECT * FROM developed_licenses.coordination_requests WHERE ${where} ORDER BY updated_at DESC LIMIT ${limit}`, params)).rows;
  const out = { ok: true, pushed: 0, failed: 0, remaining: 0, errors: [] as string[] };
  for (const r of reqs) {
    try {
      const prev = (r.row_snapshot?.sheetSync?.files || {}) as Record<string, string>;
      const atts = (await pool.query(
        `SELECT id, doc_type, filename, mime_type, size_bytes FROM developed_licenses.coordination_request_attachments WHERE request_id=$1 AND NOT deleted ORDER BY created_at`, [r.id])).rows;
      const files: { id: string; name: string; mime: string; type: string; base64: string }[] = [];
      let total = 0;
      for (const a of atts) {
        if (prev[a.id]) continue;
        if (total + Number(a.size_bytes) * 1.4 > MAX_PAYLOAD) continue;
        const b = (await pool.query(`SELECT encode(data,'base64') AS b64 FROM developed_licenses.coordination_request_attachments WHERE id=$1`, [a.id])).rows[0];
        if (!b) continue;
        total += Number(a.size_bytes) * 1.4;
        files.push({ id: a.id, name: a.filename, mime: a.mime_type, type: a.doc_type, base64: b.b64 });
      }
      const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'upsertRequests', sheetName: SHEET_NAME, records: [{ requestNumber: s(r.center_request_id), fields: fields(r), attachments: files, attachmentCount: atts.length }] }) });
      if (!res.ok) throw new Error(`Apps Script HTTP ${res.status}`);
      const j = await res.json() as any;
      if (!j || !j.ok) throw new Error(String(j?.error || 'upsertRequests failed (أعد نشر سكربت الجامع بالإصدار الجديد)'));
      const links = { ...prev, ...((j.files || {}) as Record<string, string>) };
      const sync = { at: new Date().toISOString(), files: links, folderUrl: j.folderUrl || '', sheet: SHEET_NAME };
      await pool.query(`UPDATE developed_licenses.coordination_requests SET row_snapshot = jsonb_set(coalesce(row_snapshot,'{}'::jsonb),'{sheetSync}',$2::jsonb,true) WHERE id=$1`, [r.id, JSON.stringify(sync)]);
      out.pushed++;
    } catch (e: any) {
      out.failed++; out.errors.push(`${r.center_request_id}: ${String(e?.message || e).slice(0, 160)}`);
    }
  }
  const rem = await pool.query(`SELECT count(*)::int AS n FROM developed_licenses.coordination_requests WHERE classification->>'dependency'='تابع' AND center_request_id IS NOT NULL AND row_snapshot->'sheetSync'->>'at' IS NULL`);
  out.remaining = rem.rows[0]?.n ?? 0;
  return out;
}
