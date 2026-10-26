import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { q, t, type Db, httpError, iso } from './coordination-common.js';
import { engine } from './coordination-engine.js';
import { assertMinutes, MINUTES_EDITABLE } from './coordination-state.js';
import { audit } from './coordination-audit.js';
import type { Actor } from './coordination-permissions.js';
import { resolveTemplateDb, peopleForDepartment } from './coordination-store.js';
import { assertActionable } from './coordination-requests.js';
import { htmlToPdf } from './coordination-pdf.js';

const FORM_MAP: Record<string, string> = { contractorRepName: 'contractorRep', consultantName: 'consultantCompany', consultantRepName: 'consultantRep', ownerRepName: 'ownerRep' };

/** Translate the public/applicant form keys into the engine form keys (both spellings kept). */
export function engineForm(form: any = {}) {
  const out: any = { ...form };
  for (const [from, to] of Object.entries(FORM_MAP)) if (form[from] && !form[to]) out[to] = form[from];
  return out;
}

export function enginePeople(people: any[]) {
  return people.filter(p => p.partyKind === 'AMANA').map(p => ({ id: p.id, department: p.department, slot: p.partyKey, title: p.signerTitle, name: p.name, active: p.active, sortOrder: p.sortOrder }));
}

const norm = (s: any) => String(s ?? '').replace(/\s+/g, ' ').trim().toLowerCase();

/** Default contractor/consultant reps from the department people list when the form did not provide them. */
function defaultReps(people: any[], contractor: string, form: any) {
  const out: any = {};
  const cons = people.find(p => p.partyKind === 'CONSULTANT');
  if (cons && !form.consultantRep) { out.consultantRep = cons.name; if (!form.consultantCompany && cons.company) out.consultantCompany = cons.company; }
  const cands = people.filter(p => p.partyKind === 'CONTRACTOR');
  const byCompany = cands.filter(p => p.company && contractor && (norm(contractor).includes(norm(p.company).replace(/^شركة /, '')) || norm(p.company).includes(norm(contractor))));
  const chosen = byCompany.length === 1 ? byCompany[0] : cands.length === 1 ? cands[0] : null;
  if (chosen && !form.contractorRep) out.contractorRep = chosen.name;
  return out;
}

export type CreateOverrides = { templateId?: string; form?: any; department?: string; departments?: string[]; date?: string; owner?: string; contractor?: string; project?: string; road?: string; worksDescription?: string };

export async function createMinutes(db: Db, requestIds: string[], ov: CreateOverrides, actor: Actor) {
  const ids = [...new Set(requestIds)];
  const { rows: reqs } = await q(db, `SELECT * FROM ${t('coordination_requests')} WHERE id = ANY($1::uuid[]) ORDER BY received_at, id FOR UPDATE`, [ids]);
  if (reqs.length !== ids.length) throw httpError(404, 'بعض الطلبات المحددة غير موجودة.');
  assertActionable(reqs);
  const busy = await q(db, `SELECT 1 FROM ${t('coordination_minutes_requests')} mr JOIN ${t('coordination_minutes')} m ON m.id=mr.minutes_id
      WHERE mr.request_id = ANY($1::uuid[]) AND m.status NOT IN ('CANCELLED','COMPLETED') LIMIT 1`, [ids]);
  if (busy.rows.length) throw httpError(409, 'يوجد محضر قائم لأحد الطلبات المحددة.', 'MINUTES_EXISTS');

  const lic = await q(db, `SELECT l.*, r.center_request_id FROM ${t('coordination_request_licenses')} l JOIN ${t('coordination_requests')} r ON r.id=l.request_id WHERE l.request_id = ANY($1::uuid[])`, [ids]);
  const licencesRaw = lic.rows.length
    ? lic.rows.map((l: any) => ({ licenseNumber: l.license_number, digType: l.dig_type, road: l.road, lengthM: l.length_m == null ? null : Number(l.length_m), project: l.project, contractor: l.contractor, owner: l.owner, durationDays: l.duration_days ?? null, requestIds: [l.request_id] }))
    : reqs.map((r: any) => ({ licenseNumber: r.license_number, digType: r.dig_type, road: r.road, lengthM: r.length_m == null ? null : Number(r.length_m), project: r.project, contractor: r.contractor, owner: r.owner, durationDays: r.row_snapshot?.durationDays ?? null, requestIds: [r.id] }));

  const eng = engine();
  const vm = eng.validateMerge?.(licencesRaw);   // checked on the Center data, before coordinator overrides
  if (vm && vm.ok === false) throw httpError(422, vm.message || 'لا يمكن دمج رخص تابعة لأكثر من مقاول في محضر واحد.', 'MIXED_CONTRACTORS');
  // coordinator overrides from the create screen (contractor/project for all licences, road only for a single request)
  const licences = licencesRaw.map((l: any) => ({ ...l, contractor: ov.contractor?.trim() || l.contractor, project: ov.project?.trim() || l.project, road: (ov.road?.trim() && ids.length === 1) ? ov.road.trim() : l.road }));
  const uniq = eng.dedupeLicences ? eng.dedupeLicences(licences as any) : licences;
  const merged = uniq.length > 1;
  const digTypes = [...new Set(uniq.flatMap((l: any) => (l.segments ?? [l]).map((s: any) => s.digType)).filter(Boolean))] as string[];

  // form: first non-empty value across the requests' forms, then explicit overrides (coordinator wins)
  let form: any = {};
  for (const r of reqs) for (const [k, v] of Object.entries(r.form ?? {})) if (v !== '' && v != null && form[k] == null) form[k] = v;
  form = engineForm({ ...form, ...(ov.form ?? {}), ...(ov.worksDescription?.trim() ? { worksDescription: ov.worksDescription.trim() } : {}) });
  const owner = ov.owner || form.ownerName || reqs.map((r: any) => r.owner).find(Boolean) || '';
  // departments whose Amana signatories sign: default = the primary linked department of the (first) request; the coordinator may choose / add others
  const ovDepts = [...new Set([...(ov.department ? [ov.department] : []), ...(ov.departments ?? [])].map(d => String(d).trim()).filter(Boolean))];
  const linked = (await q(db, `SELECT department FROM ${t('coordination_request_departments')} WHERE request_id = ANY($1::uuid[]) ORDER BY "primary" DESC, created_at`, [ids])).rows.map((r: any) => r.department as string);
  const department = ovDepts[0] || reqs.map((r: any) => r.department).find(Boolean) || linked[0] || 'المحاور الرئيسية';
  const departments = ovDepts.length ? ovDepts : [department];
  const people = await peopleForDepartment(db, department);
  const allPeople = departments.length > 1 ? await peopleForDepartment(db, null) : people;
  const contractor = uniq[0]?.contractor || '';
  form = { ...defaultReps(people, contractor, form), ...form };
  if (!form.ownerName && owner) form.ownerName = owner;

  const res = await resolveTemplateDb({ owner, digTypes, merged, override: ov.templateId });
  let minutes: any;
  try {
    minutes = eng.buildMinutes({ template: res.template, licences, form, department, departments, people: enginePeople(allPeople), date: ov.date, owner });
  } catch (e: any) {
    if (e?.code === 'MIXED_CONTRACTORS') throw httpError(422, e.message, 'MIXED_CONTRACTORS');
    if (e?.code === 'BAD_DATE') throw httpError(400, 'التاريخ غير صالح.');
    if (e?.code === 'TEMPLATE_EMPTY') throw httpError(422, 'النموذج المختار غير مرفوع بعد.', 'TEMPLATE_EMPTY');
    throw e;
  }

  const { clauses, parties, templateSnapshot, ...content } = minutes;
  content.licences = minutes.licences; // keep deduped licences (with segments) for re-render
  content.parties = parties;           // keeps each signer's row/col layout from the template (merged back in assembleMinutes)
  const ins = await q(db, `INSERT INTO ${t('coordination_minutes')} (status, template_id, template_snapshot, template_reason, content, department, contractor, owner, merged, minutes_date, created_by)
      VALUES ('DRAFT',$1,$2::jsonb,$3,$4::jsonb,$5,$6,$7,$8,$9::date,$10) RETURNING id, number`,
    [res.template.id, JSON.stringify(templateSnapshot), res.reason ?? null, JSON.stringify({ ...content, form }), department, contractor, owner, merged, minutes.date.iso, actor.email]);
  const mid = ins.rows[0].id as string;

  for (const l of minutes.licences) {
    await q(db, `INSERT INTO ${t('coordination_minutes_licenses')} (minutes_id,license_number,dig_type,road,length_m,project,contractor,owner,request_ids,duration_days) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10)`,
      [mid, l.licenseNumber, l.digType, l.road, l.lengthM, l.project, l.contractor, l.owner, JSON.stringify(l.requestIds), l.durationDays ?? null]);
  }
  for (const rid of ids) await q(db, `INSERT INTO ${t('coordination_minutes_requests')} (minutes_id, request_id) VALUES ($1,$2)`, [mid, rid]);
  await q(db, `UPDATE ${t('coordination_requests')} SET minutes_id=$2, updated_at=now() WHERE id = ANY($1::uuid[])`, [ids, mid]);
  let ord = 0;
  for (const c of clauses) {
    const { id, templateId, number, text, enabled, order, isMandatory, applicableDigTypes, ...extra } = c;
    await q(db, `INSERT INTO ${t('coordination_minutes_clauses')} (minutes_id,number,text,enabled,ord,is_mandatory,source,template_clause_id,extra,added_by)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10)`,
      [mid, number ?? null, text, enabled !== false, order ?? (ord += 10), !!isMandatory, c.layer === 'user' ? 'user' : 'template', id ?? null, JSON.stringify({ ...extra, applicableDigTypes }), actor.email]);
  }
  await insertParties(db, mid, parties, allPeople);
  await addVersion(db, mid, actor, 'created', null, 'إنشاء المحضر');
  await audit(db, { entity: 'minutes', entityId: mid, action: 'created', actor, after: { number: ins.rows[0].number, requestIds: ids, templateId: res.template.id } });
  return { id: mid, number: ins.rows[0].number as string, warnings: minutes.warnings as string[] };
}

export async function insertParties(db: Db, mid: string, parties: any, people: any[] = []) {
  let ord = 0;
  for (const o of parties.owner ?? []) {
    await q(db, `INSERT INTO ${t('coordination_minutes_parties')} (minutes_id,section,role_title,name,company,ord) VALUES ($1,'owner',$2,$3,$4,$5)`, [mid, o.label ?? o.key, o.person ?? '', o.company ?? '', ord++]);
  }
  for (const a of parties.amana ?? []) {
    const pid = people.some(p => p.id === a.personId) ? a.personId : null;
    await q(db, `INSERT INTO ${t('coordination_minutes_parties')} (minutes_id,section,role_title,name,company,person_id,ord) VALUES ($1,'amana',$2,$3,NULL,$4,$5)`, [mid, a.title, a.name ?? '', pid, ord++]);
  }
}

export async function addVersion(db: Db, mid: string, actor: Actor | null, action: string, reason: string | null, summary: string) {
  const cur = await q(db, `UPDATE ${t('coordination_minutes')} SET version = version + CASE WHEN EXISTS (SELECT 1 FROM ${t('coordination_minutes_versions')} v WHERE v.minutes_id=$1) THEN 1 ELSE 0 END, updated_at=now() WHERE id=$1 RETURNING version`, [mid]);
  const snap = await assembleMinutes(db, mid, { includePending: true });
  await q(db, `INSERT INTO ${t('coordination_minutes_versions')} (minutes_id,version,action,reason,changed_by,summary,snapshot) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb)`,
    [mid, cur.rows[0].version, action, reason, actor?.email ?? null, summary, JSON.stringify(snap)]);
  return cur.rows[0].version as number;
}

export function mapClauseRow(c: any) {
  return { ...(c.extra || {}), id: c.id, number: c.number, text: c.text, enabled: c.enabled, order: c.ord, isMandatory: c.is_mandatory, source: c.source, approvalStatus: c.approval_status, addedBy: c.added_by, approvedBy: c.approved_by, templateClauseId: c.template_clause_id };
}

export async function minutesRow(db: Db | undefined, id: string) {
  const { rows } = await q(db, `SELECT *, minutes_date::text AS minutes_date_text FROM ${t('coordination_minutes')} WHERE id=$1`, [id]);
  if (!rows[0]) throw httpError(404, 'المحضر غير موجود.');
  return rows[0];
}

/** Full minutes object (engine shape + db fields). Pending recipient clauses are included only when includePending. */
export async function assembleMinutes(db: Db | undefined, id: string, opts: { includePending?: boolean } = {}) {
  const m = await minutesRow(db, id);
  const [cl, pa, rq, files] = await Promise.all([
    q(db, `SELECT * FROM ${t('coordination_minutes_clauses')} WHERE minutes_id=$1 ORDER BY ord, created_at, id`, [id]),
    q(db, `SELECT * FROM ${t('coordination_minutes_parties')} WHERE minutes_id=$1 ORDER BY ord`, [id]),
    q(db, `SELECT r.id, r.center_request_id, r.license_number, r.status FROM ${t('coordination_minutes_requests')} mr JOIN ${t('coordination_requests')} r ON r.id=mr.request_id WHERE mr.minutes_id=$1 ORDER BY r.received_at`, [id]),
    q(db, `SELECT id, kind, visibility, filename, size_bytes, uploaded_by, created_at FROM ${t('coordination_minutes_files')} WHERE minutes_id=$1 ORDER BY created_at DESC`, [id])
  ]);
  let clauses = cl.rows.map(mapClauseRow);
  if (!opts.includePending) clauses = clauses.filter((c: any) => c.approvalStatus !== 'PENDING');
  // renumber enabled clauses sequentially (engine rule)
  let n = 0;
  clauses = clauses.map((c: any) => (c.enabled !== false && c.approvalStatus !== 'PENDING' ? { ...c, number: ++n } : { ...c, number: null }));
  const owner = pa.rows.filter((p: any) => p.section === 'owner');
  const amana = pa.rows.filter((p: any) => p.section === 'amana');
  const baseParties = m.content?.parties ?? { owner: [], amana: [] };
  const mapParty = (rowsP: any[], base: any[], isOwner: boolean) => rowsP.map((p, i) => isOwner
    ? { row: i, ...(base[i] ?? {}), label: p.role_title, person: p.name, company: p.company, id: p.id }
    : { row: Math.floor(i / 3), col: i % 3, ...(base[i] ?? {}), title: p.role_title, name: p.name, personId: p.person_id, id: p.id });
  const content = m.content ?? {};
  /* signers added/fixed in «المعنيين» after the minutes was created: fill empty signature slots now and drop the matching «لا يوجد معني مسجل» warnings */
  let amanaOut = mapParty(amana, baseParties.amana ?? [], false);
  let warningsOut: any[] = Array.isArray(content.warnings) ? content.warnings : [];
  if (amanaOut.some((a: any) => !String(a.name ?? '').trim())) {
    const ppl = (await q(db, `SELECT id, department, party_key, signer_title, name FROM ${t('coordination_people')} WHERE party_kind='AMANA' AND active AND coalesce(trim(name),'')<>'' ORDER BY sort_order, created_at`)).rows;
    const reqDeps = (await q(db, `SELECT DISTINCT r.department FROM ${t('coordination_minutes_requests')} mr JOIN ${t('coordination_requests')} r ON r.id=mr.request_id WHERE mr.minutes_id=$1`, [id])).rows.map((r: any) => r.department).filter(Boolean);
    const deps: string[] = [...new Set<string>([m.department, ...(Array.isArray(content.departments) ? content.departments : []), ...reqDeps].filter(Boolean))];
    const resolved: string[] = [];
    amanaOut = amanaOut.map((a: any) => {
      if (String(a.name ?? '').trim()) return a;
      const slot = a.key ?? (baseParties.amana ?? [])[amanaOut.indexOf(a)]?.key;
      if (!slot) return a;
      const cands = ppl.filter((p: any) => p.party_key === slot);
      const hit = deps.map(d => cands.find((p: any) => p.department === d)).find(Boolean) ?? (cands.length === 1 ? cands[0] : null);
      if (!hit) return a;
      resolved.push(String(a.title ?? ''));
      return { ...a, name: hit.name, personId: hit.id };
    });
    if (resolved.length) warningsOut = warningsOut.filter((w: any) => { const tx = typeof w === 'string' ? w : (w?.message ?? ''); return !(tx.startsWith('لا يوجد معني مسجل') && resolved.some(tt => tt && tx.includes('«' + tt + '»'))); });
  }
  return {
    ...content,
    warnings: warningsOut,
    id: m.id, number: m.number, status: m.status, version: m.version, department: m.department, contractor: m.contractor, owner: m.owner, merged: m.merged,
    templateId: m.template_id, templateReason: m.template_reason, templateSnapshot: m.template_snapshot,
    cancelReason: m.cancel_reason, originalReceivedAt: iso(m.original_received_at), originalReceivedBy: m.original_received_by, completedAt: iso(m.completed_at),
    createdBy: m.created_by, createdAt: iso(m.created_at), updatedAt: iso(m.updated_at),
    clauses,
    parties: { owner: mapParty(owner, baseParties.owner ?? [], true), amana: amanaOut },
    requests: rq.rows.map((r: any) => ({ id: r.id, requestNumber: r.center_request_id, licenseNumber: r.license_number, status: r.status })),
    requestIds: rq.rows.map((r: any) => r.id),
    files: files.rows.map((f: any) => ({ id: f.id, kind: f.kind, visibility: f.visibility, filename: f.filename, size: f.size_bytes, uploadedBy: f.uploaded_by, createdAt: iso(f.created_at) }))
  };
}

export async function setMinutesStatus(db: Db, id: string, to: string, actor: Actor | null, opts: { action: string; reason?: string | null; summary: string; sets?: string; params?: unknown[] }) {
  const cur = await q(db, `SELECT status FROM ${t('coordination_minutes')} WHERE id=$1 FOR UPDATE`, [id]);
  if (!cur.rows[0]) throw httpError(404, 'المحضر غير موجود.');
  const from = cur.rows[0].status as string;
  assertMinutes(from, to);
  await q(db, `UPDATE ${t('coordination_minutes')} SET status=$2 ${opts.sets ?? ''}, updated_at=now() WHERE id=$1`, [id, to, ...(opts.params ?? [])]);
  await addVersion(db, id, actor, opts.action, opts.reason ?? null, opts.summary);
  return from;
}

export async function assertEditable(db: Db, id: string) {
  const m = await minutesRow(db, id);
  if (!(MINUTES_EDITABLE as string[]).includes(m.status)) throw httpError(409, 'لا يمكن تعديل المحضر في حالته الحالية.', 'BAD_STATE');
  return m;
}

/* ------------------------------ rendering ------------------------------ */
const ASSET_TOKEN = '__COORD_ASSETS__';

function assetsDir(): string | null {
  const here = (() => { try { return path.dirname(fileURLToPath(import.meta.url)); } catch { return process.cwd(); } })();
  for (const p of [process.env.COORD_ASSETS_DIR || '', path.resolve(here, '../../../assets'), path.resolve(here, '../../assets'), path.resolve(process.cwd(), 'assets')].filter(Boolean)) {
    if (existsSync(p)) return p;
  }
  return null;
}

function inlineAssets(html: string): string {
  const dir = assetsDir();
  const publicBase = (process.env.COORD_PUBLIC_ASSET_BASE || '').replace(/\/+$/, '');
  return html.replace(new RegExp(`${ASSET_TOKEN}/coord/([\\w.\\-/]+)`, 'g'), (_m, f: string) => {
    if (dir) {
      const fp = path.join(dir, f.replace(/^fonts\//, 'fonts/'));
      try {
        if (existsSync(fp) && /\.(png|jpe?g|svg|ttf|otf|woff2?)$/i.test(fp)) {
          const ext0 = path.extname(fp).slice(1).toLowerCase();
          if (/^(ttf|otf|woff2?)$/.test(ext0)) return `data:font/${ext0 === 'ttf' ? 'ttf' : ext0};base64,${readFileSync(fp).toString('base64')}`;
          const ext = path.extname(fp).slice(1).toLowerCase();
          return `data:image/${ext === 'svg' ? 'svg+xml' : ext === 'jpg' ? 'jpeg' : ext};base64,${readFileSync(fp).toString('base64')}`;
        }
      } catch { /* fall through */ }
    }
    return `${publicBase}/coord/${f}`;
  });
}

export async function renderMinutesHtml(db: Db | undefined, id: string) {
  const m: any = await assembleMinutes(db, id);
  // engine renders clauses/parties from the live (edited) data; hide disabled ones.
  const html = engine().renderHtml({ ...m, clauses: m.clauses.filter((c: any) => c.enabled !== false) }, { assetBase: ASSET_TOKEN });
  return inlineAssets(html);
}

/** Returns {pdf} or {html} (fallback for client-side print) and records the generated PDF. */
export async function generatePdf(db: Db, id: string, actor: Actor | null, ip?: string) {
  const html = await renderMinutesHtml(db, id);
  const pdf = await htmlToPdf(html);
  const m = await minutesRow(db, id);
  if (pdf) {
    await q(db, `INSERT INTO ${t('coordination_minutes_files')} (minutes_id,kind,visibility,filename,mime_type,size_bytes,data,uploaded_by) VALUES ($1,'PDF','MINUTES_FILE',$2,'application/pdf',$3,decode($4,'base64'),$5)`,
      [id, `${m.number}.pdf`, pdf.length, pdf.toString('base64'), actor?.email ?? 'public']);
  }
  await audit(db, { entity: 'minutes', entityId: id, action: 'pdf_generated', actor, detail: { fallback: !pdf, number: m.number }, ip });
  return { pdf, html, number: m.number as string };
}
