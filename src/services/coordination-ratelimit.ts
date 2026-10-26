/** In-memory sliding-window limiter + anti-enumeration counter (per IP). Single-process; swap for Redis if scaled out. */
export class RateLimiter {
  private hits = new Map<string, number[]>();
  private misses = new Map<string, number[]>();
  constructor(
    public limit = 20,
    public windowMs = 60_000,
    public missLimit = 8,
    public missWindowMs = 10 * 60_000
  ) {}

  private prune(arr: number[] | undefined, windowMs: number, now: number) {
    const a = (arr ?? []).filter(t => now - t < windowMs);
    return a;
  }

  /** Returns true when the request is allowed (and records it). */
  hit(key: string, now = Date.now()): boolean {
    const a = this.prune(this.hits.get(key), this.windowMs, now);
    if (a.length >= this.limit || this.prune(this.misses.get(key), this.missWindowMs, now).length >= this.missLimit) {
      this.hits.set(key, a);
      return false;
    }
    a.push(now);
    this.hits.set(key, a);
    if (this.hits.size > 5000) this.gc(now);
    return true;
  }

  miss(key: string, now = Date.now()) {
    const a = this.prune(this.misses.get(key), this.missWindowMs, now);
    a.push(now);
    this.misses.set(key, a);
  }

  reset() { this.hits.clear(); this.misses.clear(); }

  private gc(now: number) {
    for (const [k, v] of this.hits) if (!v.some(t => now - t < this.windowMs)) this.hits.delete(k);
    for (const [k, v] of this.misses) if (!v.some(t => now - t < this.missWindowMs)) this.misses.delete(k);
  }
}
