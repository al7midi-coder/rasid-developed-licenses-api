import { q, t, type Db, httpError, REQUIRED_DOCS, iso } from './coordination-common.js';
import { canRequest, REQUEST_ACTIONABLE } from './coordination-state.js';
import { audit } from './coordination-audit.js';
import type { Actor } from './coordination-permissions.js';
import { engine } from './coordination-engine.js';

export const REQ_SELECT = `r.*, (SELECT m.number FROM ${t('coordination_minutes')} m WHERE m.id=r.minutes_id) AS minutes_number,
  (SELECT m.status FROM ${t('coordination_minutes')} m WHERE m.id=r.minutes_id) AS minutes_status,
  (SELECT coalesce(jsonb_agg(jsonb_build_object('department', d.department, 'scope', d.scope, 'source', d.source, 'distance', d.distance, 'primary', d."primary") ORDER BY d."primary" DESC, d.created_at, d.department), '[]'::jsonb)
     FROM ${t('coordination_request_departments')} d WHERE d.request_id=r.id) AS departments`;

export const FORM_KEYS = ['contractorName', 'contractorRepName', 'consultantName', 'consultantRepName', 'ownerName', 'ownerRepName', 'projectName', 'contactName', 'contactPhone', 'contactEmail'] as const;

/** Documents are licence-level: an attachment on any request of the same licence counts for all of them. */
export async function docTypesPresent(db: Db | undefined, requestId: string, snapshot?: any): Promise<Set<string>> {
  const { rows } = await q(db, `SELECT DISTINCT a.doc_type FROM ${t('coordination_request_attachments')} a JOIN ${t('coordination_requests')} r2 ON r2.id=a.request_id
      WHERE NOT a.deleted AND r2.license_number=(SELECT license_number FROM ${t('coordination_requests')} WHERE id=$1)`, [requestId]);
  const set = new Set<string>(rows.map((r: any) => r.doc_type));
  const detected = snapshot?.docsDetected;
  if (detected && typeof detected === 'object') for (const k of Object.keys(detected)) if (detected[k]) set.add(k);
  return set;
}

export async function recomputeLicence(db: Db, requestId: string, actor: Actor | null) {
  const ids = (await q(db, `SELECT id FROM ${t('coordination_requests')} WHERE license_number=(SELECT license_number FROM ${t('coordination_requests')} WHERE id=$1)`, [requestId])).rows.map((r: any) => r.id);
  let last: any = null;
  for (const id of ids) { const r = await recomputeDocs(db, id, actor); if (id === requestId) last = r; }
  return last;
}

export function missingFrom(present: Set<string>): string[] {
  return REQUIRED_DOCS.map(d => d.type).filter(tp => !present.has(tp));
}

const deptList = (r: any): any[] => (Array.isArray(r.departments) ? r.departments.map((d: any) => ({ ...d, distance: d.distance == null ? null : Number(d.distance) })) : []);
/** primary linked department (falls back to the legacy single column) */
const primaryDept = (r: any): string | null => deptList(r).find((d: any) => d.primary)?.department ?? deptList(r)[0]?.department ?? r.department ?? null;

export function mapRequest(r: any, missing?: string[]) {
  const form = r.form || {};
  const docsComplete = missing ? missing.length === 0 : undefined;
  return {
    id: r.id,
    requestNumber: r.center_request_id,
    unblockingId: r.center_request_id,
    licenseNumber: r.license_number,
    status: r.status,
    centerStatus: r.center_status,
    department: primaryDept(r),
    departments: deptList(r),
    departmentNames: deptList(r).map((d: any) => d.department),
    dependency: r.classification?.dependency ?? null,
    licenseFound: r.classification?.licenseFound ?? null,
    durationDays: r.row_snapshot?.durationDays ?? null,
    classification: r.classification,
    contractor: r.contractor,
    consultant: r.consultant,
    owner: r.owner,
    road: r.road,
    project: r.project,
    digType: r.dig_type,
    lengthM: r.length_m == null ? null : Number(r.length_m),
    worksDescription: r.works_description,
    form,
    coordinates: r.row_snapshot?.coordinates ?? [],
    receivedAt: iso(r.received_at),
    minutesId: r.minutes_id,
    minutesNumber: r.minutes_number ?? null,
    minutesStatus: r.minutes_status ?? null,
    finalDecision: r.final_decision,
    finalReason: r.final_reason,
    rejection: r.rejection ?? null,
    missing,
    docsComplete,
    documentsComplete: docsComplete,
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at)
  };
}

export async function setRequestStatus(db: Db, id: string, to: string, actor: Actor | null, extra: { reason?: string; sets?: string } = {}) {
  const cur = await q(db, `SELECT status FROM ${t('coordination_requests')} WHERE id=$1 FOR UPDATE`, [id]);
  if (!cur.rows[0]) throw httpError(404, 'الطلب غير موجود.');
  const from = cur.rows[0].status;
  if (from === to) return from;
  if (!canRequest(from, to)) throw httpError(409, 'لا يمكن تنفيذ هذا الإجراء في الحالة الحالية للطلب.', 'BAD_STATE');
  await q(db, `UPDATE ${t('coordination_requests')} SET status=$2, updated_at=now() ${extra.sets ?? ''} WHERE id=$1`, [id, to]);
  return from;
}

/** Re-evaluates documents completeness; moves RECEIVED/MISSING/COMPLETE (and RETURNED once complete) accordingly. */
export async function recomputeDocs(db: Db, requestId: string, actor: Actor | null) {
  const { rows } = await q(db, `SELECT status, row_snapshot FROM ${t('coordination_requests')} WHERE id=$1 FOR UPDATE`, [requestId]);
  const r = rows[0];
  if (!r) return null;
  const missing = missingFrom(await docTypesPresent(db, requestId, r.row_snapshot));
  let to: string | null = null;
  if (['RECEIVED', 'MISSING_DOCUMENTS', 'DOCUMENTS_COMPLETE'].includes(r.status)) to = missing.length ? 'MISSING_DOCUMENTS' : 'DOCUMENTS_COMPLETE';
  else if (r.status === 'RETURNED' && !missing.length) to = 'DOCUMENTS_COMPLETE';
  if (to && to !== r.status) {
    await q(db, `UPDATE ${t('coordination_requests')} SET status=$2, updated_at=now() WHERE id=$1`, [requestId, to]);
    await audit(db, { entity: 'request', entityId: requestId, action: 'updated', actor, before: { status: r.status }, after: { status: to }, detail: { reason: 'documents_recomputed', missing } });
  }
  return { status: to ?? r.status, missing };
}

export async function getRequestRow(db: Db | undefined, id: string) {
  const { rows } = await q(db, `SELECT ${REQ_SELECT} FROM ${t('coordination_requests')} r WHERE r.id=$1`, [id]);
  if (!rows[0]) throw httpError(404, 'الطلب غير موجود.');
  return rows[0];
}

export function assertActionable(rows: any[]) {
  for (const r of rows) if (!(REQUEST_ACTIONABLE as string[]).includes(r.status)) throw httpError(409, 'لا يمكن تنفيذ الإجراء: يلزم استكمال مرفقات الطلب أو أن حالته الحالية لا تسمح بذلك.', 'REQUEST_NOT_ACTIONABLE');
}

export type SyncRow = Record<string, any>;
const pick = (o: any, ...keys: string[]) => { for (const k of keys) { const v = o?.[k]; if (v !== undefined && v !== null && String(v).trim() !== '') return v; } return undefined; };

/** Center rows carry parties as objects ({id,name,...}); always store the display name, never "[object Object]". */
export function str(v: any): string {
  if (v == null) return '';
  if (typeof v === 'object') {
    if (Array.isArray(v)) return v.map(str).filter(Boolean).join('، ');
    for (const k of ['name', 'fullName', 'nameAr', 'arabicName', 'title', 'label', 'text', 'value', 'companyName', 'displayName']) if (v[k] != null && typeof v[k] !== 'object' && String(v[k]).trim() !== '') return String(v[k]).trim();
    return '';
  }
  return String(v).trim();
}
const opt = (v: any) => { const s = str(v); return s === '' ? null : s; };

/** Accepts both the Rasid client shape (unblockingId/licenseNumber/...) and the raw Center row shape (id, blockingId, permitId, permitRequestId=licence number, unBlockingDate, status). */
export function normalizeSyncRow(o: SyncRow) {
  const licenseNumber = str(pick(o, 'licenseNumber', 'license_number', 'permitNumber', 'permitRequestId'));
  const centerId = str(pick(o, 'unblockingId', 'requestNumber', 'requestId', 'centerRequestId', 'id'));
  if (!licenseNumber) return null;
  const len = Number(pick(o, 'lengthM', 'length', 'length_m'));
  const dur = (engine() as any).parseDuration?.(pick(o, 'durationDays', 'licenseDuration', 'duration', 'مدة الرخصة')) ?? null;
  // linked departments: [{department, scope?, distance?, primary?}] (RasidScopeLayers.classifyAll) or plain names; falls back to the single `department`
  const depIn = (Array.isArray(o.departments) ? o.departments : []).map((d: any, i: number) => typeof d === 'string' ? { department: d } : d).filter((d: any) => d && str(d.department));
  const singleDept = opt(pick(o, 'department', 'dept'));
  const isDep = (opt(pick(o, 'dependency')) ?? 'تابع') !== 'غير تابع';
  const deps: { department: string; scope: string | null; distance: number | null; primary: boolean }[] = [];
  for (const d of depIn.length ? depIn : (singleDept && isDep ? [{ department: singleDept }] : [])) {
    const name = str(d.department).slice(0, 100);
    if (!name || deps.some(x => x.department === name)) continue;
    const dist = Number(d.distance);
    deps.push({ department: name, scope: opt(d.scope) ? str(d.scope).slice(0, 60) : null, distance: Number.isFinite(dist) ? dist : null, primary: false });
  }
  const wantedPrimary = singleDept && deps.some(d => d.department === singleDept) ? singleDept : deps[0]?.department;
  deps.forEach(d => { d.primary = d.department === wantedPrimary; });
  const applicant = {
    contractorRep: opt(pick(o, 'contractorRep', 'applicantName')), contractorPhone: opt(pick(o, 'contractorPhone', 'applicantPhone')), contractorEmail: opt(pick(o, 'contractorEmail', 'applicantEmail'))
  };
  const coords = Array.isArray(o.coordinates) ? o.coordinates.slice(0, 2000).map((c: any) => Array.isArray(c) ? { lat: Number(c[0]), lng: Number(c[1]) } : { lat: Number(c?.lat ?? c?.latitude), lng: Number(c?.lng ?? c?.lon ?? c?.longitude) }).filter((c: any) => Number.isFinite(c.lat) && Number.isFinite(c.lng)) : [];
  return {
    sourceKey: `${centerId}|${licenseNumber}`,
    centerId: centerId || null,
    licenseNumber,
    centerStatus: opt(pick(o, 'centerStatus', 'status')),
    department: wantedPrimary ?? (isDep ? singleDept : null),
    departments: deps,
    classified: o.dependency !== undefined || depIn.length > 0,
    applicant,
    durationDays: dur,
    classification: {
      dependency: opt(pick(o, 'dependency')), department: wantedPrimary ?? singleDept, reason: opt(pick(o, 'classificationReason')),
      licenseFound: o.licenseFound === undefined ? null : !!o.licenseFound,
      suggested: (Array.isArray(o.suggested) ? o.suggested : []).map((d: any) => str(typeof d === 'string' ? d : d?.department)).filter(Boolean).slice(0, 6),
      latitude: pick(o, 'latitude') ?? null, longitude: pick(o, 'longitude') ?? null
    },
    contractor: opt(pick(o, 'contractor', 'contractorName')),
    consultant: opt(pick(o, 'consultant', 'consultantName')),
    owner: opt(pick(o, 'owner', 'ownerName')),
    road: opt(pick(o, 'road', 'street')),
    project: opt(pick(o, 'project', 'projectName')),
    digType: opt(pick(o, 'digType', 'workType')),
    lengthM: Number.isFinite(len) && len > 0 ? len : null,
    receivedAt: (() => { const d = new Date(pick(o, 'receivedAt', 'unBlockingDate', 'unblockingDate') as any); return Number.isFinite(d.getTime()) ? d.toISOString() : null; })(),
    snapshot: {
      unblockingReason: opt(pick(o, 'unblockingReason', 'reason')), permitId: opt(pick(o, 'permitId')), blockingId: opt(pick(o, 'blockingId')),
      coordinates: coords,
      centerAttachments: Array.isArray(o.centerAttachments) ? o.centerAttachments.slice(0, 50) : [], docsDetected: o.docsDetected && typeof o.docsDetected === 'object' ? o.docsDetected : {},
      durationDays: dur, pathLength: pick(o, 'pathLength') ?? null, projectCode: opt(pick(o, 'projectCode'))
    }
  };
}

/** Idempotent upsert; never touches status of an already-progressed request nor overwrites coordinator-edited form. */
export async function syncRequests(db: Db, rows: SyncRow[], actor: Actor) {
  let created = 0, updated = 0, skipped = 0;
  const touched: string[] = [];
  for (const raw of rows) {
    const n = normalizeSyncRow(raw);
    if (!n) { skipped++; continue; }
    const ex = await q(db, `SELECT id FROM ${t('coordination_requests')} WHERE source_key=$1 FOR UPDATE`, [n.sourceKey]);
    let id: string;
    if (ex.rows[0]) {
      id = ex.rows[0].id;
      const locked = (await q(db, `SELECT departments_locked FROM ${t('coordination_requests')} WHERE id=$1`, [id])).rows[0]?.departments_locked === true;
      const keepDept = locked || (!n.classified && !n.department);
      if (locked) n.classification = { ...n.classification, dependency: (await q(db, `SELECT classification->>'dependency' AS d FROM ${t('coordination_requests')} WHERE id=$1`, [id])).rows[0]?.d ?? n.classification.dependency };
      await q(db, `UPDATE ${t('coordination_requests')} SET center_status=$2, department=CASE WHEN $13::boolean THEN department ELSE $3 END, classification=$4::jsonb,
          contractor=COALESCE($5, contractor), owner=COALESCE($6, owner), road=COALESCE($7, road), project=COALESCE($8, project), dig_type=COALESCE($9, dig_type),
          length_m=COALESCE($10, length_m), row_snapshot=$11::jsonb, consultant=COALESCE($12, consultant), updated_at=now() WHERE id=$1`,
        [id, n.centerStatus, n.department, JSON.stringify(n.classification), n.contractor, n.owner, n.road, n.project, n.digType, n.lengthM, JSON.stringify(n.snapshot), n.consultant, keepDept]);
      if (!keepDept) await replaceAutoDepartments(db, id, n.departments);
      updated++;
    } else {
      const ins = await q(db, `INSERT INTO ${t('coordination_requests')} (source_key,center_request_id,license_number,center_status,department,classification,contractor,consultant,owner,road,project,dig_type,length_m,row_snapshot,received_at)
          VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10,$11,$12,$13,$14::jsonb,COALESCE($15::timestamptz, now())) RETURNING id`,
        [n.sourceKey, n.centerId, n.licenseNumber, n.centerStatus, n.department, JSON.stringify(n.classification), n.contractor, n.consultant, n.owner, n.road, n.project, n.digType, n.lengthM, JSON.stringify(n.snapshot), n.receivedAt]);
      id = ins.rows[0].id;
      created++;
      await replaceAutoDepartments(db, id, n.departments);
      await audit(db, { entity: 'request', entityId: id, action: 'created', actor, after: { licenseNumber: n.licenseNumber, centerId: n.centerId } });
    }
    await q(db, `INSERT INTO ${t('coordination_request_licenses')} (request_id,license_number,dig_type,road,length_m,project,contractor,owner,duration_days)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (request_id, license_number) DO UPDATE SET dig_type=EXCLUDED.dig_type, road=EXCLUDED.road, length_m=EXCLUDED.length_m, project=EXCLUDED.project, contractor=EXCLUDED.contractor, owner=EXCLUDED.owner, duration_days=COALESCE(EXCLUDED.duration_days, ${t('coordination_request_licenses')}.duration_days)`,
      [id, n.licenseNumber, n.digType, n.road, n.lengthM, n.project, n.contractor, n.owner, n.durationDays]);
    // the applicant's details from the Center request prefill the contractor representative (never overwrite what the coordinator / applicant already entered)
    const ap = Object.entries(n.applicant).filter(([, v]) => v);
    if (ap.length) {
      const f = (await q(db, `SELECT form FROM ${t('coordination_requests')} WHERE id=$1`, [id])).rows[0]?.form ?? {};
      const next = { ...f }; let ch = false;
      for (const [k, v] of ap) if (!str(next[k])) { next[k] = v; ch = true; }
      if (ch) await q(db, `UPDATE ${t('coordination_requests')} SET form=$2::jsonb WHERE id=$1`, [id, JSON.stringify(next)]);
    }
    await recomputeDocs(db, id, actor);
    touched.push(id);
  }
  return { created, updated, skipped, total: rows.length, ids: touched };
}

/* ------------------------------ linked departments (many-to-many) ------------------------------ */
export type DeptIn = { department: string; scope?: string | null; distance?: number | null; primary?: boolean };

/** keeps the manual links, replaces the automatic ones by the latest classification and makes sure exactly one is primary */
export async function replaceAutoDepartments(db: Db, requestId: string, deps: { department: string; scope: string | null; distance: number | null; primary: boolean }[]) {
  await q(db, `DELETE FROM ${t('coordination_request_departments')} WHERE request_id=$1 AND source='auto'`, [requestId]);
  for (const d of deps) {
    await q(db, `INSERT INTO ${t('coordination_request_departments')} (request_id, department, scope, source, distance, "primary") VALUES ($1,$2,$3,'auto',$4,$5) ON CONFLICT (request_id, department) DO NOTHING`,
      [requestId, d.department, d.scope, d.distance, d.primary]);
  }
  await fixPrimary(db, requestId);
}

/** exactly one primary link per request (the closest automatic one, else the first); mirrors it into coordination_requests.department */
export async function fixPrimary(db: Db, requestId: string) {
  const rows = (await q(db, `SELECT department, "primary" FROM ${t('coordination_request_departments')} WHERE request_id=$1 ORDER BY "primary" DESC, distance NULLS LAST, created_at, department`, [requestId])).rows;
  const primary = rows.find((r: any) => r.primary)?.department ?? rows[0]?.department ?? null;
  await q(db, `UPDATE ${t('coordination_request_departments')} SET "primary" = (department = $2), updated_at=now() WHERE request_id=$1 AND "primary" IS DISTINCT FROM (department = $2)`, [requestId, primary]);
  await q(db, `UPDATE ${t('coordination_requests')} SET department=$2 WHERE id=$1`, [requestId, primary]);
  return primary as string | null;
}

export async function departmentsOf(db: Db | undefined, requestId: string) {
  const { rows } = await q(db, `SELECT department, scope, source, distance, "primary" FROM ${t('coordination_request_departments')} WHERE request_id=$1 ORDER BY "primary" DESC, created_at, department`, [requestId]);
  return rows.map((d: any) => ({ ...d, distance: d.distance == null ? null : Number(d.distance) }));
}

/** coordinator edit: replaces the linked set. Kept links keep their source; new ones are 'manual'. Locks the request against later automatic re-classification. */
export async function setRequestDepartments(db: Db, requestId: string, list: DeptIn[], primary: string | undefined, actor: Actor | null) {
  const names = [...new Set(list.map(d => String(d.department ?? '').trim().slice(0, 100)).filter(Boolean))];
  if (!names.length) throw httpError(400, 'يجب ربط الطلب بإدارة واحدة على الأقل.', 'DEPT_REQUIRED');
  const before = await departmentsOf(db, requestId);
  const cur = new Map(before.map((d: any) => [d.department, d]));
  const prim = primary && names.includes(primary) ? primary : (before.find((d: any) => d.primary && names.includes(d.department))?.department ?? names[0]);
  await q(db, `DELETE FROM ${t('coordination_request_departments')} WHERE request_id=$1 AND NOT (department = ANY($2::text[]))`, [requestId, names]);
  for (const nm of names) {
    const ex: any = cur.get(nm);
    if (ex) continue;
    const given = list.find(d => String(d.department).trim() === nm);
    await q(db, `INSERT INTO ${t('coordination_request_departments')} (request_id, department, scope, source, distance, "primary") VALUES ($1,$2,$3,'manual',$4,false)`, [requestId, nm, given?.scope ?? null, given?.distance ?? null]);
  }
  await q(db, `UPDATE ${t('coordination_request_departments')} SET "primary" = (department = $2), updated_at=now() WHERE request_id=$1`, [requestId, prim]);
  await q(db, `UPDATE ${t('coordination_requests')} SET department=$2, departments_locked=true, updated_at=now(),
      classification = CASE WHEN COALESCE(classification->>'dependency','') = 'تابع' THEN classification ELSE classification || '{"dependency":"تابع","manual":true}'::jsonb END WHERE id=$1`, [requestId, prim]);
  const after = await departmentsOf(db, requestId);
  await audit(db, { entity: 'request', entityId: requestId, action: 'updated', actor, before: { departments: before.map((d: any) => d.department) }, after: { departments: after.map((d: any) => d.department), primary: prim }, detail: { reason: 'departments_changed' } });
  return after;
}
