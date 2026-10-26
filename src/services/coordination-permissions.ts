import { q, httpError } from './coordination-common.js';

export type CoordRole = 'coordination_admin' | 'unblocking_coordinator' | 'internal_reviewer' | 'template_admin' | 'read_only';
export const COORD_ROLES: CoordRole[] = ['coordination_admin', 'unblocking_coordinator', 'internal_reviewer', 'template_admin', 'read_only'];

export type Actor = { email: string; name: string; rasidRole: string; roles: CoordRole[] };

/** Permission matrix: capability -> roles allowed (coordination_admin always allowed). */
export const CAPS: Record<string, CoordRole[]> = {
  'requests.read': ['unblocking_coordinator', 'internal_reviewer', 'template_admin', 'read_only'],
  'requests.write': ['unblocking_coordinator'],
  'minutes.read': ['unblocking_coordinator', 'internal_reviewer', 'template_admin', 'read_only'],
  'minutes.write': ['unblocking_coordinator'],
  'referrals.create': ['unblocking_coordinator'],
  'referrals.decide': ['internal_reviewer'],
  'referrals.read': ['unblocking_coordinator', 'internal_reviewer', 'read_only'],
  'final.decide': ['unblocking_coordinator'],
  'templates.read': ['unblocking_coordinator', 'internal_reviewer', 'template_admin', 'read_only'],
  'templates.write': ['template_admin'],
  'people.read': ['unblocking_coordinator', 'internal_reviewer', 'template_admin', 'read_only'],
  'people.write': [],
  'audit.read': ['unblocking_coordinator', 'internal_reviewer', 'template_admin'],
  'roles.manage': []
};

const ADMIN_RASID_ROLES = new Set(['admin', 'owner', 'systemowner']);
/** Rasid account roles (set on the users page) that carry a coordination role directly. */
const RASID_ROLE_TO_COORD: Record<string, CoordRole> = {
  coordinationadmin: 'coordination_admin',
  unblockingcoordinator: 'unblocking_coordinator',
  internalreviewer: 'internal_reviewer',
  templateadmin: 'template_admin',
  coordinationreadonly: 'read_only'
};

export function can(actor: Actor, cap: string): boolean {
  if (actor.roles.includes('coordination_admin')) return true;
  const allowed = CAPS[cap] ?? [];
  return actor.roles.some(r => allowed.includes(r));
}

function header(request: any, name: string): string {
  const v = request.headers?.[name];
  return String(Array.isArray(v) ? v[0] : v ?? '').trim();
}

/**
 * Identity: the existing Rasid API has no per-request session on the server (writes are gated by origin / admin token).
 * The Rasid client therefore sends x-rasid-user-email / -name / -role. If an auth plugin later decorates request.user
 * ({email,name,role}) that takes precedence — only this function needs to change.
 */
export async function resolveActor(request: any): Promise<Actor | null> {
  const u = request.user;
  const email = (u?.email || header(request, 'x-rasid-user-email') || header(request, 'x-rasid-user')).toLowerCase();
  if (!email) return null;
  const name = u?.name || decodeURIComponentSafe(header(request, 'x-rasid-user-name')) || email;
  const rasidRole = String(u?.role || header(request, 'x-rasid-user-role') || header(request, 'x-rasid-role') || '');
  const { rows } = await q(undefined, `SELECT role FROM developed_licenses.coordination_user_roles WHERE lower(email)=$1`, [email]);
  const roles = new Set<CoordRole>(rows.map((r: any) => r.role));
  if (ADMIN_RASID_ROLES.has(rasidRole.toLowerCase())) roles.add('coordination_admin');
  const mapped = RASID_ROLE_TO_COORD[rasidRole.toLowerCase().replace(/[\s_-]/g, '')];
  if (mapped) roles.add(mapped);
  if (u?.roles) for (const r of u.roles) if (COORD_ROLES.includes(r)) roles.add(r);
  // A person linked by e-mail in coordination_people is an internal reviewer by definition.
  const p = await q(undefined, `SELECT 1 FROM developed_licenses.coordination_people WHERE lower(user_email)=$1 AND active LIMIT 1`, [email]);
  if (p.rows.length) roles.add('internal_reviewer');
  return { email, name, rasidRole, roles: [...roles] };
}

function decodeURIComponentSafe(s: string) { try { return decodeURIComponent(s); } catch { return s; } }

export async function requireActor(request: any): Promise<Actor> {
  const a = await resolveActor(request);
  if (!a) throw httpError(401, 'يلزم تسجيل الدخول.', 'UNAUTHENTICATED');
  return a;
}

export async function needCap(request: any, cap: string): Promise<Actor> {
  const a = await requireActor(request);
  if (!can(a, cap)) throw httpError(403, 'ليست لديك صلاحية تنفيذ هذا الإجراء.', 'FORBIDDEN');
  return a;
}

export function permissionsOf(actor: Actor) {
  const perms: Record<string, boolean> = {};
  for (const cap of Object.keys(CAPS)) perms[cap] = can(actor, cap);
  return perms;
}
