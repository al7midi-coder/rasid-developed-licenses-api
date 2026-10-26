import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const secret = process.env.COORD_HMAC_SECRET || process.env.API_ADMIN_TOKEN || randomBytes(32).toString('hex');
export const TOKEN_TTL_MS = 30 * 60 * 1000;

const b64 = (b: Buffer | string) => Buffer.from(b).toString('base64url');
const sign = (payload: string) => createHmac('sha256', secret).update(payload).digest();

/** Short-lived token bound to a single licence number (no request listing, no re-search needed). */
export function issueToken(licenseNumber: string, ttlMs = TOKEN_TTL_MS, now = Date.now()): string {
  const payload = b64(JSON.stringify({ l: licenseNumber, e: now + ttlMs, n: randomBytes(6).toString('hex') }));
  return `${payload}.${b64(sign(payload))}`;
}

export function verifyToken(token: unknown, now = Date.now()): { licenseNumber: string } | null {
  if (typeof token !== 'string' || token.length > 600 || !token.includes('.')) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expected = sign(payload);
  let given: Buffer;
  try { given = Buffer.from(sig, 'base64url'); } catch { return null; }
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const d = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (typeof d.l !== 'string' || typeof d.e !== 'number' || d.e < now) return null;
    return { licenseNumber: d.l };
  } catch { return null; }
}
