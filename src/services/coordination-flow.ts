import { q, t, type Db, httpError } from './coordination-common.js';
import { audit } from './coordination-audit.js';
import type { Actor } from './coordination-permissions.js';
import { setMinutesStatus, minutesRow } from './coordination-minutes.js';
import { setRequestStatus } from './coordination-requests.js';
import { ORIGINAL_NOTICE } from './coordination-common.js';

/** Signed PDF upload (internal coordinator or public applicant): WAITING_EXTERNAL_SIGNATURES -> SIGNED_EXTERNAL_UPLOADED -> WAITING_ORIGINAL_DELIVERY. */
export async function signedUploadFlow(db: Db, minutesId: string, f: { filename: string; size: number; base64: string }, actor: Actor | null, source: 'internal' | 'public', ip?: string) {
  const m = await minutesRow(db, minutesId);
  if (m.status !== 'WAITING_EXTERNAL_SIGNATURES') throw httpError(409, 'المحضر غير جاهز لرفع النسخة الموقعة.', 'BAD_STATE');
  await q(db, `INSERT INTO ${t('coordination_minutes_files')} (minutes_id,kind,visibility,filename,mime_type,size_bytes,data,source,uploaded_by) VALUES ($1,'SIGNED','SIGNED_MINUTES',$2,'application/pdf',$3,decode($4,'base64'),$5,$6)`,
    [minutesId, f.filename, f.size, f.base64, source, actor?.email ?? 'public-applicant']);
  await setMinutesStatus(db, minutesId, 'SIGNED_EXTERNAL_UPLOADED', actor, { action: 'signed_pdf_uploaded', summary: 'رفع المحضر الموقع' });
  await setMinutesStatus(db, minutesId, 'WAITING_ORIGINAL_DELIVERY', actor, { action: 'minutes_updated', summary: 'بانتظار تسليم أصل المحضر' });
  const reqs = (await q(db, `SELECT request_id FROM ${t('coordination_minutes_requests')} WHERE minutes_id=$1`, [minutesId])).rows.map((r: any) => r.request_id);
  for (const rid of reqs) await setRequestStatus(db, rid, 'WAITING_ORIGINAL_MINUTES', actor);
  await audit(db, { entity: 'minutes', entityId: minutesId, action: 'signed_pdf_uploaded', actor, detail: { source, filename: f.filename, size: f.size }, ip });
  return { status: 'WAITING_ORIGINAL_DELIVERY', notice: ORIGINAL_NOTICE };
}
