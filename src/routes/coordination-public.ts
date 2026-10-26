import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createHash } from 'node:crypto';
import { q, t, tx, parse, httpError, uploadSchema, decodeUpload, installErrorHandler, MISSING_TEXT, NOT_FOUND_TEXT, iso } from '../services/coordination-common.js';
import { issueToken, verifyToken } from '../services/coordination-token.js';
import { RateLimiter } from '../services/coordination-ratelimit.js';
import { audit } from '../services/coordination-audit.js';
import { missingFrom, docTypesPresent, recomputeLicence, FORM_KEYS } from '../services/coordination-requests.js';
import { PUBLIC_STATUS } from '../services/coordination-state.js';
import { generatePdf } from '../services/coordination-minutes.js';
import { signedUploadFlow } from '../services/coordination-flow.js';

/** Shared limiter (exported so tests / ops can tune): 20 requests per minute per IP, plus a not-found counter against enumeration. */
export const publicLimiter = new RateLimiter(20, 60_000, 8, 10 * 60_000);
const MIN_LOOKUP_MS = Number(process.env.COORD_PUBLIC_MIN_MS ?? 150);
const BIG = { bodyLimit: 30 * 1024 * 1024 };
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const HASH_SALT = process.env.COORD_HMAC_SECRET || 'coord';
const ipHash = (ip: string) => createHash('sha256').update(HASH_SALT + ip).digest('hex').slice(0, 24);
const AR = /[٠-٩]/g;
const toEn = (s: string) => s.replace(AR, c => String(c.charCodeAt(0) - 0x0660));
const OPEN_FOR_APPLICANT = ['RECEIVED', 'MISSING_DOCUMENTS', 'DOCUMENTS_COMPLETE', 'RETURNED'];
const DOWNLOADABLE = ['WAITING_EXTERNAL_SIGNATURES', 'SIGNED_EXTERNAL_UPLOADED', 'WAITING_ORIGINAL_DELIVERY', 'ORIGINAL_RECEIVED', 'COMPLETED'];
const TYPE_EXT: Record<string, string[]> = {
  EXEC_DRAWINGS: ['pdf', 'dwg', 'dxf', 'zip', 'png', 'jpg', 'jpeg'],
  WORKPATH_KMZ: ['kmz', 'kml'],
  SITE_PHOTO_REPORT: ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg', 'zip']
};
// status severity for the aggregated licence status (worst first)
const SEVERITY = ['MISSING_DOCUMENTS', 'RETURNED', 'REJECTED', 'RECEIVED', 'DOCUMENTS_COMPLETE', 'REFERRED', 'UNDER_REVIEW', 'WAITING_MINUTES_SIGNATURE', 'WAITING_ORIGINAL_MINUTES', 'APPROVED', 'COMPLETED'];

const formSchema = z.object({
  contractorName: z.string().max(200).optional(), contractorRepName: z.string().max(200).optional(), consultantName: z.string().max(200).optional(), consultantRepName: z.string().max(200).optional(),
  ownerName: z.string().max(200).optional(), ownerRepName: z.string().max(200).optional(), projectName: z.string().max(300).optional(), contactName: z.string().max(200).optional(),
  contactPhone: z.string().max(30).regex(/^[0-9+\s\-()]{0,30}$/).optional(), contactEmail: z.string().max(200).regex(/^([^@\s]+@[^@\s]+\.[^@\s]+)?$/).optional(),
  contractorNameMismatch: z.boolean().optional(), contractorNameOnLicence: z.string().max(300).optional()
}).strict();

export async function coordinationPublicRoutes(app: FastifyInstance) {
  installErrorHandler(app);

  const guard = (req: any, reply: any) => {
    const key = String(req.ip ?? 'unknown');
    if (!publicLimiter.hit(key)) {
      reply.header('retry-after', '30');
      throw httpError(429, 'تم تجاوز عدد المحاولات المسموح بها، يرجى الانتظار قليلاً ثم المحاولة مرة أخرى.', 'RATE_LIMITED');
    }
    return key;
  };
  const bad = () => httpError(401, 'انتهت صلاحية الجلسة، يرجى البحث من جديد.', 'TOKEN');

  async function licenceRequests(license: string) {
    return (await q(undefined, `SELECT * FROM ${t('coordination_requests')} WHERE license_number=$1 ORDER BY received_at, id`, [license])).rows;
  }
  const origin = (req: any) => {
    const proto = String(req.headers['x-forwarded-proto'] ?? req.protocol ?? 'https').split(',')[0];
    return `${proto}://${req.headers['x-forwarded-host'] ?? req.headers.host ?? ''}`;
  };

  app.post('/lookup', async (req, reply) => {
    const started = Date.now();
    const key = guard(req, reply);
    const b = parse(z.object({ query: z.string().min(1).max(60) }), req.body);
    const needle = toEn(b.query).replace(/[\s‎‏]+/g, '');
    const notFound = async () => {
      publicLimiter.miss(key);
      const wait = MIN_LOOKUP_MS - (Date.now() - started);
      if (wait > 0) await sleep(wait);
      return { ok: true, found: false, message: NOT_FOUND_TEXT };
    };
    if (!/^[0-9A-Za-z\-_/]{3,40}$/.test(needle)) return notFound();
    const hit = (await q(undefined, `SELECT license_number FROM ${t('coordination_requests')} WHERE license_number=$1 OR center_request_id=$1 ORDER BY received_at LIMIT 1`, [needle])).rows[0];
    if (!hit) return notFound();
    const license = hit.license_number as string;
    const reqs = await licenceRequests(license);
    const present = new Set<string>();
    for (const r of reqs) for (const x of await docTypesPresent(undefined, r.id, r.row_snapshot)) present.add(x);
    const missing = missingFrom(present);
    const att = (await q(undefined, `SELECT a.id, a.doc_type, a.filename FROM ${t('coordination_request_attachments')} a JOIN ${t('coordination_requests')} r ON r.id=a.request_id
        WHERE r.license_number=$1 AND a.visibility='PUBLIC_TO_APPLICANT' AND NOT a.deleted ORDER BY a.created_at`, [license])).rows;
    const token = issueToken(license);
    const sev = (s: string) => { const i = SEVERITY.indexOf(s); return i < 0 ? 99 : i; };
    const agg = reqs.map((r: any) => r.status as string).sort((x, y) => sev(x) - sev(y))[0];
    const primary = reqs[0];
    const form: Record<string, string> = {};
    for (const r of reqs) for (const k of FORM_KEYS) { const v = r.form?.[k]; if (v && !form[k]) form[k] = String(v); }
    const rej = reqs.find((r: any) => ['RETURNED', 'REJECTED'].includes(r.status) && r.rejection);
    const m = (await q(undefined, `SELECT m.status FROM ${t('coordination_minutes')} m JOIN ${t('coordination_minutes_requests')} mr ON mr.minutes_id=m.id JOIN ${t('coordination_requests')} r ON r.id=mr.request_id
        WHERE r.license_number=$1 AND m.status <> 'CANCELLED' ORDER BY m.seq DESC LIMIT 1`, [license])).rows[0];
    const base = `${origin(req)}${String(req.url).replace(/\/lookup.*$/, '')}`;
    const request: Record<string, unknown> = {
      ids: reqs.map((r: any) => r.center_request_id).filter(Boolean), licenseNumber: license, status: agg, publicStatus: PUBLIC_STATUS[agg] ?? 'قيد المعالجة',
      missing, contractor: primary.contractor, road: primary.road, digType: primary.dig_type, project: primary.project, form,
      attachments: att.map((a: any) => ({ type: a.doc_type, filename: a.filename, url: `${base}/files/${encodeURIComponent(token)}/${a.id}` })),
      updatedAt: new Date(Math.max(...reqs.map((r: any) => new Date(r.updated_at).getTime()))).toISOString()
    };
    if (missing.length && OPEN_FOR_APPLICANT.includes(agg)) request.missingText = MISSING_TEXT;
    if (rej) request.rejection = { reason: rej.rejection.reason ?? '', allowedStatements: rej.rejection.allowedStatements ?? [], requiredFixes: rej.rejection.requiredFixes ?? [] };
    if (m) request.minutes = { status: m.status, canDownload: DOWNLOADABLE.includes(m.status), canUploadSigned: m.status === 'WAITING_EXTERNAL_SIGNATURES' };
    const wait = MIN_LOOKUP_MS - (Date.now() - started);
    if (wait > 0) await sleep(wait);
    return { ok: true, found: true, token, request };
  });

  app.post('/submit-form', async (req, reply) => {
    const key = guard(req, reply);
    const b = parse(z.object({ token: z.string().max(600), form: formSchema }), req.body);
    const tk = verifyToken(b.token);
    if (!tk) throw bad();
    return tx(async db => {
      const reqs = (await q(db, `SELECT id, form, status FROM ${t('coordination_requests')} WHERE license_number=$1 FOR UPDATE`, [tk.licenseNumber])).rows;
      const open = reqs.filter((r: any) => OPEN_FOR_APPLICANT.includes(r.status));
      if (!reqs.length) throw bad();
      if (!open.length) throw httpError(409, 'لا يمكن تعديل البيانات في الحالة الحالية للطلب.', 'BAD_STATE');
      const clean: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(b.form)) clean[k] = typeof v === 'string' ? toEn(v).trim() : v; // contractor on the licence is never overridden; the mismatch is only recorded
      for (const r of open) {
        await q(db, `UPDATE ${t('coordination_requests')} SET form = form || $2::jsonb, updated_at=now() WHERE id=$1`, [r.id, JSON.stringify(clean)]);
        await q(db, `INSERT INTO ${t('public_request_submissions')} (request_id, kind, payload, ip_hash) VALUES ($1,'FORM',$2::jsonb,$3)`, [r.id, JSON.stringify(clean), ipHash(key)]);
        await audit(db, { entity: 'request', entityId: r.id, action: 'form_submitted', detail: { fields: Object.keys(clean), contractorNameMismatch: !!clean.contractorNameMismatch }, ip: ipHash(key) });
      }
      return { ok: true };
    });
  });

  app.post('/upload', BIG, async (req, reply) => {
    const key = guard(req, reply);
    const b = parse(z.object({ token: z.string().max(600), type: z.enum(['EXEC_DRAWINGS', 'WORKPATH_KMZ', 'SITE_PHOTO_REPORT']), file: uploadSchema }), req.body);
    const tk = verifyToken(b.token);
    if (!tk) throw bad();
    const f = decodeUpload(b.file);
    const ext = f.filename.split('.').pop()!.toLowerCase();
    if (!TYPE_EXT[b.type].includes(ext)) throw httpError(415, 'نوع الملف غير مدعوم لهذا المرفق.', 'FILE_TYPE');
    return tx(async db => {
      const reqs = (await q(db, `SELECT id, status FROM ${t('coordination_requests')} WHERE license_number=$1 ORDER BY received_at, id FOR UPDATE`, [tk.licenseNumber])).rows;
      const open = reqs.filter((r: any) => OPEN_FOR_APPLICANT.includes(r.status));
      if (!reqs.length) throw bad();
      if (!open.length) throw httpError(409, 'لا يمكن رفع مرفقات في الحالة الحالية للطلب.', 'BAD_STATE');
      const target = open[0].id as string;
      const ins = await q(db, `INSERT INTO ${t('coordination_request_attachments')} (request_id,doc_type,visibility,filename,mime_type,size_bytes,data,source,uploaded_by) VALUES ($1,$2,'PUBLIC_TO_APPLICANT',$3,$4,$5,decode($6,'base64'),'public','public-applicant') RETURNING id`,
        [target, b.type, f.filename, f.mime, f.size, f.base64]);
      await q(db, `INSERT INTO ${t('public_request_submissions')} (request_id, kind, doc_type, attachment_id, payload, ip_hash) VALUES ($1,'UPLOAD',$2,$3,$4::jsonb,$5)`, [target, b.type, ins.rows[0].id, JSON.stringify({ filename: f.filename, size: f.size }), ipHash(key)]);
      const st = await recomputeLicence(db, target, null);
      await audit(db, { entity: 'request', entityId: target, action: 'uploaded', detail: { docType: b.type, filename: f.filename, size: f.size, source: 'public' }, ip: ipHash(key) });
      return { ok: true, missing: st?.missing ?? [], complete: (st?.missing ?? []).length === 0 };
    });
  });

  const minutesFor = async (license: string, statuses: string[]) => (await q(undefined, `SELECT m.id, m.status FROM ${t('coordination_minutes')} m JOIN ${t('coordination_minutes_requests')} mr ON mr.minutes_id=m.id JOIN ${t('coordination_requests')} r ON r.id=mr.request_id
      WHERE r.license_number=$1 AND m.status = ANY($2::text[]) ORDER BY m.seq DESC LIMIT 1`, [license, statuses])).rows[0];

  app.get('/minutes/:token/pdf', async (req, reply) => {
    const key = guard(req, reply);
    const tk = verifyToken((req.params as any).token);
    if (!tk) throw bad();
    const m = await minutesFor(tk.licenseNumber, DOWNLOADABLE);
    if (!m) throw httpError(404, 'المحضر غير متاح للتحميل حالياً.', 'NO_MINUTES');
    const res = await generatePdf(undefined as any, m.id, null, ipHash(key));
    if (res.pdf) {
      reply.header('content-type', 'application/pdf').header('content-disposition', `inline; filename="${res.number}.pdf"`);
      return reply.send(res.pdf);
    }
    reply.header('content-type', 'text/html; charset=utf-8').header('x-coord-pdf-fallback', 'html');
    return reply.send(res.html);
  });

  app.post('/signed-minutes', BIG, async (req, reply) => {
    const key = guard(req, reply);
    const b = parse(z.object({ token: z.string().max(600), file: uploadSchema }), req.body);
    const tk = verifyToken(b.token);
    if (!tk) throw bad();
    const f = decodeUpload(b.file, { pdfOnly: true });
    return tx(async db => {
      const m = await minutesFor(tk.licenseNumber, ['WAITING_EXTERNAL_SIGNATURES']);
      if (!m) throw httpError(409, 'المحضر غير جاهز لرفع النسخة الموقعة.', 'BAD_STATE');
      const reqRow = (await q(db, `SELECT mr.request_id FROM ${t('coordination_minutes_requests')} mr WHERE mr.minutes_id=$1 LIMIT 1`, [m.id])).rows[0];
      const res = await signedUploadFlow(db, m.id, f, null, 'public', ipHash(key));
      await q(db, `INSERT INTO ${t('public_request_submissions')} (request_id, kind, payload, ip_hash) VALUES ($1,'SIGNED_MINUTES',$2::jsonb,$3)`, [reqRow.request_id, JSON.stringify({ filename: f.filename, size: f.size }), ipHash(key)]);
      return { ok: true, ...res };
    });
  });

  app.get('/files/:token/:fid', async (req, reply) => {
    guard(req, reply);
    const { token, fid } = req.params as any;
    const tk = verifyToken(token);
    if (!tk || !/^[0-9a-f-]{36}$/i.test(String(fid))) throw bad();
    const { rows } = await q(undefined, `SELECT a.filename, a.mime_type, encode(a.data,'base64') AS b64 FROM ${t('coordination_request_attachments')} a JOIN ${t('coordination_requests')} r ON r.id=a.request_id
        WHERE a.id=$1 AND r.license_number=$2 AND a.visibility='PUBLIC_TO_APPLICANT' AND NOT a.deleted`, [fid, tk.licenseNumber]);
    if (!rows[0]) throw httpError(404, 'الملف غير موجود.');
    reply.header('content-type', rows[0].mime_type).header('content-disposition', `attachment; filename*=UTF-8''${encodeURIComponent(rows[0].filename)}`).header('x-content-type-options', 'nosniff');
    return reply.send(Buffer.from(rows[0].b64, 'base64'));
  });
}
