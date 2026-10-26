import { q, type Db } from './coordination-common.js';
import type { Actor } from './coordination-permissions.js';

export type AuditInput = {
  entity: string;
  entityId: string;
  action: string;
  actor?: Actor | null;
  before?: unknown;
  after?: unknown;
  detail?: unknown;
  ip?: string;
};

const j = (v: unknown) => (v === undefined || v === null ? null : JSON.stringify(v));

export async function audit(db: Db | undefined, a: AuditInput) {
  await q(
    db,
    `INSERT INTO developed_licenses.coordination_audit_log (entity, entity_id, action, actor_email, actor_name, actor_role, before, after, detail, ip)
     VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9::jsonb,$10)`,
    [a.entity, a.entityId, a.action, a.actor?.email ?? null, a.actor?.name ?? null, a.actor?.roles?.join(',') ?? null, j(a.before), j(a.after), j(a.detail), a.ip ?? null]
  );
}

/** "viewed" is de-duplicated per actor/entity for 60s so list refreshes do not flood the log. */
export async function auditViewed(db: Db | undefined, entity: string, entityId: string, actor: Actor, ip?: string) {
  const { rows } = await q(
    db,
    `SELECT 1 FROM developed_licenses.coordination_audit_log WHERE entity=$1 AND entity_id=$2 AND action='viewed' AND actor_email IS NOT DISTINCT FROM $3 AND created_at > now() - interval '60 seconds' LIMIT 1`,
    [entity, entityId, actor.email ?? null]
  );
  if (!rows.length) await audit(db, { entity, entityId, action: 'viewed', actor, ip });
}
