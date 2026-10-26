import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { q, t, tx, parse, httpError, isUuid, iso, uploadSchema, decodeUpload, installErrorHandler, ORIGINAL_NOTICE, REQUIRED_DOCS, type Db } from '../services/coordination-common.js';
import { needCap, requireActor, can, permissionsOf, COORD_ROLES, type Actor } from '../services/coordination-permissions.js';
import { audit, auditViewed } from '../services/coordination-audit.js';
import { REQ_SELECT, mapRequest, syncRequests, recomputeLicence, docTypesPresent, missingFrom, getRequestRow, assertActionable, setRequestStatus, setRequestDepartments, departmentsOf } from '../services/coordination-requests.js';
import { MINUTES_OPEN_BUCKET, MINUTES_DONE_BUCKET, recommendation, REQUEST_ACTIONABLE } from '../services/coordination-state.js';
import { createMinutes, assembleMinutes, addVersion, assertEditable, setMinutesStatus, minutesRow, generatePdf, renderMinutesHtml, mapClauseRow, engineForm, enginePeople, insertParties } from '../services/coordination-minutes.js';
import { ensurePeopleSeeded, ensureTemplatesSeeded, listTemplates, loadTemplate, saveTemplateObject, saveClause, mapPerson, resolveTemplateDb, peopleForDepartment } from '../services/coordination-store.js';
import { engine } from '../services/coordination-engine.js';
import { toWordMhtml } from '../services/coordination-word.js';
import { signedUploadFlow } from '../services/coordination-flow.js';

const BIG = { bodyLimit: 30 * 1024 * 1024 };
const uuid = z.string().refine(isUuid, 'bad id');
const ip = (req: any) => String(req.ip ?? req.socket?.remoteAddress ?? '');

const sanitizeRich = (h: string) => engine().sanitizeHtml(h);
const richToText = (h: string) => engine().htmlToText(h);

export async function coordinationRoutes(app: FastifyInstance) {
  installErrorHandler(app);

  /* ================= identity ================= */
  app.get('/me/permissions', async req => {
    const a = await requireActor(req);
    return { ok: true, email: a.email, name: a.name, roles: a.roles, permissions: permissionsOf(a), allRoles: COORD_ROLES };
  });

  app.get('/user-roles', async req => {
    await needCap(req, 'roles.manage');
    const { rows } = await q(undefined, `SELECT email, role, created_at FROM ${t('coordination_user_roles')} ORDER BY email, role`);
    return { ok: true, rows };
  });
  app.put('/user-roles', async req => {
    const a = await needCap(req, 'roles.manage');
    const b = parse(z.object({ email: z.string().email().max(200), roles: z.array(z.enum(COORD_ROLES as [string, ...string[]])).max(5) }), req.body);
    await tx(async db => {
      const email = b.email.toLowerCase();
      const before = (await q(db, `SELECT role FROM ${t('coordination_user_roles')} WHERE lower(email)=$1`, [email])).rows.map((r: any) => r.role);
      await q(db, `DELETE FROM ${t('coordination_user_roles')} WHERE lower(email)=$1`, [email]);
      for (const r of b.roles) await q(db, `INSERT INTO ${t('coordination_user_roles')} (email, role, created_by) VALUES ($1,$2,$3)`, [email, r, a.email]);
      await audit(db, { entity: 'person', entityId: email, action: 'updated', actor: a, before: { roles: before }, after: { roles: b.roles }, ip: ip(req) });
    });
    return { ok: true };
  });

  /* ================= requests ================= */
  const SORTS: Record<string, string> = { updatedAt: 'r.updated_at', receivedAt: 'r.received_at', licenseNumber: 'r.license_number', status: 'r.status', contractor: 'r.contractor', department: 'r.department' };

  app.get('/requests', async req => {
    await needCap(req, 'requests.read');
    const p = parse(z.object({
      search: z.string().max(100).optional(), status: z.string().max(200).optional(), dept: z.string().max(100).optional(), docs: z.enum(['complete', 'missing']).optional(),
      dependency: z.string().max(50).optional(), licenseFound: z.enum(['1', '0']).optional(), page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(200).default(25), sort: z.string().max(40).optional()
    }), req.query);
    const w: string[] = ['TRUE']; const args: unknown[] = [];
    const push = (v: unknown) => { args.push(v); return `$${args.length}`; };
    if (p.search) { const s = push(`%${p.search.replace(/[%_]/g, m => '\\' + m)}%`); w.push(`(r.license_number ILIKE ${s} OR r.center_request_id ILIKE ${s} OR r.road ILIKE ${s} OR r.contractor ILIKE ${s} OR r.project ILIKE ${s})`); }
    if (p.status) w.push(`r.status = ANY(${push(p.status.split(','))}::text[])`);
    if (p.dept) { const d = push(p.dept); w.push(`(r.department = ${d} OR EXISTS (SELECT 1 FROM ${t('coordination_request_departments')} dd WHERE dd.request_id=r.id AND dd.department = ${d}))`); }
    if (p.licenseFound === '0') w.push(`r.classification->>'licenseFound' = 'false'`);
    if (p.licenseFound === '1') w.push(`COALESCE(r.classification->>'licenseFound','true') <> 'false'`);
    if (p.dependency) w.push(`r.classification->>'dependency' = ${push(p.dependency)}`);
    if (p.docs === 'complete') w.push(`r.status NOT IN ('RECEIVED','MISSING_DOCUMENTS')`);
    if (p.docs === 'missing') w.push(`r.status IN ('RECEIVED','MISSING_DOCUMENTS')`);
    const [sf, sd] = (p.sort ?? 'updatedAt:desc').split(':');
    const order = `${SORTS[sf as string] ?? 'r.updated_at'} ${sd === 'asc' ? 'ASC' : 'DESC'}, r.id`;
    const where = w.join(' AND ');
    const total = (await q(undefined, `SELECT count(*)::int AS n FROM ${t('coordination_requests')} r WHERE ${where}`, args)).rows[0].n;
    const { rows } = await q(undefined, `SELECT ${REQ_SELECT} FROM ${t('coordination_requests')} r WHERE ${where} ORDER BY ${order} LIMIT ${p.pageSize} OFFSET ${(p.page - 1) * p.pageSize}`, args);
    const lics = [...new Set(rows.map((r: any) => r.license_number))];
    const att = lics.length ? (await q(undefined, `SELECT r2.license_number, a.doc_type FROM ${t('coordination_request_attachments')} a JOIN ${t('coordination_requests')} r2 ON r2.id=a.request_id WHERE NOT a.deleted AND r2.license_number = ANY($1::text[])`, [lics])).rows : [];
    const by = new Map<string, Set<string>>();
    for (const a of att) { if (!by.has(a.license_number)) by.set(a.license_number, new Set()); by.get(a.license_number)!.add(a.doc_type); }
    const out = rows.map((r: any) => {
      const present = new Set(by.get(r.license_number) ?? []);
      for (const k of Object.keys(r.row_snapshot?.docsDetected ?? {})) if (r.row_snapshot.docsDetected[k]) present.add(k);
      return mapRequest(r, missingFrom(present));
    });
    return { ok: true, rows: out, items: out, total, page: p.page, pageSize: p.pageSize };
  });

  app.get('/requests/:id', async req => {
    const a = await needCap(req, 'requests.read');
    const id = parse(uuid, (req.params as any).id);
    const r = await getRequestRow(undefined, id);
    const [lic, att, refs, minutes, present] = await Promise.all([
      q(undefined, `SELECT license_number, dig_type, road, length_m, project, contractor, owner FROM ${t('coordination_request_licenses')} WHERE request_id=$1`, [id]),
      q(undefined, `SELECT a.id, a.doc_type, a.visibility, a.filename, a.mime_type, a.size_bytes, a.source, a.uploaded_by, a.created_at, a.request_id FROM ${t('coordination_request_attachments')} a JOIN ${t('coordination_requests')} r2 ON r2.id=a.request_id
        WHERE NOT a.deleted AND r2.license_number=$1 ORDER BY a.created_at`, [r.license_number]),
      q(undefined, `SELECT id, status, recommendation, minutes_id, created_at, decided_at FROM ${t('coordination_referrals')} WHERE $1::uuid = ANY(request_ids) ORDER BY created_at DESC`, [id]),
      r.minutes_id ? q(undefined, `SELECT id, number, status FROM ${t('coordination_minutes')} WHERE id=$1`, [r.minutes_id]) : Promise.resolve({ rows: [] as any[] }),
      docTypesPresent(undefined, id, r.row_snapshot)
    ]);
    await auditViewed(undefined, 'request', id, a, ip(req));
    return {
      ok: true,
      request: { ...mapRequest(r, missingFrom(present)), requiredDocs: REQUIRED_DOCS, snapshot: r.row_snapshot,
        licences: lic.rows.map((l: any) => ({ licenseNumber: l.license_number, digType: l.dig_type, road: l.road, lengthM: l.length_m == null ? null : Number(l.length_m), project: l.project, contractor: l.contractor, owner: l.owner })),
        attachments: att.rows.map(mapAttachment), referrals: refs.rows.map((x: any) => ({ id: x.id, status: x.status, recommendation: x.recommendation, minutesId: x.minutes_id, createdAt: iso(x.created_at), decidedAt: iso(x.decided_at) })),
        minutes: minutes.rows[0] ?? null }
    };
  });

  app.post('/requests/sync', BIG, async req => {
    const a = await needCap(req, 'requests.write');
    const b = parse(z.object({ rows: z.array(z.record(z.any())).min(1).max(500) }), req.body);
    const res = await tx(db => syncRequests(db, b.rows, a));
    return { ok: true, ...res };
  });

  const patchReq = z.object({
    form: z.record(z.string().max(500)).optional(), contractor: z.string().max(300).optional(), consultant: z.string().max(300).optional(), owner: z.string().max(300).optional(),
    road: z.string().max(300).optional(), project: z.string().max(400).optional(), digType: z.string().max(40).optional(), lengthM: z.number().min(0).max(1_000_000).nullable().optional(),
    worksDescription: z.string().max(1000).optional(), department: z.string().max(100).optional()
  });
  app.patch('/requests/:id', async req => {
    const a = await needCap(req, 'requests.write');
    const id = parse(uuid, (req.params as any).id);
    const b = parse(patchReq, req.body);
    return tx(async db => {
      const cur = (await q(db, `SELECT * FROM ${t('coordination_requests')} WHERE id=$1 FOR UPDATE`, [id])).rows[0];
      if (!cur) throw httpError(404, 'الطلب غير موجود.');
      if (b.department) await setRequestDepartments(db, id, [...(await departmentsOf(db, id)), { department: b.department }], b.department, a);
      const form = b.form ? { ...(cur.form ?? {}), ...b.form } : cur.form;
      await q(db, `UPDATE ${t('coordination_requests')} SET form=$2::jsonb, contractor=COALESCE($3,contractor), consultant=COALESCE($4,consultant), owner=COALESCE($5,owner), road=COALESCE($6,road),
          project=COALESCE($7,project), dig_type=COALESCE($8,dig_type), length_m=COALESCE($9,length_m), works_description=COALESCE($10,works_description), updated_at=now() WHERE id=$1`,
        [id, JSON.stringify(form), b.contractor ?? null, b.consultant ?? null, b.owner ?? null, b.road ?? null, b.project ?? null, b.digType ?? null, b.lengthM ?? null, b.worksDescription ?? null]);
      await audit(db, { entity: 'request', entityId: id, action: 'updated', actor: a, before: pickKeys(cur, b), after: b, ip: ip(req) });
      return { ok: true, request: mapRequest(await getRequestRow(db, id)) };
    });
  });

  /* linked departments: the coordinator can change / add / remove them per request or in bulk */
  const deptIn = z.union([z.string().min(2).max(100), z.object({ department: z.string().min(2).max(100), scope: z.string().max(60).nullable().optional(), distance: z.number().nullable().optional() })])
    .transform(v => typeof v === 'string' ? { department: v } : v);
  app.patch('/requests/:id/departments', async req => {
    const a = await needCap(req, 'requests.write');
    const id = parse(uuid, (req.params as any).id);
    const b = parse(z.object({ departments: z.array(deptIn).min(1).max(6), primary: z.string().max(100).optional() }), req.body);
    return tx(async db => {
      await getRequestRow(db, id);
      await q(db, `SELECT 1 FROM ${t('coordination_requests')} WHERE id=$1 FOR UPDATE`, [id]);
      const deps = await setRequestDepartments(db, id, b.departments, b.primary, a);
      return { ok: true, departments: deps, department: deps.find((d: any) => d.primary)?.department ?? null };
    });
  });
  app.post('/requests/bulk/departments', async req => {
    const a = await needCap(req, 'requests.write');
    const b = parse(z.object({ requestIds: z.array(uuid).min(1).max(200), mode: z.enum(['add', 'remove', 'set']), departments: z.array(deptIn).min(1).max(6) }), req.body);
    return tx(async db => {
      let updated = 0; const skipped: string[] = [];
      for (const rid of [...new Set(b.requestIds)]) {
        const cur = await departmentsOf(db, rid);
        const names = b.departments.map(d => d.department);
        let next: any[];
        if (b.mode === 'set') next = b.departments;
        else if (b.mode === 'add') next = [...cur, ...b.departments];
        else next = cur.filter((d: any) => !names.includes(d.department));
        if (!next.length) { skipped.push(rid); continue; }
        await q(db, `SELECT 1 FROM ${t('coordination_requests')} WHERE id=$1 FOR UPDATE`, [rid]);
        await setRequestDepartments(db, rid, next, undefined, a);
        updated++;
      }
      return { ok: true, updated, skipped };
    });
  });

  const attachBody = uploadSchema.extend({ docType: z.string().regex(/^[A-Z_]{2,40}$/).optional(), type: z.string().regex(/^[A-Z_]{2,40}$/).optional(), visibility: z.enum(['PUBLIC_TO_APPLICANT', 'INTERNAL_ONLY']).default('INTERNAL_ONLY') }).transform(v => ({ ...v, docType: v.docType ?? v.type ?? 'OTHER' }));
  app.post('/requests/:id/attachments', BIG, async req => {
    const a = await needCap(req, 'requests.write');
    const id = parse(uuid, (req.params as any).id);
    const b = parse(attachBody, req.body);
    const f = decodeUpload(b);
    return tx(async db => {
      await getRequestRow(db, id);
      const ins = await q(db, `INSERT INTO ${t('coordination_request_attachments')} (request_id,doc_type,visibility,filename,mime_type,size_bytes,data,source,uploaded_by) VALUES ($1,$2,$3,$4,$5,$6,decode($7,'base64'),'internal',$8) RETURNING id`,
        [id, b.docType, b.visibility, f.filename, f.mime, f.size, f.base64, a.email]);
      const st = await recomputeLicence(db, id, a);
      await audit(db, { entity: 'request', entityId: id, action: 'uploaded', actor: a, detail: { docType: b.docType, filename: f.filename, size: f.size }, ip: ip(req) });
      return { ok: true, id: ins.rows[0].id, status: st?.status, missing: st?.missing };
    });
  });

  app.get('/requests/:id/attachments', async req => {
    await needCap(req, 'requests.read');
    const id = parse(uuid, (req.params as any).id);
    const { rows } = await q(undefined, `SELECT a.id, a.doc_type, a.visibility, a.filename, a.mime_type, a.size_bytes, a.source, a.uploaded_by, a.created_at, a.request_id FROM ${t('coordination_request_attachments')} a JOIN ${t('coordination_requests')} r2 ON r2.id=a.request_id
        WHERE NOT a.deleted AND r2.license_number=(SELECT license_number FROM ${t('coordination_requests')} WHERE id=$1) ORDER BY a.created_at`, [id]);
    return { ok: true, rows: rows.map(mapAttachment), items: rows.map(mapAttachment) };
  });

  const dl = async (req: any, reply: any) => {
    await needCap(req, 'requests.read');
    const { id, fid } = req.params as any;
    parse(uuid, id); parse(uuid, fid);
    const { rows } = await q(undefined, `SELECT filename, mime_type, encode(data,'base64') AS b64 FROM ${t('coordination_request_attachments')} WHERE id=$1 AND NOT deleted AND request_id IN (SELECT id FROM ${t('coordination_requests')} WHERE license_number=(SELECT license_number FROM ${t('coordination_requests')} WHERE id=$2))`, [fid, id]);
    if (!rows[0]) throw httpError(404, 'الملف غير موجود.');
    return sendFile(reply, rows[0]);
  };
  // SPEC: GET .../files/:id — any stored file by id (request attachment, then minutes file)
  app.get('/files/:fid', async (req, reply) => {
    await needCap(req, 'requests.read');
    const fid = parse(uuid, (req.params as any).fid);
    let rows = (await q(undefined, `SELECT filename, mime_type, encode(data,'base64') AS b64 FROM ${t('coordination_request_attachments')} WHERE id=$1 AND NOT deleted`, [fid])).rows;
    if (!rows[0]) rows = (await q(undefined, `SELECT filename, mime_type, encode(data,'base64') AS b64 FROM ${t('coordination_minutes_files')} WHERE id=$1`, [fid])).rows;
    if (!rows[0]) throw httpError(404, 'الملف غير موجود.');
    return sendFile(reply, rows[0]);
  });
  app.get('/requests/:id/files/:fid', dl);
  app.get('/requests/:id/attachments/:fid', dl);

  app.post('/requests/:id/final-decision', async req => {
    const a = await needCap(req, 'final.decide');
    const id = parse(uuid, (req.params as any).id);
    const b = parse(z.object({
      decision: z.enum(['accept', 'return']), reason: z.string().max(2000).optional(), applicantReason: z.string().max(2000).optional(),
      allowedStatements: z.array(z.string().max(500)).max(30).optional(), requiredFixes: z.array(z.string().max(500)).max(30).optional()
    }), req.body);
    if (b.decision === 'return' && !b.reason?.trim()) throw httpError(400, 'يلزم ذكر سبب الإعادة.');
    return tx(async db => {
      const r = (await q(db, `SELECT * FROM ${t('coordination_requests')} WHERE id=$1 FOR UPDATE`, [id])).rows[0];
      if (!r) throw httpError(404, 'الطلب غير موجود.');
      if (!(REQUEST_ACTIONABLE as string[]).includes(r.status) || r.status === 'REFERRED') throw httpError(409, 'لا يمكن اتخاذ القرار النهائي في الحالة الحالية للطلب.', 'BAD_STATE');
      const open = await q(db, `SELECT id FROM ${t('coordination_referrals')} WHERE $1::uuid = ANY(request_ids) AND status='OPEN'`, [id]);
      if (open.rows.length) throw httpError(409, 'توجد إحالة لم يكتمل قرار جميع المعنيين فيها.', 'REFERRAL_OPEN');
      // the decision covers every request attached to the same minutes
      const ids: string[] = r.minutes_id ? (await q(db, `SELECT request_id FROM ${t('coordination_minutes_requests')} WHERE minutes_id=$1`, [r.minutes_id])).rows.map((x: any) => x.request_id) : [id];
      const accept = b.decision === 'accept';
      const to = accept ? (r.minutes_id ? 'WAITING_MINUTES_SIGNATURE' : 'APPROVED') : 'RETURNED';
      const rejection = accept ? null : { reason: b.applicantReason?.trim() || b.reason, allowedStatements: b.allowedStatements ?? [], requiredFixes: b.requiredFixes ?? [] };
      for (const rid of ids) {
        await setRequestStatus(db, rid, to, a);
        await q(db, `UPDATE ${t('coordination_requests')} SET final_decision=$2, final_reason=$3, final_by=$4, final_at=now(), rejection=$5::jsonb WHERE id=$1`, [rid, b.decision, b.reason ?? null, a.email, rejection ? JSON.stringify(rejection) : null]);
        await audit(db, { entity: 'request', entityId: rid, action: accept ? 'accepted' : 'returned', actor: a, after: { status: to }, detail: { reason: b.reason }, ip: ip(req) });
      }
      await q(db, `UPDATE ${t('coordination_referrals')} SET status='CLOSED' WHERE request_ids && $1::uuid[] AND status='DECIDED'`, [ids]);
      if (r.minutes_id) {
        if (accept) await setMinutesStatus(db, r.minutes_id, 'WAITING_EXTERNAL_SIGNATURES', a, { action: 'approved', summary: 'اعتماد المحضر داخلياً وبانتظار التوقيعات الخارجية' });
        else await setMinutesStatus(db, r.minutes_id, 'RETURNED_INTERNAL', a, { action: 'returned', reason: b.reason, summary: 'إعادة المحضر للتعديل' });
      }
      await audit(db, { entity: 'request', entityId: id, action: 'final_decision', actor: a, after: { decision: b.decision, status: to, minutesId: r.minutes_id }, ip: ip(req) });
      return { ok: true, status: to, requestIds: ids, minutesId: r.minutes_id ?? null };
    });
  });

  /* ================= templates ================= */
  app.get('/templates', async req => {
    await needCap(req, 'templates.read');
    await ensureTemplatesSeeded();
    const rows = await listTemplates();
    return { ok: true, rows, items: rows };
  });
  app.post('/templates/resolve', async req => {
    await needCap(req, 'templates.read');
    const b = parse(z.object({ owner: z.string().max(300).optional(), digTypes: z.array(z.string().max(60)).max(5).default([]), merged: z.boolean().default(false), override: z.string().max(80).optional() }), req.body);
    const r = await resolveTemplateDb({ owner: b.owner, digTypes: b.digTypes, merged: b.merged, override: b.override });
    return { ok: true, templateId: r.template?.id, template: r.template ? { ...r.template, clauses: undefined, clauseCount: r.template.clauses?.length ?? 0 } : null, reason: r.reason };
  });
  app.get('/templates/:id', async req => {
    await needCap(req, 'templates.read');
    await ensureTemplatesSeeded();
    const tpl = await loadTemplate(undefined, String((req.params as any).id));
    if (!tpl) throw httpError(404, 'النموذج غير موجود.');
    return { ok: true, template: tpl, ...tpl };
  });
  app.post('/templates', BIG, async req => {
    const a = await needCap(req, 'templates.write');
    await ensureTemplatesSeeded();
    const b = parse(z.object({ id: z.string().regex(/^[A-Za-z0-9_\-]{2,60}$/).optional(), name: z.string().min(2).max(300), cloneFrom: z.string().max(60).optional(), ownerKey: z.string().max(60).optional(), ownerLabel: z.string().max(300).optional(),
      digTypes: z.array(z.enum(['open', 'horizontal', 'micro'])).optional(), mode: z.enum(['single', 'merged', 'both']).optional() }), req.body);
    return tx(async db => {
      const id = b.id ?? 'T_' + Math.random().toString(36).slice(2, 8).toUpperCase();
      if ((await q(db, `SELECT 1 FROM ${t('coordination_templates')} WHERE id=$1`, [id])).rows.length) throw httpError(409, 'معرّف النموذج مستخدم مسبقاً.');
      const base = b.cloneFrom ? await loadTemplate(db, b.cloneFrom) : null;
      if (b.cloneFrom && !base) throw httpError(404, 'النموذج المراد نسخه غير موجود.');
      const tpl: any = base ? JSON.parse(JSON.stringify(base)) : { clauses: [], parties: [], logos: {}, digTypes: ['open', 'horizontal', 'micro'], mode: 'single', ownerKey: 'custom' };
      tpl.id = id; tpl.name = b.name; tpl.version = 1; tpl.status = base ? tpl.status : 'غير مرفوع';
      if (b.ownerKey) tpl.ownerKey = b.ownerKey; if (b.ownerLabel) tpl.ownerLabel = b.ownerLabel; if (b.digTypes) tpl.digTypes = b.digTypes; if (b.mode) tpl.mode = b.mode;
      tpl.clauses = (tpl.clauses ?? []).map((c: any) => ({ ...c, id: `${id}:${(c.id ?? '').split(':').pop() || c.key}`, templateId: id }));
      await saveTemplateObject(db, tpl);
      await audit(db, { entity: 'template', entityId: id, action: 'created', actor: a, after: { name: b.name, cloneFrom: b.cloneFrom }, ip: ip(req) });
      return { ok: true, id };
    });
  });
  const tplParty = z.object({ section: z.enum(['owner', 'amana']), key: z.string().max(60).optional(), row: z.number().int().min(0).max(20).default(0), col: z.number().int().min(0).max(2).optional(),
    label: z.string().max(300).optional(), title: z.string().max(300).optional() }).passthrough();
  const tplPatch = z.object({ parties: z.array(tplParty).max(40).optional(), name: z.string().min(2).max(300).optional(), ownerLabel: z.string().max(300).optional(), ownerKey: z.string().max(60).optional(), status: z.enum(['مرفوع', 'غير مرفوع']).optional(), active: z.boolean().optional(),
    digTypes: z.array(z.enum(['open', 'horizontal', 'micro'])).optional(), mode: z.enum(['single', 'merged', 'both']).optional(),
    introSingle: z.record(z.string().max(3000)).optional(), introMerged: z.record(z.string().max(3000)).optional(), header: z.record(z.any()).optional(), titlePattern: z.string().max(500).optional(), showWorksRow: z.boolean().optional(), showHijri: z.boolean().optional() });
  app.patch('/templates/:id', async req => {
    const a = await needCap(req, 'templates.write');
    await ensureTemplatesSeeded();
    const id = String((req.params as any).id);
    const b = parse(tplPatch, req.body);
    return tx(async db => {
      const cur = await loadTemplate(db, id);
      if (!cur) throw httpError(404, 'النموذج غير موجود.');
      const next: any = { ...cur, ...b, version: cur.version + 1, updatedAt: new Date().toISOString() };
      if (b.parties) await q(db, `DELETE FROM ${t('coordination_template_parties')} WHERE template_id=$1`, [id]);   // edited signature layout replaces the old one (future minutes only)
      await saveTemplateObject(db, next, { replace: false });
      await audit(db, { entity: 'template', entityId: id, action: 'updated', actor: a, before: pickKeys(cur, b), after: b, ip: ip(req) });
      return { ok: true, version: next.version };
    });
  });
  const clauseBody = z.object({ text: z.string().min(3).max(4000), number: z.number().int().optional(), enabled: z.boolean().optional(), order: z.number().int().optional(),
    applicableDigTypes: z.array(z.enum(['*', 'open', 'horizontal', 'micro'])).optional(), isMandatory: z.boolean().optional() });
  app.post('/templates/:id/clauses', async req => {
    const a = await needCap(req, 'templates.write');
    await ensureTemplatesSeeded();
    const id = String((req.params as any).id);
    const b = parse(clauseBody, req.body);
    return tx(async db => {
      const cur = await loadTemplate(db, id);
      if (!cur) throw httpError(404, 'النموذج غير موجود.');
      const maxOrder = cur.clauses.reduce((m: number, c: any) => Math.max(m, c.order ?? 0), 0);
      const cid = await saveClause(db, id, { id: `${id}:u${Date.now().toString(36)}`, templateId: id, key: `c${Date.now().toString(36)}`, layer: 'owner', ...b, order: b.order ?? maxOrder + 10, version: 1 });
      await q(db, `UPDATE ${t('coordination_templates')} SET version=version+1, updated_at=now() WHERE id=$1`, [id]);
      await audit(db, { entity: 'template', entityId: id, action: 'clause_added', actor: a, after: { clauseId: cid, text: b.text }, ip: ip(req) });
      return { ok: true, id: cid };
    });
  });
  app.patch('/templates/:id/clauses/:cid', async req => {
    const a = await needCap(req, 'templates.write');
    const { id, cid } = req.params as any;
    const b = parse(clauseBody.partial(), req.body);
    return tx(async db => {
      const row = (await q(db, `SELECT * FROM ${t('coordination_template_clauses')} WHERE id=$1 AND template_id=$2 FOR UPDATE`, [cid, id])).rows[0];
      if (!row) throw httpError(404, 'البند غير موجود.');
      if (row.is_mandatory && b.enabled === false) throw httpError(409, 'لا يمكن تعطيل بند إلزامي.');
      await q(db, `UPDATE ${t('coordination_template_clauses')} SET text=COALESCE($3,text), enabled=COALESCE($4,enabled), ord=COALESCE($5,ord), number=COALESCE($6,number), applicable_dig_types=COALESCE($7::text[],applicable_dig_types), is_mandatory=COALESCE($8,is_mandatory), version=version+1, updated_at=now() WHERE id=$1 AND template_id=$2`,
        [cid, id, b.text ?? null, b.enabled ?? null, b.order ?? null, b.number ?? null, b.applicableDigTypes ?? null, b.isMandatory ?? null]);
      await q(db, `UPDATE ${t('coordination_templates')} SET version=version+1, updated_at=now() WHERE id=$1`, [id]);
      await audit(db, { entity: 'template', entityId: id, action: 'updated', actor: a, before: { clauseId: cid, text: row.text, enabled: row.enabled }, after: b, ip: ip(req) });
      return { ok: true };
    });
  });
  /* Owner logo: always rendered at the TOP-LEFT of the header (Amana stays on the right). `position` is an alias of `side`; the default is left. */
  const logoSide = z.enum(['right', 'left']);
  const logoUri = (f: { filename: string; base64: string }) => {
    const ext = f.filename.split('.').pop()!.toLowerCase();
    return `data:image/${ext === 'svg' ? 'svg+xml' : ext === 'jpg' ? 'jpeg' : ext};base64,${f.base64}`;
  };
  const isAsset = (v: any) => typeof v === 'string' && !v.startsWith('data:') && !/^https?:/i.test(v);   // built-in asset key (amana, rcrc, ...)
  async function putLogo(req: any, a: Actor, id: string, side: 'right' | 'left', file: any) {
    const f = decodeUpload(file, { imageOnly: true });
    if (f.size > 2 * 1024 * 1024) throw httpError(413, 'حجم الشعار يجب ألا يتجاوز 2 ميجابايت.');
    return tx(async db => {
      const cur = await loadTemplate(db, id);
      if (!cur) throw httpError(404, 'النموذج غير موجود.');
      const logos = { ...(cur.logos ?? {}), [side]: logoUri(f) };
      await q(db, `UPDATE ${t('coordination_templates')} SET logos=$2::jsonb, version=version+1, updated_at=now() WHERE id=$1`, [id, JSON.stringify(logos)]);
      await audit(db, { entity: 'template', entityId: id, action: 'updated', actor: a, detail: { logo: side, filename: f.filename }, ip: ip(req) });
      return { ok: true, side, position: side };
    });
  }
  app.post('/templates/:id/logo', BIG, async req => {
    const a = await needCap(req, 'templates.write');
    const id = String((req.params as any).id);
    const b0 = parse(uploadSchema.extend({ side: logoSide.optional(), position: logoSide.optional() }), req.body);
    return putLogo(req, a, id, b0.side ?? b0.position ?? 'left', b0);
  });
  // PATCH: with a file = replace at side/position; with {to} = move the uploaded owner logo; with {clear:true, side} = remove it
  app.patch('/templates/:id/logo', BIG, async req => {
    const a = await needCap(req, 'templates.write');
    const id = String((req.params as any).id);
    const b = parse(z.object({ side: logoSide.optional(), position: logoSide.optional(), to: logoSide.optional(), clear: z.boolean().optional(),
      filename: z.string().max(200).optional(), mimeType: z.string().max(120).optional(), dataBase64: z.string().optional() }), req.body);
    const side = b.side ?? b.position ?? b.to ?? 'left';
    if (b.dataBase64) return putLogo(req, a, id, side, { filename: b.filename ?? 'logo.png', mimeType: b.mimeType ?? 'image/png', dataBase64: b.dataBase64 });
    return tx(async db => {
      const cur = await loadTemplate(db, id);
      if (!cur) throw httpError(404, 'النموذج غير موجود.');
      const logos: any = { ...(cur.logos ?? {}) };
      if (b.clear) {
        if (isAsset(logos[side])) throw httpError(409, 'لا يمكن حذف شعار الأمانة الأساسي.');
        logos[side] = null;
      } else {
        const to = b.to ?? b.position ?? b.side;
        if (!to) throw httpError(400, 'حدد موضع الشعار.');
        const from = to === 'left' ? 'right' : 'left';
        if (!logos[from] || isAsset(logos[from])) throw httpError(400, 'لا يوجد شعار جهة مالكة لنقله.');
        if (logos[to] && isAsset(logos[to])) throw httpError(409, 'موضع الشعار محجوز لشعار الأمانة.');
        logos[to] = logos[from]; logos[from] = null;
      }
      await q(db, `UPDATE ${t('coordination_templates')} SET logos=$2::jsonb, version=version+1, updated_at=now() WHERE id=$1`, [id, JSON.stringify(logos)]);
      await audit(db, { entity: 'template', entityId: id, action: 'updated', actor: a, detail: { logo: b.clear ? 'cleared' : 'moved', side }, ip: ip(req) });
      return { ok: true, logos: Object.fromEntries(Object.entries(logos).map(([k, v]) => [k, typeof v === 'string' && v.startsWith('data:') ? 'uploaded' : v])) };
    });
  });

  /* ================= people ================= */
  const personBody = z.object({ department: z.string().min(2).max(100), scopePart: z.number().int().min(1).max(20).nullable().optional(), signerTitle: z.string().min(2).max(300), name: z.string().min(2).max(200),
    company: z.string().max(300).nullable().optional(), partyKind: z.enum(['AMANA', 'CONTRACTOR', 'CONSULTANT', 'OWNER']).default('AMANA'), partyKey: z.string().max(40).nullable().optional(),
    userEmail: z.string().email().max(200).nullable().optional().or(z.literal('')), email: z.string().max(200).nullable().optional(), phone: z.string().max(40).nullable().optional(), isSigner: z.boolean().default(true), active: z.boolean().default(true), sortOrder: z.number().int().min(0).max(10000).default(100) });
  app.get('/people', async req => {
    await needCap(req, 'people.read');
    await ensurePeopleSeeded();
    const qs = parse(z.object({ department: z.string().max(100).optional(), all: z.string().optional() }), req.query);
    const { rows } = await q(undefined, `SELECT * FROM ${t('coordination_people')} WHERE ($1::text IS NULL OR department=$1) AND ($2::text = '1' OR active) ORDER BY department, sort_order, name`, [qs.department ?? null, qs.all ?? '']);
    const out = rows.map(mapPerson);
    return { ok: true, rows: out, items: out };
  });
  app.post('/people', async req => {
    const a = await needCap(req, 'people.write');
    await ensurePeopleSeeded();
    const b = parse(personBody, req.body);
    return tx(async db => {
      const { rows } = await q(db, `INSERT INTO ${t('coordination_people')} (department,scope_part,signer_title,name,company,party_kind,party_key,user_email,is_signer,active,sort_order,email,phone) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
        [b.department, b.scopePart ?? null, b.signerTitle, b.name, b.company ?? null, b.partyKind, b.partyKey ?? null, b.userEmail ? b.userEmail.toLowerCase() : null, b.isSigner, b.active, b.sortOrder, b.email || null, b.phone || null]);
      await audit(db, { entity: 'person', entityId: rows[0].id, action: 'created', actor: a, after: b, ip: ip(req) });
      return { ok: true, person: mapPerson(rows[0]) };
    });
  });
  app.patch('/people/:id', async req => {
    const a = await needCap(req, 'people.write');
    const id = parse(uuid, (req.params as any).id);
    const b = parse(personBody.partial(), req.body);
    return tx(async db => {
      const cur = (await q(db, `SELECT * FROM ${t('coordination_people')} WHERE id=$1 FOR UPDATE`, [id])).rows[0];
      if (!cur) throw httpError(404, 'السجل غير موجود.');
      const has = (k: string) => Object.prototype.hasOwnProperty.call(b, k);
      const { rows } = await q(db, `UPDATE ${t('coordination_people')} SET department=COALESCE($2,department), scope_part=CASE WHEN $3 THEN $4 ELSE scope_part END, signer_title=COALESCE($5,signer_title), name=COALESCE($6,name),
          company=CASE WHEN $7 THEN $8 ELSE company END, party_kind=COALESCE($9,party_kind), party_key=CASE WHEN $10 THEN $11 ELSE party_key END, user_email=CASE WHEN $12 THEN $13 ELSE user_email END,
          is_signer=COALESCE($14,is_signer), active=COALESCE($15,active), sort_order=COALESCE($16,sort_order), email=CASE WHEN $17 THEN $18 ELSE email END, phone=CASE WHEN $19 THEN $20 ELSE phone END, updated_at=now() WHERE id=$1 RETURNING *`,
        [id, b.department ?? null, has('scopePart'), b.scopePart ?? null, b.signerTitle ?? null, b.name ?? null, has('company'), b.company ?? null, b.partyKind ?? null, has('partyKey'), b.partyKey ?? null,
         has('userEmail'), b.userEmail ? b.userEmail.toLowerCase() : null, b.isSigner ?? null, b.active ?? null, b.sortOrder ?? null, has('email'), b.email || null, has('phone'), b.phone || null]);
      await audit(db, { entity: 'person', entityId: id, action: 'updated', actor: a, before: mapPerson(cur), after: mapPerson(rows[0]), ip: ip(req) });
      return { ok: true, person: mapPerson(rows[0]) };
    });
  });
  app.delete('/people/:id', async req => {
    const a = await needCap(req, 'people.write');
    const id = parse(uuid, (req.params as any).id);
    return tx(async db => {
      const cur = (await q(db, `SELECT * FROM ${t('coordination_people')} WHERE id=$1`, [id])).rows[0];
      if (!cur) throw httpError(404, 'السجل غير موجود.');
      const used = await q(db, `SELECT 1 FROM ${t('coordination_referral_recipients')} WHERE person_id=$1 LIMIT 1`, [id]);
      if (used.rows.length) await q(db, `UPDATE ${t('coordination_people')} SET active=false, updated_at=now() WHERE id=$1`, [id]);
      else await q(db, `DELETE FROM ${t('coordination_people')} WHERE id=$1`, [id]);
      await audit(db, { entity: 'person', entityId: id, action: 'deleted', actor: a, before: mapPerson(cur), detail: { deactivated: used.rows.length > 0 }, ip: ip(req) });
      return { ok: true, deactivated: used.rows.length > 0 };
    });
  });

  /* ================= minutes ================= */
  app.get('/minutes', async req => {
    await needCap(req, 'minutes.read');
    const p = parse(z.object({ bucket: z.enum(['open', 'done']).default('open'), search: z.string().max(100).optional(), page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(200).default(50) }), req.query);
    const states = p.bucket === 'open' ? MINUTES_OPEN_BUCKET : MINUTES_DONE_BUCKET;
    const args: unknown[] = [states];
    let extra = '';
    if (p.search) { args.push(`%${p.search.replace(/[%_]/g, m => '\\' + m)}%`); extra = `AND (m.number ILIKE $2 OR m.contractor ILIKE $2 OR EXISTS (SELECT 1 FROM ${t('coordination_minutes_licenses')} l WHERE l.minutes_id=m.id AND l.license_number ILIKE $2))`; }
    const { rows } = await q(undefined, `SELECT m.id, m.number, m.status, m.contractor, m.owner, m.department, m.merged, m.version, m.minutes_date::text AS minutes_date, m.created_at, m.updated_at, m.completed_at,
        (SELECT coalesce(jsonb_agg(l.license_number ORDER BY l.license_number),'[]'::jsonb) FROM ${t('coordination_minutes_licenses')} l WHERE l.minutes_id=m.id) AS licenses,
        (SELECT count(*)::int FROM ${t('coordination_minutes_requests')} mr WHERE mr.minutes_id=m.id) AS request_count
      FROM ${t('coordination_minutes')} m WHERE m.status = ANY($1::text[]) ${extra} ORDER BY m.seq DESC LIMIT ${p.pageSize} OFFSET ${(p.page - 1) * p.pageSize}`, args);
    const out = rows.map((m: any) => ({ id: m.id, number: m.number, status: m.status, contractor: m.contractor, owner: m.owner, department: m.department, merged: m.merged, version: m.version, date: m.minutes_date,
      licenses: m.licenses, licences: m.licenses, requestCount: m.request_count, createdAt: iso(m.created_at), updatedAt: iso(m.updated_at), completedAt: iso(m.completed_at) }));
    return { ok: true, rows: out, items: out };
  });

  app.post('/minutes', BIG, async req => {
    const a = await needCap(req, 'minutes.write');
    const b = parse(z.object({ requestIds: z.array(uuid).min(1).max(100), templateId: z.string().max(80).optional(),
      overrides: z.object({ templateId: z.string().max(80).optional(), form: z.record(z.any()).optional(), department: z.string().max(100).optional(), departments: z.array(z.string().min(2).max(100)).min(1).max(5).optional(), date: z.string().max(20).optional(), owner: z.string().max(300).optional(),
        contractor: z.string().max(300).optional(), project: z.string().max(400).optional(), road: z.string().max(300).optional(), worksDescription: z.string().max(1000).optional() }).default({}) }), req.body);
    if (b.templateId && !b.overrides.templateId) b.overrides.templateId = b.templateId;
    if (b.overrides.date === '') delete b.overrides.date;
    const res = await tx(db => createMinutes(db, b.requestIds, b.overrides, a));
    return { ok: true, id: res.id, number: res.number, warnings: res.warnings, minutes: await assembleMinutes(undefined, res.id, { includePending: true }) };
  });

  app.get('/minutes/:id', async req => {
    const a = await needCap(req, 'minutes.read');
    const id = parse(uuid, (req.params as any).id);
    const m = await assembleMinutes(undefined, id, { includePending: true });
    await auditViewed(undefined, 'minutes', id, a, ip(req));
    const refs = await q(undefined, `SELECT id, status, recommendation FROM ${t('coordination_referrals')} WHERE minutes_id=$1 ORDER BY created_at DESC`, [id]);
    return { ok: true, minutes: m, ...m, referrals: refs.rows, notice: ['WAITING_ORIGINAL_DELIVERY', 'SIGNED_EXTERNAL_UPLOADED'].includes((m as any).status) ? ORIGINAL_NOTICE : undefined };
  });

  const partyIn = z.object({ section: z.enum(['owner', 'amana']), roleTitle: z.string().max(300), name: z.string().max(200).default(''), company: z.string().max(300).nullable().optional(), personId: uuid.nullable().optional() });
  // The editor posts parties as {owner:[{label,person,company}], amana:[{title,name,personId}]}; the flat list form is accepted too.
  const partiesIn = z.union([z.array(partyIn).max(40), z.object({
    owner: z.array(z.object({ label: z.string().max(300).default(''), person: z.string().max(200).nullable().optional(), company: z.string().max(300).nullable().optional() }).passthrough()).max(40).default([]),
    amana: z.array(z.object({ title: z.string().max(300).default(''), name: z.string().max(200).nullable().optional(), personId: z.string().nullable().optional() }).passthrough()).max(40).default([])
  })]).transform(v => Array.isArray(v) ? v : [
    ...v.owner.map(o => ({ section: 'owner' as const, roleTitle: o.label, name: o.person ?? '', company: o.company ?? null, personId: null })),
    ...v.amana.map(a => ({ section: 'amana' as const, roleTitle: a.title, name: a.name ?? '', company: null, personId: a.personId && isUuid(a.personId) ? a.personId : null }))
  ]);
  const patchMin = z.object({
    reason: z.string().min(2).max(1000), titleText: z.string().max(500).optional(), worksLabel: z.string().max(300).optional(), date: z.string().max(20).optional(),
    notes: z.string().max(3000).optional(), form: z.record(z.any()).optional(), templateId: z.string().max(60).optional(), departments: z.array(z.string().min(2).max(100)).min(1).max(5).optional(),
    contractor: z.string().max(300).optional(), project: z.string().max(400).optional(), road: z.string().max(300).optional(),
    intro: z.object({ text: z.string().max(10000).optional(), html: z.string().max(40000).optional() }).passthrough().optional(),
    clauses: z.array(z.object({ id: uuid, text: z.string().min(3).max(4000).optional(), html: z.string().max(20000).nullable().optional(), enabled: z.boolean().optional(), order: z.number().int().optional() })).max(200).optional(),
    parties: partiesIn.optional()
  });
  app.patch('/minutes/:id', BIG, async req => {
    const a = await needCap(req, 'minutes.write');
    const id = parse(uuid, (req.params as any).id);
    const b = parse(patchMin, req.body);
    return tx(async db => {
      const m = await assertEditable(db, id);
      const before = await assembleMinutes(db, id, { includePending: true });
      let content: any = { ...(m.content ?? {}) };
      if (b.titleText !== undefined) content.titleText = b.titleText;
      if (b.worksLabel !== undefined) content.worksLabel = b.worksLabel;
      if (b.notes !== undefined) content.notes = b.notes;
      const needsRebuild = b.form || b.departments || (b.templateId && b.templateId !== m.template_id) || (b.date && b.date.slice(0, 10) !== String(m.minutes_date_text).slice(0, 10));
      if (needsRebuild) {
        const form = engineForm({ ...(content.form ?? {}), ...(b.form ?? {}) });
        const departments: string[] = [...new Set((b.departments ?? content.departments ?? [m.department]).map((d: string) => String(d).trim()).filter(Boolean))] as string[];
        const primaryDept = departments[0] ?? m.department;
        const people = await peopleForDepartment(db, departments.length > 1 ? null : primaryDept);
        const reqIds = (await q(db, `SELECT request_id FROM ${t('coordination_minutes_requests')} WHERE minutes_id=$1`, [id])).rows.map((r: any) => r.request_id);
        const lic = (await q(db, `SELECT * FROM ${t('coordination_minutes_licenses')} WHERE minutes_id=$1`, [id])).rows;
        const licences = lic.map((l: any) => ({ licenseNumber: l.license_number, digType: l.dig_type, road: l.road, lengthM: l.length_m == null ? null : Number(l.length_m), project: l.project, contractor: l.contractor, owner: l.owner, durationDays: l.duration_days ?? null, requestIds: l.request_ids }));
        let template: any = m.template_snapshot;
        if (b.templateId && b.templateId !== m.template_id) {
          const dt = (content.digTypes ?? []) as string[];
          template = (await resolveTemplateDb({ owner: m.owner, digTypes: dt, merged: m.merged, override: b.templateId })).template;
        }
        let rebuilt: any;
        try { rebuilt = engine().buildMinutes({ template, licences, form, department: primaryDept, departments, people: enginePeople(people), date: b.date ?? m.minutes_date_text, owner: m.owner }); }
        catch (e: any) { if (e?.code === 'BAD_DATE') throw httpError(400, 'التاريخ غير صالح.'); throw e; }
        content = { ...content, intro: rebuilt.intro, date: rebuilt.date, titleText: b.titleText ?? rebuilt.titleText, worksLabel: b.worksLabel ?? rebuilt.worksLabel, warnings: rebuilt.warnings, form, templateVersion: rebuilt.templateVersion, departments, durationDays: rebuilt.durationDays, durationSource: rebuilt.durationSource };
        if (primaryDept !== m.department) await q(db, `UPDATE ${t('coordination_minutes')} SET department=$2 WHERE id=$1`, [id, primaryDept]);
        // the execution-period clause follows the duration (coordinator override > licence duration); manual edits of the rest of the clause text are kept
        if (b.form && Object.prototype.hasOwnProperty.call(b.form, 'durationDays')) {
          const val = rebuilt.durationDays ? String(rebuilt.durationDays) : '____';
          const dc = (await q(db, `SELECT id, text FROM ${t('coordination_minutes_clauses')} WHERE minutes_id=$1 AND (extra->>'key'='duration' OR jsonb_exists(extra,'tplText'))`, [id])).rows;
          for (const c of dc) {
            const nt = String(c.text).replace(/قدرها \([^)]*\) يوماً/, `قدرها (${val}) يوماً`);
            if (nt !== c.text) await q(db, `UPDATE ${t('coordination_minutes_clauses')} SET text=$2 WHERE id=$1`, [c.id, nt]);
          }
        }
        await q(db, `UPDATE ${t('coordination_minutes')} SET minutes_date=$2::date WHERE id=$1`, [id, rebuilt.date.iso]);
        if (b.templateId && b.templateId !== m.template_id) {
          await q(db, `UPDATE ${t('coordination_minutes')} SET template_id=$2, template_snapshot=$3::jsonb WHERE id=$1`, [id, template.id, JSON.stringify(rebuilt.templateSnapshot)]);
          await q(db, `DELETE FROM ${t('coordination_minutes_clauses')} WHERE minutes_id=$1 AND source='template'`, [id]);
          for (const c of rebuilt.clauses.filter((c: any) => c.layer !== 'user')) {
            const { id: tcid, templateId: _t, number, text, enabled, order, isMandatory, applicableDigTypes, ...extra } = c;
            await q(db, `INSERT INTO ${t('coordination_minutes_clauses')} (minutes_id,number,text,enabled,ord,is_mandatory,source,template_clause_id,extra,added_by) VALUES ($1,$2,$3,$4,$5,$6,'template',$7,$8::jsonb,$9)`,
              [id, number, text, enabled !== false, order ?? 0, !!isMandatory, tcid ?? null, JSON.stringify({ ...extra, applicableDigTypes }), a.email]);
          }
        }
        if (!b.parties) { // refresh party list from the rebuilt minutes (owner reps may have changed)
          await q(db, `DELETE FROM ${t('coordination_minutes_parties')} WHERE minutes_id=$1`, [id]);
          await insertParties(db, id, rebuilt.parties, people);
          content.parties = rebuilt.parties;
        }
      }
      if (b.intro) content.intro = { ...(content.intro ?? {}), ...b.intro };   // the coordinator's manual intro wins over a rebuild
      if (b.contractor !== undefined && b.contractor.trim() && b.contractor.trim() !== m.contractor) {
        await q(db, `UPDATE ${t('coordination_minutes')} SET contractor=$2 WHERE id=$1`, [id, b.contractor.trim()]);
        await q(db, `UPDATE ${t('coordination_minutes_licenses')} SET contractor=$2 WHERE minutes_id=$1`, [id, b.contractor.trim()]);
      }
      if (b.project !== undefined && b.project.trim()) await q(db, `UPDATE ${t('coordination_minutes_licenses')} SET project=$2 WHERE minutes_id=$1`, [id, b.project.trim()]);
      if (b.road !== undefined && b.road.trim() && (await q(db, `SELECT count(*)::int AS n FROM ${t('coordination_minutes_licenses')} WHERE minutes_id=$1`, [id])).rows[0].n === 1) await q(db, `UPDATE ${t('coordination_minutes_licenses')} SET road=$2 WHERE minutes_id=$1`, [id, b.road.trim()]);
      await q(db, `UPDATE ${t('coordination_minutes')} SET content=$2::jsonb WHERE id=$1`, [id, JSON.stringify(content)]);
      for (const c of b.clauses ?? []) {
        const row = (await q(db, `SELECT is_mandatory FROM ${t('coordination_minutes_clauses')} WHERE id=$1 AND minutes_id=$2`, [c.id, id])).rows[0];
        if (!row) throw httpError(404, 'البند غير موجود.');
        if (row.is_mandatory && c.enabled === false) throw httpError(409, 'لا يمكن تعطيل بند إلزامي.');
        const rich = c.html === undefined ? undefined : (c.html ? sanitizeRich(c.html) : null);
        const plain = rich ? richToText(rich) : (c.text ?? null);
        await q(db, `UPDATE ${t('coordination_minutes_clauses')} SET text=COALESCE($3,text), enabled=COALESCE($4,enabled), ord=COALESCE($5,ord) WHERE id=$1 AND minutes_id=$2`, [c.id, id, plain && plain.length >= 3 ? plain : (c.text ?? null), c.enabled ?? null, c.order != null ? c.order * 10 : null]);
        if (rich !== undefined) await q(db, rich ? `UPDATE ${t('coordination_minutes_clauses')} SET extra = coalesce(extra,'{}'::jsonb) || jsonb_build_object('html',$3::text) WHERE id=$1 AND minutes_id=$2` : `UPDATE ${t('coordination_minutes_clauses')} SET extra = coalesce(extra,'{}'::jsonb) - 'html' WHERE id=$1 AND minutes_id=$2`, rich ? [c.id, id, rich] : [c.id, id]);
      }
      if (b.parties) {
        await q(db, `DELETE FROM ${t('coordination_minutes_parties')} WHERE minutes_id=$1`, [id]);
        let o = 0;
        for (const p of b.parties) await q(db, `INSERT INTO ${t('coordination_minutes_parties')} (minutes_id,section,role_title,name,company,person_id,ord) VALUES ($1,$2,$3,$4,$5,$6,$7)`, [id, p.section, p.roleTitle, p.name, p.company ?? null, p.personId ?? null, o++]);
      }
      const version = await addVersion(db, id, a, 'minutes_updated', b.reason, 'تعديل المحضر');
      const after = await assembleMinutes(db, id, { includePending: true });
      await audit(db, { entity: 'minutes', entityId: id, action: 'minutes_updated', actor: a, before: { version: before.version, titleText: (before as any).titleText }, after: { version, titleText: (after as any).titleText }, detail: { reason: b.reason }, ip: ip(req) });
      return { ok: true, version, minutes: after };
    });
  });

  app.post('/minutes/:id/clauses', async req => {
    const a = await needCap(req, 'minutes.write');
    const id = parse(uuid, (req.params as any).id);
    const b = parse(z.object({ text: z.string().min(3).max(4000), html: z.string().max(20000).optional(), reason: z.string().max(1000).optional(), afterClauseId: uuid.optional() }), req.body);
    return tx(async db => {
      await assertEditable(db, id);
      if (b.afterClauseId) await resequence(db, id);
      const cls = (await q(db, `SELECT id, ord FROM ${t('coordination_minutes_clauses')} WHERE minutes_id=$1 ORDER BY ord`, [id])).rows;
      let ord = (cls.length ? cls[cls.length - 1].ord : 0) + 10;
      if (b.afterClauseId) { const i = cls.findIndex((c: any) => c.id === b.afterClauseId); if (i >= 0) ord = cls[i].ord + 50; }
      const ins = await q(db, `INSERT INTO ${t('coordination_minutes_clauses')} (minutes_id,text,ord,source,added_by,extra) VALUES ($1,$2,$3,'user',$4,$5::jsonb) RETURNING id`, [id, b.html ? richToText(sanitizeRich(b.html)) || b.text.trim() : b.text.trim(), ord, a.email, JSON.stringify(b.html ? { layer: 'user', html: sanitizeRich(b.html) } : { layer: 'user' })]);
      await addVersion(db, id, a, 'clause_added', b.reason ?? null, 'إضافة بند');
      await audit(db, { entity: 'minutes', entityId: id, action: 'clause_added', actor: a, after: { clauseId: ins.rows[0].id, text: b.text }, ip: ip(req) });
      return { ok: true, id: ins.rows[0].id };
    });
  });
  app.delete('/minutes/:id/clauses/:cid', async req => {
    const a = await needCap(req, 'minutes.write');
    const id = parse(uuid, (req.params as any).id), cid = parse(uuid, (req.params as any).cid);
    return tx(async db => {
      await assertEditable(db, id);
      const c = (await q(db, `SELECT * FROM ${t('coordination_minutes_clauses')} WHERE id=$1 AND minutes_id=$2`, [cid, id])).rows[0];
      if (!c) throw httpError(404, 'البند غير موجود.');
      if (c.is_mandatory) throw httpError(409, 'لا يمكن حذف بند إلزامي.', 'MANDATORY_CLAUSE');
      await q(db, `DELETE FROM ${t('coordination_minutes_clauses')} WHERE id=$1`, [cid]);
      await addVersion(db, id, a, 'minutes_updated', 'حذف بند', 'حذف بند');
      await audit(db, { entity: 'minutes', entityId: id, action: 'clause_removed', actor: a, before: { clauseId: cid, text: c.text }, ip: ip(req) });
      return { ok: true };
    });
  });
  app.post('/minutes/:id/clauses/:cid/approve', async req => {
    const a = await needCap(req, 'minutes.write');
    const id = parse(uuid, (req.params as any).id), cid = parse(uuid, (req.params as any).cid);
    const b = parse(z.object({ approve: z.boolean().default(true) }), req.body);
    return tx(async db => {
      await assertEditable(db, id);
      const c = (await q(db, `SELECT * FROM ${t('coordination_minutes_clauses')} WHERE id=$1 AND minutes_id=$2 FOR UPDATE`, [cid, id])).rows[0];
      if (!c) throw httpError(404, 'البند غير موجود.');
      if (b.approve) await q(db, `UPDATE ${t('coordination_minutes_clauses')} SET approval_status='APPROVED', approved_by=$2, approved_at=now() WHERE id=$1`, [cid, a.email]);
      else await q(db, `DELETE FROM ${t('coordination_minutes_clauses')} WHERE id=$1 AND source='recipient'`, [cid]);
      await addVersion(db, id, a, 'minutes_updated', b.approve ? 'اعتماد بند مقترح' : 'رفض بند مقترح', 'مراجعة بند مقترح');
      await audit(db, { entity: 'minutes', entityId: id, action: 'clause_approved', actor: a, detail: { clauseId: cid, approve: b.approve }, ip: ip(req) });
      return { ok: true };
    });
  });
  app.post('/minutes/:id/reorder', async req => {
    const a = await needCap(req, 'minutes.write');
    const id = parse(uuid, (req.params as any).id);
    const b = parse(z.object({ order: z.array(uuid).min(1).max(200) }), req.body);
    return tx(async db => {
      await assertEditable(db, id);
      const have = (await q(db, `SELECT id FROM ${t('coordination_minutes_clauses')} WHERE minutes_id=$1`, [id])).rows.map((r: any) => r.id);
      if (have.length !== b.order.length || !have.every((x: string) => b.order.includes(x))) throw httpError(400, 'قائمة الترتيب غير مطابقة لبنود المحضر.');
      let o = 10;
      for (const cid of b.order) { await q(db, `UPDATE ${t('coordination_minutes_clauses')} SET ord=$2 WHERE id=$1`, [cid, o]); o += 10; }
      await addVersion(db, id, a, 'minutes_updated', 'إعادة ترتيب البنود', 'إعادة ترتيب البنود');
      await audit(db, { entity: 'minutes', entityId: id, action: 'minutes_updated', actor: a, detail: { reorder: true }, ip: ip(req) });
      return { ok: true };
    });
  });

  app.post('/minutes/:id/cancel', async req => {
    const a = await needCap(req, 'minutes.write');
    const id = parse(uuid, (req.params as any).id);
    const b = parse(z.object({ reason: z.string().min(2).max(1000) }), req.body);
    return tx(async db => {
      const from = await setMinutesStatus(db, id, 'CANCELLED', a, { action: 'cancelled', reason: b.reason, summary: 'إلغاء المحضر', sets: ', cancel_reason=$3', params: [b.reason] });
      const reqs = (await q(db, `SELECT request_id FROM ${t('coordination_minutes_requests')} WHERE minutes_id=$1`, [id])).rows.map((r: any) => r.request_id);
      await q(db, `UPDATE ${t('coordination_requests')} SET minutes_id=NULL, status = CASE WHEN status IN ('WAITING_MINUTES_SIGNATURE','WAITING_ORIGINAL_MINUTES','REFERRED','UNDER_REVIEW') THEN 'DOCUMENTS_COMPLETE' ELSE status END, updated_at=now() WHERE id = ANY($1::uuid[]) AND minutes_id=$2`, [reqs, id]);
      await q(db, `UPDATE ${t('coordination_referrals')} SET status='CLOSED' WHERE minutes_id=$1 AND status IN ('OPEN','DECIDED')`, [id]);
      await audit(db, { entity: 'minutes', entityId: id, action: 'cancelled', actor: a, before: { status: from }, detail: { reason: b.reason }, ip: ip(req) });
      return { ok: true };
    });
  });

  app.get('/minutes/:id/pdf', async (req, reply) => {
    const a = await needCap(req, 'minutes.read');
    const id = parse(uuid, (req.params as any).id);
    const fmt = String((req.query as any)?.format ?? '');
    const res = await generatePdf(undefined as unknown as Db, id, a, ip(req));
    if (res.pdf && fmt !== 'html') {
      reply.header('content-type', 'application/pdf').header('content-disposition', `inline; filename="${res.number}.pdf"`);
      return reply.send(res.pdf);
    }
    reply.header('content-type', 'text/html; charset=utf-8').header('x-coord-pdf-fallback', 'html');
    return reply.send(res.html);
  });

  app.get('/minutes/:id/word', async (req, reply) => {
    const a = await needCap(req, 'minutes.read');
    const id = parse(uuid, (req.params as any).id);
    const html = await renderMinutesHtml(undefined as unknown as Db, id);
    const m = await minutesRow(undefined as unknown as Db, id);
    await audit(undefined as unknown as Db, { entity: 'minutes', entityId: id, action: 'word_exported', actor: a, ip: ip(req) });
    reply.header('content-type', 'application/msword').header('content-disposition', `attachment; filename="${(m as any).number}.doc"`).header('access-control-expose-headers', 'content-disposition');
    return reply.send(toWordMhtml(html, String((m as any).number ?? 'minutes')));
  });

  app.post('/minutes/:id/signed', BIG, async req => {
    const a = await needCap(req, 'minutes.write');
    const id = parse(uuid, (req.params as any).id);
    const f = decodeUpload(parse(uploadSchema, req.body), { pdfOnly: true });
    const res = await tx(db => signedUploadFlow(db, id, f, a, 'internal', ip(req)));
    return { ok: true, ...res };
  });

  app.post('/minutes/:id/original-received', async req => {
    const a = await needCap(req, 'minutes.write');
    const id = parse(uuid, (req.params as any).id);
    return tx(async db => {
      const from = await setMinutesStatus(db, id, 'ORIGINAL_RECEIVED', a, { action: 'original_received', summary: 'استلام أصل المحضر الموقع', sets: ', original_received_at=now(), original_received_by=$3', params: [a.email] });
      await audit(db, { entity: 'minutes', entityId: id, action: 'original_received', actor: a, before: { status: from }, after: { status: 'ORIGINAL_RECEIVED' }, ip: ip(req) });
      return { ok: true, status: 'ORIGINAL_RECEIVED' };
    });
  });

  app.post('/minutes/:id/final-copy', BIG, async req => {
    const a = await needCap(req, 'minutes.write');
    const id = parse(uuid, (req.params as any).id);
    const f = decodeUpload(parse(uploadSchema, req.body), { pdfOnly: true });
    return tx(async db => {
      const m = await minutesRow(db, id);
      if (m.status !== 'ORIGINAL_RECEIVED') throw httpError(409, 'يلزم تأكيد استلام أصل المحضر قبل رفع النسخة النهائية.', 'BAD_STATE');
      await q(db, `INSERT INTO ${t('coordination_minutes_files')} (minutes_id,kind,visibility,filename,mime_type,size_bytes,data,uploaded_by) VALUES ($1,'FINAL','FINAL_MINUTES',$2,'application/pdf',$3,decode($4,'base64'),$5)`, [id, f.filename, f.size, f.base64, a.email]);
      await setMinutesStatus(db, id, 'COMPLETED', a, { action: 'completed', summary: 'اكتمال المحضر بعد رفع النسخة النهائية', sets: ', completed_at=now()' });
      const reqs = (await q(db, `SELECT request_id FROM ${t('coordination_minutes_requests')} WHERE minutes_id=$1`, [id])).rows.map((r: any) => r.request_id);
      for (const rid of reqs) {
        await setRequestStatus(db, rid, 'COMPLETED', a);
        await audit(db, { entity: 'request', entityId: rid, action: 'completed', actor: a, ip: ip(req) });
      }
      await audit(db, { entity: 'minutes', entityId: id, action: 'completed', actor: a, after: { status: 'COMPLETED' }, ip: ip(req) });
      return { ok: true, status: 'COMPLETED', bucket: 'done' };
    });
  });

  app.get('/minutes/:id/versions', async req => {
    await needCap(req, 'minutes.read');
    const id = parse(uuid, (req.params as any).id);
    const { rows } = await q(undefined, `SELECT id, version, action, reason, changed_by, changed_at, summary FROM ${t('coordination_minutes_versions')} WHERE minutes_id=$1 ORDER BY version DESC`, [id]);
    const out = rows.map((v: any) => ({ id: v.id, version: v.version, action: v.action, reason: v.reason, changedBy: v.changed_by, changedAt: iso(v.changed_at), summary: v.summary }));
    return { ok: true, rows: out, items: out };
  });
  app.get('/minutes/:id/files', async req => {
    await needCap(req, 'minutes.read');
    const id = parse(uuid, (req.params as any).id);
    const { rows } = await q(undefined, `SELECT id, kind, visibility, filename, size_bytes, uploaded_by, source, created_at FROM ${t('coordination_minutes_files')} WHERE minutes_id=$1 ORDER BY created_at DESC`, [id]);
    return { ok: true, rows: rows.map((f: any) => ({ id: f.id, kind: f.kind, visibility: f.visibility, filename: f.filename, size: f.size_bytes, source: f.source, uploadedBy: f.uploaded_by, createdAt: iso(f.created_at) })) };
  });
  app.get('/minutes/:id/files/:fid', async (req, reply) => {
    await needCap(req, 'minutes.read');
    const id = parse(uuid, (req.params as any).id), fid = parse(uuid, (req.params as any).fid);
    const { rows } = await q(undefined, `SELECT filename, mime_type, encode(data,'base64') AS b64 FROM ${t('coordination_minutes_files')} WHERE id=$1 AND minutes_id=$2`, [fid, id]);
    if (!rows[0]) throw httpError(404, 'الملف غير موجود.');
    return sendFile(reply, rows[0]);
  });

  /* ================= referrals ================= */
  const myRecipient = async (db: Db | undefined, referralId: string, a: Actor) => (await q(db, `SELECT rr.*, p.name AS person_name FROM ${t('coordination_referral_recipients')} rr JOIN ${t('coordination_people')} p ON p.id=rr.person_id
      WHERE rr.referral_id=$1 AND lower(p.user_email)=lower($2)`, [referralId, a.email])).rows[0];

  app.post('/referrals', async req => {
    const a = await needCap(req, 'referrals.create');
    const b = parse(z.object({ requestIds: z.array(uuid).min(1).max(100), minutesId: uuid.optional(), recipients: z.array(uuid).min(1).max(20), note: z.string().max(2000).optional() }), req.body);
    return tx(async db => {
      const ids = [...new Set(b.requestIds)], recips = [...new Set(b.recipients)];
      const reqs = (await q(db, `SELECT * FROM ${t('coordination_requests')} WHERE id = ANY($1::uuid[]) FOR UPDATE`, [ids])).rows;
      if (reqs.length !== ids.length) throw httpError(404, 'بعض الطلبات المحددة غير موجودة.');
      assertActionable(reqs.map((r: any) => ({ ...r, status: r.status === 'REFERRED' ? 'X' : r.status })));
      const open = await q(db, `SELECT 1 FROM ${t('coordination_referrals')} WHERE request_ids && $1::uuid[] AND status IN ('OPEN') LIMIT 1`, [ids]);
      if (open.rows.length) throw httpError(409, 'توجد إحالة قائمة لأحد الطلبات.', 'REFERRAL_OPEN');
      const ppl = (await q(db, `SELECT id FROM ${t('coordination_people')} WHERE id = ANY($1::uuid[]) AND active`, [recips])).rows;
      if (ppl.length !== recips.length) throw httpError(404, 'بعض المعنيين المحددين غير موجودين أو غير فعّالين.');
      if (b.minutesId) {
        const m = await assertEditable(db, b.minutesId);
        const linked = (await q(db, `SELECT request_id FROM ${t('coordination_minutes_requests')} WHERE minutes_id=$1`, [m.id])).rows.map((r: any) => r.request_id);
        if (!ids.every(i => linked.includes(i))) throw httpError(400, 'الطلبات المحددة لا تتبع المحضر المختار.');
      }
      const ins = await q(db, `INSERT INTO ${t('coordination_referrals')} (request_ids, minutes_id, note, created_by) VALUES ($1::uuid[],$2,$3,$4) RETURNING id`, [ids, b.minutesId ?? null, b.note ?? null, a.email]);
      const rid = ins.rows[0].id as string;
      let o = 0;
      for (const pid of recips) await q(db, `INSERT INTO ${t('coordination_referral_recipients')} (referral_id, person_id, ord) VALUES ($1,$2,$3)`, [rid, pid, o++]);
      for (const r of reqs) { await setRequestStatus(db, r.id, 'REFERRED', a); await audit(db, { entity: 'request', entityId: r.id, action: 'referred', actor: a, detail: { referralId: rid, recipients: recips, minutesId: b.minutesId ?? null }, ip: ip(req) }); }
      if (b.minutesId) await setMinutesStatus(db, b.minutesId, 'UNDER_INTERNAL_REVIEW', a, { action: 'referred', summary: 'إحالة المحضر للمراجعة الداخلية' });
      await audit(db, { entity: 'referral', entityId: rid, action: 'referred', actor: a, after: { requestIds: ids, recipients: recips, minutesId: b.minutesId ?? null }, ip: ip(req) });
      return { ok: true, id: rid };
    });
  });

  app.get('/inbox', async req => {
    const a = await requireActor(req);
    const all = String((req.query as any)?.all ?? '') === '1' && can(a, 'referrals.read') && a.roles.includes('coordination_admin');
    const { rows } = await q(undefined, `SELECT f.id, f.request_ids, f.minutes_id, f.status, f.recommendation, f.note, f.created_at, f.created_by, rr.id AS recipient_id, rr.status AS my_status,
        (SELECT m.number FROM ${t('coordination_minutes')} m WHERE m.id=f.minutes_id) AS minutes_number,
        q1.center_request_id AS request_number, q1.license_number AS first_license, q1.contractor AS q_contractor, q1.road AS q_road, q1.department AS q_department,
        (SELECT coalesce(jsonb_agg(DISTINCT r.license_number),'[]'::jsonb) FROM ${t('coordination_requests')} r WHERE r.id = ANY(f.request_ids)) AS licenses
      FROM ${t('coordination_referral_recipients')} rr JOIN ${t('coordination_referrals')} f ON f.id=rr.referral_id JOIN ${t('coordination_people')} p ON p.id=rr.person_id
      LEFT JOIN LATERAL (SELECT center_request_id, license_number, contractor, road, department FROM ${t('coordination_requests')} WHERE id = f.request_ids[1]) q1 ON true
      WHERE ($2::boolean OR lower(p.user_email)=lower($1)) ORDER BY (rr.status='PENDING') DESC, f.created_at DESC LIMIT 200`, [a.email, all]);
    const out = rows.map((r: any) => ({ id: r.id, requestIds: r.request_ids, minutesId: r.minutes_id, minutesNumber: r.minutes_number, hasMinutes: !!r.minutes_id, status: r.status, recommendation: r.recommendation, myStatus: r.my_status,
      myDecision: r.my_status === 'APPROVED' ? 'approved' : r.my_status === 'REJECTED' ? 'rejected' : null, recipientId: r.recipient_id, licenses: r.licenses, requestNumber: r.request_number,
      licenseNumber: r.licenses.length > 1 ? r.licenses.join('، ') : r.first_license, contractor: r.q_contractor, road: r.q_road, department: r.q_department, referredBy: r.created_by, note: r.note, createdBy: r.created_by, createdAt: iso(r.created_at) }));
    return { ok: true, rows: out, items: out, pending: out.filter((x: any) => x.myStatus === 'PENDING').length };
  });

  app.get('/referrals/:id', async req => {
    const a = await requireActor(req);
    const id = parse(uuid, (req.params as any).id);
    const f = (await q(undefined, `SELECT * FROM ${t('coordination_referrals')} WHERE id=$1`, [id])).rows[0];
    if (!f) throw httpError(404, 'الإحالة غير موجودة.');
    const mine = await myRecipient(undefined, id, a);
    if (!mine && !can(a, 'referrals.read')) throw httpError(403, 'ليست لديك صلاحية تنفيذ هذا الإجراء.', 'FORBIDDEN');
    const [recips, reqs] = await Promise.all([
      q(undefined, `SELECT rr.id, rr.person_id, rr.status, rr.decided_at, p.name, p.signer_title, p.department, d.decision, d.reason, d.decided_by FROM ${t('coordination_referral_recipients')} rr JOIN ${t('coordination_people')} p ON p.id=rr.person_id
        LEFT JOIN ${t('coordination_decisions')} d ON d.recipient_id=rr.id WHERE rr.referral_id=$1 ORDER BY rr.ord`, [id]),
      q(undefined, `SELECT ${REQ_SELECT} FROM ${t('coordination_requests')} r WHERE r.id = ANY($1::uuid[])`, [f.request_ids])
    ]);
    const minutes = f.minutes_id ? await assembleMinutes(undefined, f.minutes_id, { includePending: true }) : null;
    await auditViewed(undefined, 'referral', id, a, ip(req));
    return { ok: true, referral: { id: f.id, status: f.status, recommendation: f.recommendation, note: f.note, minutesId: f.minutes_id, createdBy: f.created_by, createdAt: iso(f.created_at), decidedAt: iso(f.decided_at) },
      recipients: recips.rows.map((r: any) => ({ id: r.id, personId: r.person_id, name: r.name, title: r.signer_title, department: r.department, status: r.status, decision: r.decision, reason: r.reason, decidedAt: iso(r.decided_at) })),
      requests: reqs.rows.map((r: any) => mapRequest(r)), minutes, myRecipientId: mine?.id ?? null, myStatus: mine?.status ?? null, myDecision: mine?.status === 'APPROVED' ? 'approved' : mine?.status === 'REJECTED' ? 'rejected' : null, recommendation: f.recommendation };
  });

  app.post('/referrals/:id/decision', BIG, async req => {
    const a = await requireActor(req);
    const id = parse(uuid, (req.params as any).id);
    const b = parse(z.object({ decision: z.enum(['approved', 'rejected']), reason: z.string().max(3000).optional(), recipientId: uuid.optional(), attachment: uploadSchema.optional() }), req.body);
    if (b.decision === 'rejected' && !b.reason?.trim()) throw httpError(400, 'يلزم ذكر سبب الرفض.');
    const att = b.attachment ? decodeUpload(b.attachment) : null;
    return tx(async db => {
      const f = (await q(db, `SELECT * FROM ${t('coordination_referrals')} WHERE id=$1 FOR UPDATE`, [id])).rows[0];
      if (!f) throw httpError(404, 'الإحالة غير موجودة.');
      let rec = await myRecipient(db, id, a);
      if (!rec && b.recipientId && a.roles.includes('coordination_admin')) rec = (await q(db, `SELECT * FROM ${t('coordination_referral_recipients')} WHERE id=$1 AND referral_id=$2`, [b.recipientId, id])).rows[0];
      if (!rec) throw httpError(403, 'الإحالة غير موجهة إليك.', 'FORBIDDEN');
      if (f.status !== 'OPEN') throw httpError(409, 'الإحالة مغلقة.', 'BAD_STATE');
      if (rec.status !== 'PENDING') throw httpError(409, 'تم تسجيل قرارك مسبقاً.', 'ALREADY_DECIDED');
      let attId: string | null = null;
      if (att) {
        attId = (await q(db, `INSERT INTO ${t('coordination_request_attachments')} (request_id,doc_type,visibility,filename,mime_type,size_bytes,data,source,uploaded_by) VALUES ($1,'REVIEW_NOTE','INTERNAL_ONLY',$2,$3,$4,decode($5,'base64'),'internal',$6) RETURNING id`,
          [f.request_ids[0], att.filename, att.mime, att.size, att.base64, a.email])).rows[0].id;
      }
      const status = b.decision === 'approved' ? 'APPROVED' : 'REJECTED';
      await q(db, `INSERT INTO ${t('coordination_decisions')} (referral_id,recipient_id,decision,reason,attachment_id,decided_by) VALUES ($1,$2,$3,$4,$5,$6)`, [id, rec.id, b.decision, b.reason ?? null, attId, a.email]);
      await q(db, `UPDATE ${t('coordination_referral_recipients')} SET status=$2, decided_at=now() WHERE id=$1`, [rec.id, status]);
      for (const rid of f.request_ids) { await setRequestStatus(db, rid, 'UNDER_REVIEW', a); await audit(db, { entity: 'request', entityId: rid, action: b.decision === 'approved' ? 'accepted' : 'rejected', actor: a, detail: { referralId: id, recipientId: rec.id }, ip: ip(req) }); }
      await audit(db, { entity: 'referral', entityId: id, action: b.decision === 'approved' ? 'accepted' : 'rejected', actor: a, detail: { recipientId: rec.id, reason: b.reason }, ip: ip(req) });
      const sts = (await q(db, `SELECT status FROM ${t('coordination_referral_recipients')} WHERE referral_id=$1`, [id])).rows.map((r: any) => r.status);
      const rec2 = recommendation(sts);
      if (rec2) await q(db, `UPDATE ${t('coordination_referrals')} SET status='DECIDED', recommendation=$2, decided_at=now() WHERE id=$1`, [id, rec2]);
      return { ok: true, status, referralStatus: rec2 ? 'DECIDED' : 'OPEN', recommendation: rec2 };
    });
  });

  app.post('/referrals/:id/clauses', async req => {
    const a = await requireActor(req);
    const id = parse(uuid, (req.params as any).id);
    const b = parse(z.object({ text: z.string().min(3).max(4000) }), req.body);
    return tx(async db => {
      const f = (await q(db, `SELECT * FROM ${t('coordination_referrals')} WHERE id=$1`, [id])).rows[0];
      if (!f) throw httpError(404, 'الإحالة غير موجودة.');
      if (!f.minutes_id) throw httpError(409, 'الإحالة غير مرتبطة بمحضر.');
      if (f.status !== 'OPEN') throw httpError(409, 'الإحالة مغلقة.', 'BAD_STATE');
      const rec = await myRecipient(db, id, a);
      if (!rec && !a.roles.includes('coordination_admin')) throw httpError(403, 'الإحالة غير موجهة إليك.', 'FORBIDDEN');
      if (rec && rec.status !== 'PENDING') throw httpError(409, 'تم تسجيل قرارك مسبقاً.', 'ALREADY_DECIDED');
      const mx = (await q(db, `SELECT coalesce(max(ord),0)::int AS o FROM ${t('coordination_minutes_clauses')} WHERE minutes_id=$1`, [f.minutes_id])).rows[0].o;
      const ins = await q(db, `INSERT INTO ${t('coordination_minutes_clauses')} (minutes_id,text,ord,source,approval_status,added_by,extra) VALUES ($1,$2,$3,'recipient','PENDING',$4,'{"layer":"recipient"}'::jsonb) RETURNING id`, [f.minutes_id, b.text.trim(), mx + 10, a.email]);
      await addVersion(db, f.minutes_id, a, 'clause_added', 'بند مقترح من أحد المعنيين', 'بند مقترح');
      await audit(db, { entity: 'minutes', entityId: f.minutes_id, action: 'clause_added', actor: a, after: { clauseId: ins.rows[0].id, text: b.text, referralId: id, pending: true }, ip: ip(req) });
      return { ok: true, id: ins.rows[0].id, approvalStatus: 'PENDING' };
    });
  });

  /* ================= audit ================= */
  app.get('/audit', async req => {
    await needCap(req, 'audit.read');
    const p = parse(z.object({ entity: z.string().max(40), id: z.string().max(80), limit: z.coerce.number().int().min(1).max(500).default(200) }), req.query);
    const { rows } = await q(undefined, `SELECT id, entity, entity_id, action, actor_email, actor_name, actor_role, before, after, detail, created_at FROM ${t('coordination_audit_log')} WHERE entity=$1 AND entity_id=$2 ORDER BY id DESC LIMIT ${p.limit}`, [p.entity, p.id]);
    const out = rows.map((r: any) => ({ id: Number(r.id), entity: r.entity, entityId: r.entity_id, action: r.action, actorEmail: r.actor_email, actorName: r.actor_name, actorRole: r.actor_role, before: r.before, after: r.after, detail: r.detail, createdAt: iso(r.created_at) }));
    return { ok: true, rows: out, items: out };
  });
}

/* ---------------- helpers ---------------- */
function mapAttachment(a: any) {
  return { id: a.id, requestId: a.request_id, type: a.doc_type, docType: a.doc_type, visibility: a.visibility, filename: a.filename, mimeType: a.mime_type, size: a.size_bytes, source: a.source, uploadedBy: a.uploaded_by, createdAt: iso(a.created_at) };
}
function pickKeys(obj: any, keys: Record<string, unknown>) {
  const map: Record<string, string> = { digType: 'dig_type', lengthM: 'length_m', worksDescription: 'works_description' };
  const out: any = {};
  for (const k of Object.keys(keys)) out[k] = obj[map[k] ?? k];
  return out;
}
function sendFile(reply: any, row: { filename: string; mime_type: string; b64: string }) {
  reply.header('content-type', row.mime_type || 'application/octet-stream');
  reply.header('content-disposition', `attachment; filename*=UTF-8''${encodeURIComponent(row.filename)}`);
  reply.header('x-content-type-options', 'nosniff');
  return reply.send(Buffer.from(row.b64, 'base64'));
}
async function resequence(db: Db, minutesId: string) {
  const rows = (await q(db, `SELECT id FROM ${t('coordination_minutes_clauses')} WHERE minutes_id=$1 ORDER BY ord, created_at, id`, [minutesId])).rows;
  let o = 100;
  for (const r of rows) { await q(db, `UPDATE ${t('coordination_minutes_clauses')} SET ord=$2 WHERE id=$1`, [r.id, o]); o += 100; }
}
