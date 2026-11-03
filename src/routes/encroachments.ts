import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { pool } from '../db/pool.js';

const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwrCeFugL6G88ZaqGzno5glW2zU2nMpHlHOplxKcq5w8-moVkkfyDLre2V6vXSyBTdC/exec';
const KINDS = { my: 'التعديات', partner: 'التعديات', accident: 'الحوادث' } as const;
type Kind = keyof typeof KINDS;
const kindSchema = z.enum(['my', 'partner', 'accident']);

async function scriptUrl() {
  const { rows } = await pool.query<{ settings: Record<string, unknown> }>(`SELECT settings FROM developed_licenses.sources WHERE code='governance:collector' LIMIT 1`);
  return String(rows[0]?.settings?.appsScriptUrl || process.env.GOOGLE_SHEET_API_URL || DEFAULT_SCRIPT_URL).trim();
}

async function script(body: Record<string, unknown>, timeoutMs = 60000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(await scriptUrl(), { method: 'POST', headers: { 'content-type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body), signal: controller.signal, redirect: 'follow' });
    const text = await res.text();
    let data: Record<string, unknown> | null = null;
    try { data = JSON.parse(text); } catch { data = null; }
    if (!res.ok || !data) throw new Error(`Apps Script HTTP ${res.status}`);
    if (!data.ok) throw new Error(String(data.error || 'تعذر تنفيذ العملية في قاعدة الجامع'));
    return data;
  } finally { clearTimeout(timer); }
}

const s = (v: unknown) => (v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v));

function sheetRow(kind: Kind, r: Record<string, any>) {
  const manual = r.manual || {};
  const dep = manual.dependency || r.dependency || '';
  const dept = manual.department || r.department || '';
  const isAcc = kind === 'accident';
  return {
    'رقم البلاغ': s(r.reportNumber),
    'المصدر': isAcc ? 'الحوادث المرورية' : (kind === 'my' ? 'بلاغاتي' : 'بلاغات الجهات'),
    'الحالة': s(r.statusName),
    'تاريخ الإنشاء': s(r.createdAt),
    'تاريخ آخر تحديث': s(r.lastUpdatedAt),
    'مقدم البلاغ': s(isAcc ? r.affectedName : r.complainantName),
    'الجهة المالكة': s(isAcc ? r.partnerName : r.ownerPartnerName),
    'الجهة المتعدية / المسؤولة': s(isAcc ? r.responsibleName : r.encroachmentPartnerName),
    'المحافظة': s(r.governorate), 'الحي': s(r.neighborhood), 'الشارع': s(r.street),
    'خط الطول': s(r.longitude), 'خط العرض': s(r.latitude),
    'التبعية': s(dep), 'الإدارة': s(dept),
    'السجل (JSON)': s(r.reportLog || []),
    'المرفقات (JSON)': s({ attachments: r.attachments || [], responsibleAttachments: r.responsibleAttachments || [], stored: r.storedAttachments || {} }),
    'البيانات الكاملة (JSON)': s({ ...r, reportLog: undefined })
  };
}

const syncBody = z.object({
  kind: kindSchema,
  records: z.array(z.record(z.unknown())).min(1).max(1500),
  toSheet: z.boolean().default(true)
});

let tableReady: Promise<unknown> | null = null;
function ensureTable() {
  tableReady ||= pool.query(`CREATE TABLE IF NOT EXISTS developed_licenses.encroachment_records (kind text NOT NULL, report_number text NOT NULL, data jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (kind, report_number))`).catch(e => { tableReady = null; throw e; });
  return tableReady;
}

export default async function encroachmentRoutes(app: FastifyInstance) {
  app.addHook('onRequest', async () => { await ensureTable(); });
  app.get('/', async request => {
    const q = z.object({ kind: kindSchema.optional(), limit: z.coerce.number().int().min(1).max(5000).default(5000), offset: z.coerce.number().int().min(0).default(0) }).parse(request.query);
    const { rows } = await pool.query<{ kind: string; data: Record<string, unknown>; updated_at: string }>(
      `SELECT kind, data, updated_at FROM developed_licenses.encroachment_records ${q.kind ? 'WHERE kind=$1' : ''} ORDER BY (data->>'createdAt') DESC NULLS LAST, report_number LIMIT ${q.limit} OFFSET ${q.offset}`,
      q.kind ? [q.kind] : []
    );
    return { ok: true, total: rows.length, records: rows.map(r => ({ ...r.data, __kind: r.kind, __updatedAt: r.updated_at })) };
  });

  // Upsert records fetched from the Center (by the extension through the platform), keep manual overrides, mirror to the collector sheet.
  app.post('/sync', async request => {
    const body = syncBody.parse(request.body);
    const client = await pool.connect();
    let saved = 0;
    const merged: Record<string, any>[] = [];
    try {
      await client.query('BEGIN');
      for (const rec of body.records) {
        const num = s(rec.reportNumber).trim();
        if (!num) continue;
        const kinds: Kind[] = body.kind === 'accident' ? ['accident'] : (Array.isArray(rec.sourceKeys) && rec.sourceKeys.length ? (rec.sourceKeys as string[]).filter(k => k === 'my' || k === 'partner') as Kind[] : [body.kind]);
        for (const k of kinds.length ? kinds : [body.kind]) {
          const old = await client.query<{ data: Record<string, any> }>(`SELECT data FROM developed_licenses.encroachment_records WHERE kind=$1 AND report_number=$2`, [k, num]);
          const prev = old.rows[0]?.data || {};
          const next: Record<string, any> = { ...prev, ...rec, reportNumber: num, kind: k };
          if (prev.manual) next.manual = prev.manual;
          if (prev.storedAttachments) next.storedAttachments = { ...(prev.storedAttachments || {}), ...(rec.storedAttachments as object || {}) };
          if (prev.detailFetchedAt && rec.detailError) { next.detailError = ''; for (const key of Object.keys(prev)) if (next[key] === undefined || next[key] === '' || (Array.isArray(next[key]) && !next[key].length && Array.isArray(prev[key]) && prev[key].length)) next[key] = prev[key]; }
          if (!rec.detailError) next.detailFetchedAt = new Date().toISOString();
          await client.query(
            `INSERT INTO developed_licenses.encroachment_records(kind,report_number,data) VALUES($1,$2,$3::jsonb)
             ON CONFLICT(kind,report_number) DO UPDATE SET data=EXCLUDED.data, updated_at=now()`,
            [k, num, JSON.stringify(next)]
          );
          merged.push({ ...next, __k: k });
          saved++;
        }
      }
      await client.query('COMMIT');
    } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }

    let sheet: Record<string, unknown> | { ok: false; error: string } = { ok: false, error: 'skipped' };
    if (body.toSheet) {
      try {
        const bySheet = new Map<string, Record<string, unknown>[]>();
        for (const r of merged) { const k = r.__k as Kind; const name = KINDS[k]; const list = bySheet.get(name) || []; list.push(sheetRow(k, r)); bySheet.set(name, list); }
        const results: unknown[] = [];
        for (const [name, list] of bySheet) {
          // one row per report number in sheet (my + partner share «التعديات»)
          const uniq = new Map<string, Record<string, unknown>>();
          for (const row of list) { const key = String(row['رقم البلاغ']); const old = uniq.get(key); uniq.set(key, old ? { ...old, 'المصدر': old['المصدر'] === row['المصدر'] ? old['المصدر'] : 'بلاغاتي + بلاغات الجهات' } : row); }
          const arr = [...uniq.values()];
          for (let i = 0; i < arr.length; i += 150) results.push(await script({ action: 'upsertRecords', sheetName: name, records: arr.slice(i, i + 150) }, 90000));
        }
        sheet = { ok: true, batches: results.length };
      } catch (e) { sheet = { ok: false, error: String((e as Error).message || e) }; }
    }
    return { ok: true, saved, sheet };
  });

  // Manual dependency of accidents (and encroachments if ever needed).
  app.put('/dependency', async request => {
    const b = z.object({
      kind: kindSchema.default('accident'), reportNumber: z.string().min(1).max(60),
      dependency: z.enum(['تابع', 'غير تابع']), department: z.string().min(1).max(200),
      actor: z.object({ name: z.string().max(200).optional(), email: z.string().max(200).optional() }).optional()
    }).parse(request.body);
    const manual = { dependency: b.dependency, department: b.department, actor: b.actor || {}, at: new Date().toISOString() };
    const { rows } = await pool.query(
      `UPDATE developed_licenses.encroachment_records SET data = jsonb_set(data,'{manual}',$3::jsonb,true), updated_at=now() WHERE kind=$1 AND report_number=$2 RETURNING data`,
      [b.kind, b.reportNumber, JSON.stringify(manual)]
    );
    if (!rows[0]) throw Object.assign(Error('البلاغ غير موجود في قاعدة راصد.'), { statusCode: 404 });
    let sheet: unknown = { ok: false };
    try { sheet = await script({ action: 'upsertRecords', sheetName: KINDS[b.kind], records: [{ 'رقم البلاغ': b.reportNumber, 'التبعية': b.dependency, 'الإدارة': b.department }] }); } catch (e) { sheet = { ok: false, error: String((e as Error).message || e) }; }
    return { ok: true, record: rows[0].data, sheet };
  });

  // Save an attachment file into the collector storage (Drive) and remember its id.
  app.post('/attachment', async request => {
    const b = z.object({
      kind: kindSchema, reportNumber: z.string().min(1).max(60), metaNumber: z.string().min(1).max(120),
      name: z.string().max(300).default('attachment'), mime: z.string().max(120).default('application/octet-stream'), base64: z.string().min(1)
    }).parse(request.body);
    const saved = await script({ action: 'saveAttachment', folder: b.kind === 'accident' ? 'الحوادث' : 'التعديات', recordId: b.reportNumber, name: `${b.metaNumber}-${b.name}`, mime: b.mime, base64: b.base64 }, 90000);
    const entry = { fileId: String(saved.fileId || ''), url: String(saved.url || ''), name: b.name, mime: b.mime, savedAt: new Date().toISOString() };
    const kinds: Kind[] = b.kind === 'accident' ? ['accident'] : ['my', 'partner'];
    let recordForSheet: Record<string, any> | null = null;
    for (const k of kinds) {
      const { rows } = await pool.query(
        `UPDATE developed_licenses.encroachment_records SET data = jsonb_set(data,ARRAY['storedAttachments',$3],$4::jsonb,true), updated_at=now() WHERE kind=$1 AND report_number=$2 RETURNING data`,
        [k, b.reportNumber, b.metaNumber, JSON.stringify(entry)]
      );
      if (rows[0]) recordForSheet = rows[0].data;
    }
    if (recordForSheet) {
      try { await script({ action: 'upsertRecords', sheetName: KINDS[b.kind], records: [{ 'رقم البلاغ': b.reportNumber, 'المرفقات (JSON)': s({ attachments: recordForSheet.attachments || [], responsibleAttachments: recordForSheet.responsibleAttachments || [], stored: recordForSheet.storedAttachments || {} }) }] }); } catch { /* sheet mirror is best-effort */ }
    }
    return { ok: true, ...entry };
  });

  app.get('/attachment', async (request, reply) => {
    const q = z.object({ fileId: z.string().min(5).max(200) }).parse(request.query);
    const r = await script({ action: 'readAttachment', fileId: q.fileId }, 90000);
    reply.header('Cache-Control', 'private, max-age=86400');
    return { ok: true, name: r.name, mime: r.mime, base64: r.base64 };
  });

  // Rebuild Postgres from the collector sheets (disaster recovery / first use without the extension).
  app.post('/import-sheet', async request => {
    const b = z.object({ sheetName: z.enum(['التعديات', 'الحوادث']) }).parse(request.body);
    let startRow = 2, done = false, imported = 0, guard = 0;
    while (!done && guard++ < 200) {
      const r = await script({ action: 'readRecords', sheetName: b.sheetName, startRow, chunkSize: 300 });
      const headers = (r.headers as string[]) || [];
      for (const row of (r.rows as unknown[][]) || []) {
        const o: Record<string, unknown> = {}; headers.forEach((h, i) => { if (h) o[h] = row[i]; });
        let data: Record<string, any> = {};
        try { data = JSON.parse(String(o['البيانات الكاملة (JSON)'] || '{}')); } catch { data = {}; }
        try { data.reportLog = JSON.parse(String(o['السجل (JSON)'] || '[]')); } catch { /* ignore */ }
        const num = String(o['رقم البلاغ'] || '').trim(); if (!num) continue;
        data.reportNumber = num;
        const kinds: Kind[] = b.sheetName === 'الحوادث' ? ['accident'] : (Array.isArray(data.sourceKeys) && data.sourceKeys.length ? data.sourceKeys : ['partner']);
        if (o['التبعية'] && o['الإدارة']) data.manual = data.manual || { dependency: o['التبعية'], department: o['الإدارة'] };
        for (const k of kinds) { await pool.query(`INSERT INTO developed_licenses.encroachment_records(kind,report_number,data) VALUES($1,$2,$3::jsonb) ON CONFLICT(kind,report_number) DO NOTHING`, [k, num, JSON.stringify({ ...data, kind: k })]); imported++; }
      }
      done = Boolean(r.done); startRow = Number(r.nextStartRow || startRow + 300);
    }
    return { ok: true, imported };
  });
}
