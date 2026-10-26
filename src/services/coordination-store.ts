import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { q, tx, type Db, httpError } from './coordination-common.js';
import { engine } from './coordination-engine.js';

export const DEPT_MAIN = 'المحاور الرئيسية';
export const DEPT_PT = 'محاور النقل العام';
export const DEPT_BR = 'الجسور والأنفاق';
export const DEPARTMENTS = [DEPT_MAIN, DEPT_PT, DEPT_BR];

const SERVICES_MGR = { signerTitle: 'مدير إدارة خدمات تشغيل وصيانة المحاور والجسور والأنفاق', name: 'م/ محمد بن صالح القرعاوي', partyKey: 'services' };

type SeedPerson = { department: string; signerTitle: string; name: string; company?: string; partyKind?: string; partyKey: string; scopePart?: number; sort: number };
export const DEFAULT_PEOPLE: SeedPerson[] = [
  { department: DEPT_MAIN, signerTitle: 'رئيس قسم الكهرباء بإدارة تشغيل وصيانة المحاور', name: 'م/ محمد بن خالد المالكي', partyKey: 'electricity', sort: 10 },
  { department: DEPT_MAIN, signerTitle: 'رئيس قسم السيول بإدارة تشغيل وصيانة المحاور', name: 'م/ ياسر محمد النخيش', partyKey: 'floods', sort: 20 },
  { department: DEPT_MAIN, signerTitle: 'رئيس قسم الطرق بإدارة تشغيل وصيانة المحاور', name: 'م/ جامع بن عبد الرحمن العتيبي', partyKey: 'roads', sort: 30 },
  { department: DEPT_MAIN, signerTitle: 'مدير إدارة تشغيل وصيانة المحاور', name: 'م/ ريان بن محمد الجلال', partyKey: 'manager', sort: 40 },
  { department: DEPT_MAIN, ...SERVICES_MGR, sort: 50 },

  { department: DEPT_PT, signerTitle: 'ممثل المقاول', name: 'م/ فهد القحطاني', company: 'شركة مطلق الغويري للمقاولات', partyKind: 'CONTRACTOR', partyKey: 'contractor', sort: 10 },
  { department: DEPT_PT, signerTitle: 'ممثل الاستشاري', name: 'م/ أحمد صبري', company: 'شركة أبا الخيل للاستشارات الهندسية', partyKind: 'CONSULTANT', partyKey: 'consultant', sort: 20 },
  { department: DEPT_PT, signerTitle: 'مدير إدارة تشغيل وصيانة محاور النقل العام', name: 'م/ محمد بن عائض آل قشيم', partyKey: 'manager', sort: 30 },
  { department: DEPT_PT, ...SERVICES_MGR, sort: 40 },

  { department: DEPT_BR, signerTitle: 'ممثل المقاول - الجزء 1', name: 'م/ علي الشهراني', company: 'شركة مناسب للمقاولات', partyKind: 'CONTRACTOR', partyKey: 'contractor', scopePart: 1, sort: 10 },
  { department: DEPT_BR, signerTitle: 'ممثل المقاول - الجزء 2', name: 'م/ سالم المطرفي', company: 'شركة مناسب للمقاولات', partyKind: 'CONTRACTOR', partyKey: 'contractor', scopePart: 2, sort: 11 },
  { department: DEPT_BR, signerTitle: 'ممثل المقاول - الجزء 3', name: 'م/ أكرم خوجه', company: 'شركة مناسب للمقاولات', partyKind: 'CONTRACTOR', partyKey: 'contractor', scopePart: 3, sort: 12 },
  { department: DEPT_BR, signerTitle: 'ممثل المقاول - الجزء 4', name: 'م/ سلمان القحطاني', company: 'شركة شبه الجزيرة للمقاولات', partyKind: 'CONTRACTOR', partyKey: 'contractor', scopePart: 4, sort: 13 },
  { department: DEPT_BR, signerTitle: 'ممثل المقاول - الجزء 5', name: 'م/ فهد الرويس', company: 'شركة شبه الجزيرة للمقاولات', partyKind: 'CONTRACTOR', partyKey: 'contractor', scopePart: 5, sort: 14 },
  { department: DEPT_BR, signerTitle: 'ممثل الاستشاري', name: 'م/ محمد جمال عبوش', company: 'شركة أبا الخيل للاستشارات الهندسية', partyKind: 'CONSULTANT', partyKey: 'consultant', sort: 20 },
  { department: DEPT_BR, signerTitle: 'مدير إدارة تشغيل وصيانة الجسور والأنفاق', name: 'م/ محمد بن عبدالكريم العنزي', partyKey: 'manager', sort: 30 },
  { department: DEPT_BR, ...SERVICES_MGR, sort: 40 }
];

export function mapPerson(r: any) {
  return {
    id: r.id, department: r.department, scopePart: r.scope_part, signerTitle: r.signer_title, title: r.signer_title, name: r.name, company: r.company,
    partyKind: r.party_kind, partyKey: r.party_key, userEmail: r.user_email, email: r.email ?? '', phone: r.phone ?? '', isSigner: r.is_signer, active: r.active, sortOrder: r.sort_order
  };
}

async function claimFlag(db: Db, key: string): Promise<boolean> {
  const { rows } = await q(db, `INSERT INTO developed_licenses.coordination_settings (key, value) VALUES ($1, '{"done":true}'::jsonb) ON CONFLICT (key) DO NOTHING RETURNING key`, [key]);
  return rows.length > 0;
}

let peopleSeedPromise: Promise<void> | null = null;
/** Seeds default people exactly once (a flag row), so deleting a person via the API is respected afterwards. */
export function ensurePeopleSeeded(): Promise<void> {
  if (!peopleSeedPromise) {
    peopleSeedPromise = tx(async db => {
      await q(db, `SELECT pg_advisory_xact_lock(740011)`);
      if (!(await claimFlag(db, 'people_seeded'))) return;
      for (const p of DEFAULT_PEOPLE) {
        await q(db, `INSERT INTO developed_licenses.coordination_people (department, scope_part, signer_title, name, company, party_kind, party_key, sort_order)
                     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [p.department, p.scopePart ?? null, p.signerTitle, p.name, p.company ?? null, p.partyKind ?? 'AMANA', p.partyKey, p.sort]);
      }
    }).catch(e => { peopleSeedPromise = null; throw e; });
  }
  return peopleSeedPromise;
}
export function resetSeedCaches() { peopleSeedPromise = null; templateSeedPromise = null; }

/* ---------------- templates ---------------- */

function seedFileCandidates(): string[] {
  const here = (() => { try { return path.dirname(fileURLToPath(import.meta.url)); } catch { return process.cwd(); } })();
  return [process.env.COORD_TEMPLATES_SEED || '', path.resolve(here, '../../../seed/templates.seed.json'), path.resolve(here, '../../seed/templates.seed.json'), path.resolve(process.cwd(), 'seed/templates.seed.json')].filter(Boolean);
}

function loadSeedTemplates(): any[] {
  for (const p of seedFileCandidates()) {
    if (existsSync(p)) {
      try {
        const d = JSON.parse(readFileSync(p, 'utf8'));
        const list = Array.isArray(d) ? d : d.templates;
        if (Array.isArray(list) && list.length) return list;
      } catch { /* try next */ }
    }
  }
  try { const l = engine().seedTemplates(); if (Array.isArray(l) && l.length) return l; } catch { /* ignore */ }
  return [];
}

export async function saveTemplateObject(db: Db, tpl: any, opts: { replace?: boolean } = {}) {
  const { clauses = [], parties = [], ...rest } = tpl;
  const intro = (v: any) => (typeof v === 'string' ? v : v?.head ?? null);
  await q(db, `INSERT INTO developed_licenses.coordination_templates (id,name,owner_key,owner_label,dig_types,mode,logos,intro_single,intro_merged,status,version,active,data,updated_at)
     VALUES ($1,$2,$3,$4,$5::text[],$6,$7::jsonb,$8,$9,$10,$11,$12,$13::jsonb,now())
     ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, owner_key=EXCLUDED.owner_key, owner_label=EXCLUDED.owner_label, dig_types=EXCLUDED.dig_types, mode=EXCLUDED.mode, logos=EXCLUDED.logos,
       intro_single=EXCLUDED.intro_single, intro_merged=EXCLUDED.intro_merged, status=EXCLUDED.status, version=EXCLUDED.version, active=EXCLUDED.active, data=EXCLUDED.data, updated_at=now()`,
    [tpl.id, tpl.name ?? tpl.id, tpl.ownerKey ?? null, tpl.ownerLabel ?? null, tpl.digTypes ?? [], tpl.mode ?? 'single', JSON.stringify(tpl.logos ?? {}), intro(tpl.introSingle), intro(tpl.introMerged),
     tpl.status ?? 'مرفوع', tpl.version ?? 1, tpl.active !== false, JSON.stringify(rest)]);
  if (opts.replace !== false) {
    await q(db, `DELETE FROM developed_licenses.coordination_template_clauses WHERE template_id=$1`, [tpl.id]);
    await q(db, `DELETE FROM developed_licenses.coordination_template_parties WHERE template_id=$1`, [tpl.id]);
  }
  for (const c of clauses) await saveClause(db, tpl.id, c);
  let i = 0;
  for (const p of parties) {
    await q(db, `INSERT INTO developed_licenses.coordination_template_parties (id,template_id,section,role_title,label,ord,data) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb)
                 ON CONFLICT (id) DO UPDATE SET section=EXCLUDED.section, role_title=EXCLUDED.role_title, label=EXCLUDED.label, ord=EXCLUDED.ord, data=EXCLUDED.data`,
      [`${tpl.id}:${p.section}:${p.key ?? i}`, tpl.id, p.section ?? 'owner', p.title ?? null, p.label ?? null, i, JSON.stringify(p)]);
    i++;
  }
}

export async function saveClause(db: Db, templateId: string, c: any) {
  const { id, templateId: _t, number, text, enabled, order, applicableDigTypes, isMandatory, version, ...extra } = c;
  const cid = id || `${templateId}:${c.key ?? Math.random().toString(36).slice(2, 10)}`;
  await q(db, `INSERT INTO developed_licenses.coordination_template_clauses (id,template_id,number,text,enabled,ord,applicable_dig_types,is_mandatory,version,extra)
     VALUES ($1,$2,$3,$4,$5,$6,$7::text[],$8,$9,$10::jsonb)
     ON CONFLICT (id) DO UPDATE SET number=EXCLUDED.number, text=EXCLUDED.text, enabled=EXCLUDED.enabled, ord=EXCLUDED.ord, applicable_dig_types=EXCLUDED.applicable_dig_types,
       is_mandatory=EXCLUDED.is_mandatory, version=EXCLUDED.version, extra=EXCLUDED.extra, updated_at=now()`,
    [cid, templateId, number ?? null, text ?? '', enabled !== false, order ?? 0, applicableDigTypes ?? ['*'], !!isMandatory, version ?? 1, JSON.stringify(extra)]);
  return cid;
}

export const mapClause = (r: any) => ({ ...(r.extra || {}), id: r.id, templateId: r.template_id, number: r.number, text: r.text, enabled: r.enabled, order: r.ord, applicableDigTypes: r.applicable_dig_types, isMandatory: r.is_mandatory, version: r.version });

export async function loadTemplate(db: Db | undefined, id: string): Promise<any | null> {
  const t = await q(db, `SELECT * FROM developed_licenses.coordination_templates WHERE id=$1`, [id]);
  const r = t.rows[0];
  if (!r) return null;
  const [cl, pa] = await Promise.all([
    q(db, `SELECT * FROM developed_licenses.coordination_template_clauses WHERE template_id=$1 ORDER BY ord, number NULLS LAST, id`, [id]),
    q(db, `SELECT * FROM developed_licenses.coordination_template_parties WHERE template_id=$1 ORDER BY ord`, [id])
  ]);
  return {
    ...(r.data || {}), id: r.id, name: r.name, ownerKey: r.owner_key, ownerLabel: r.owner_label, digTypes: r.dig_types, mode: r.mode, logos: r.logos,
    status: r.status, version: r.version, active: r.active, updatedAt: new Date(r.updated_at).toISOString(),
    clauses: cl.rows.map(mapClause), parties: pa.rows.map((p: any) => ({ ...(p.data || {}), section: p.section }))
  };
}

export async function listTemplates(db?: Db) {
  const { rows } = await q(db, `SELECT t.id, t.name, t.owner_key, t.owner_label, t.dig_types, t.mode, t.logos, t.status, t.version, t.active, t.updated_at,
     (SELECT count(*)::int FROM developed_licenses.coordination_template_clauses c WHERE c.template_id=t.id) AS clause_count FROM developed_licenses.coordination_templates t ORDER BY t.id`);
  return rows.map((r: any) => ({ id: r.id, name: r.name, ownerKey: r.owner_key, ownerLabel: r.owner_label, digTypes: r.dig_types, mode: r.mode, logos: r.logos, status: r.status, version: r.version, active: r.active, updatedAt: iso(r.updated_at), clauseCount: r.clause_count }));
}
const iso = (v: any) => (v instanceof Date ? v.toISOString() : v);

let templateSeedPromise: Promise<void> | null = null;
/** Lazy seed: loaded on first template access from seed/templates.seed.json (or the engine's seedTemplates()). Retries if nothing was available yet. */
export function ensureTemplatesSeeded(): Promise<void> {
  if (!templateSeedPromise) {
    templateSeedPromise = tx(async db => {
      await q(db, `SELECT pg_advisory_xact_lock(740012)`);
      const done = await q(db, `SELECT 1 FROM developed_licenses.coordination_settings WHERE key='templates_seeded'`);
      if (done.rows.length) {
        // already seeded earlier: switch the seeded execution-period clause "قدرها (90|30|***) يوماً" to the {duration} placeholder (licence duration); user-edited numbers are left alone
        await q(db, `UPDATE developed_licenses.coordination_template_clauses SET text=regexp_replace(text, 'قدرها \\((90|30|\\*+)\\) يوماً', 'قدرها ({duration}) يوماً'), updated_at=now()
                     WHERE extra->>'key'='duration' AND text NOT LIKE '%{duration}%' AND text ~ 'قدرها \\((90|30|\\*+)\\) يوماً'`);
        return;
      }
      const list = loadSeedTemplates();
      if (!list.length) throw httpError(503, 'نماذج المحاضر غير متوفرة حالياً، يرجى المحاولة لاحقاً.');
      for (const tpl of list) await saveTemplateObject(db, tpl);
      await claimFlag(db, 'templates_seeded');
    }).catch(e => { templateSeedPromise = null; throw e; });
  }
  return templateSeedPromise;
}

/** Resolve via the engine over the editable DB templates (engine order: override -> owner -> digType -> single/merged -> generic). */
export async function resolveTemplateDb(args: { owner?: string; digTypes: string[]; merged: boolean; override?: string }) {
  await ensureTemplatesSeeded();
  const ids = (await q(undefined, `SELECT id FROM developed_licenses.coordination_templates ORDER BY id`)).rows.map((r: any) => r.id);
  const templates: any[] = [];
  for (const id of ids) templates.push(await loadTemplate(undefined, id));
  const r = engine().resolveTemplate({ owner: args.owner, digTypes: args.digTypes, merged: args.merged, override: args.override, templates });
  return { template: r.template, reason: r.reason };
}

export async function peopleForDepartment(db: Db | undefined, department?: string | null) {
  await ensurePeopleSeeded();
  const { rows } = await q(db, `SELECT * FROM developed_licenses.coordination_people WHERE active AND ($1::text IS NULL OR department=$1) ORDER BY department, sort_order, name`, [department ?? null]);
  return rows.map(mapPerson);
}
