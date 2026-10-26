import { z, ZodError, type ZodTypeAny } from 'zod';
import { pool } from '../db/pool.js';

export const SCHEMA = 'developed_licenses';
export const MAX_FILE_BYTES = 20 * 1024 * 1024;

export type Db = { query: (text: string, params?: unknown[]) => Promise<{ rows: any[]; rowCount?: number | null }> };

export class HttpError extends Error {
  statusCode: number;
  code?: string;
  constructor(statusCode: number, message: string, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}
export const httpError = (status: number, message: string, code?: string) => new HttpError(status, message, code);

/** zod parse that yields a friendly Arabic 400 instead of a raw zod dump. */
export function parse<T extends ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  try {
    return schema.parse(data ?? {});
  } catch (e) {
    if (e instanceof ZodError) {
      const fields = e.issues.map(i => i.path.join('.')).filter(Boolean);
      throw new HttpError(400, 'البيانات المدخلة غير صالحة، يرجى مراجعة الحقول المطلوبة.', 'VALIDATION');
    }
    throw e;
  }
}

/** Run fn inside a transaction. Falls back to pool-level queries only if the pool cannot hand out clients. */
export async function tx<T>(fn: (db: Db) => Promise<T>): Promise<T> {
  const client = await (pool as any).connect();
  try {
    await client.query('BEGIN');
    const out = await fn(client);
    await client.query('COMMIT');
    return out;
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch { /* ignore */ }
    throw e;
  } finally {
    client.release();
  }
}

export const q = (db: Db | undefined, text: string, params?: unknown[]) => (db ?? (pool as unknown as Db)).query(text, params);
export const t = (name: string) => `${SCHEMA}.${name}`;

export const isUuid = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
export const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : v == null ? null : String(v));

export const uploadSchema = z.object({
  filename: z.string().min(1).max(200),
  mimeType: z.string().max(120).default('application/octet-stream'),
  dataBase64: z.string().min(1)
});
export type UploadInput = z.infer<typeof uploadSchema>;

const ALLOWED_EXT = new Set(['pdf', 'kmz', 'kml', 'jpg', 'jpeg', 'png', 'zip', 'doc', 'docx', 'xls', 'xlsx', 'dwg', 'dxf', 'txt', 'csv', 'webp', 'gif', 'svg']);

export function decodeUpload(file: UploadInput, opts: { pdfOnly?: boolean; imageOnly?: boolean } = {}) {
  const clean = file.dataBase64.replace(/^data:[^,]*,/, '').replace(/\s+/g, '');
  const approx = Math.floor((clean.length * 3) / 4);
  if (approx > MAX_FILE_BYTES + 4) throw httpError(413, 'حجم الملف يتجاوز الحد المسموح (20 ميجابايت).', 'FILE_TOO_LARGE');
  const buf = Buffer.from(clean, 'base64');
  if (!buf.length) throw httpError(400, 'الملف فارغ أو غير صالح.', 'EMPTY_FILE');
  if (buf.length > MAX_FILE_BYTES) throw httpError(413, 'حجم الملف يتجاوز الحد المسموح (20 ميجابايت).', 'FILE_TOO_LARGE');
  const filename = file.filename.replace(/[\\/\0<>:"|?*\r\n]+/g, '_').slice(0, 180) || 'file';
  const ext = (filename.split('.').pop() || '').toLowerCase();
  if (!ALLOWED_EXT.has(ext)) throw httpError(415, 'نوع الملف غير مدعوم.', 'FILE_TYPE');
  if (opts.pdfOnly && (ext !== 'pdf' || buf.subarray(0, 5).toString('latin1') !== '%PDF-')) throw httpError(415, 'يرجى رفع ملف بصيغة PDF.', 'FILE_TYPE');
  if (opts.imageOnly && !['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) throw httpError(415, 'يرجى رفع صورة.', 'FILE_TYPE');
  const mime = ext === 'pdf' ? 'application/pdf' : file.mimeType || 'application/octet-stream';
  return { buf, base64: buf.toString('base64'), filename, mime, size: buf.length };
}

export const REQUIRED_DOCS: { type: string; label: string }[] = [
  { type: 'EXEC_DRAWINGS', label: 'المخططات التنفيذية' },
  { type: 'WORKPATH_KMZ', label: 'مسار العمل (KMZ)' },
  { type: 'SITE_PHOTO_REPORT', label: 'تقرير الصور الموقعية' }
];
export const MISSING_TEXT = 'نقص مرفقات — نأمل استكمال المرفقات المطلوبة.';
export const NOT_FOUND_TEXT = 'الطلب غير موجود، يرجى تقديم طلب عبر منصة مركز مشاريع البنية التحتية لمدينة الرياض «بنى».';
export const ORIGINAL_NOTICE = 'يلزم تسليم أصل المحضر الموقع إلى الإدارة العامة لتشغيل وصيانة المحاور والجسور والأنفاق.';

/** Error handler scoped to the coordination plugins: no raw programming/DB errors reach users. */
export function installErrorHandler(app: any) {
  app.setErrorHandler((error: any, request: any, reply: any) => {
    const status = typeof error?.statusCode === 'number' ? error.statusCode : 500;
    if (status >= 500) {
      try { request.log?.error?.(error); } catch { /* ignore */ }
      return reply.code(500).send({ ok: false, error: 'حدث خطأ غير متوقع، يرجى المحاولة لاحقاً.' });
    }
    const msg = error?.code && String(error.code).startsWith('FST_') ? 'الطلب غير صالح.' : error?.message || 'الطلب غير صالح.';
    return reply.code(status).send({ ok: false, error: msg, code: error?.code && !String(error.code).startsWith('FST_') ? error.code : undefined });
  });
}
