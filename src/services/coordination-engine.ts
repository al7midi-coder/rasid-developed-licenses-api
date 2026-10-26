import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export type Engine = {
  seedTemplates: () => any[];
  resolveTemplate: (a: any) => { template: any; reason?: string };
  buildMinutes: (a: any) => any;
  renderHtml: (m: any, o?: any) => string;
  normalizeDigType: (s: string) => string;
  dayNameAr?: (d: any) => string;
  validateMerge?: (l: any[]) => any;
  dedupeLicences?: (l: any[]) => any[];
  parseDuration?: (v: any) => number | null;
  durationOf?: (o: any) => number | null;
};

let cached: Engine | null = null;

function candidates(): string[] {
  const here = (() => { try { return path.dirname(fileURLToPath(import.meta.url)); } catch { return process.cwd(); } })();
  return [
    process.env.COORD_ENGINE_PATH || '',
    path.resolve(here, '../../../rasid/coord-engine.js'),
    path.resolve(here, '../../rasid/coord-engine.js'),
    path.resolve(here, '../../../c48/rasid/coord-engine.js'),
    path.resolve(process.cwd(), 'rasid/coord-engine.js'),
    path.resolve(process.cwd(), '../rasid/coord-engine.js')
  ].filter(Boolean);
}

/** Loads the shared UMD engine (browser + Node) via createRequire. */
export function engine(): Engine {
  if (cached) return cached;
  const req = createRequire(import.meta.url);
  for (const p of candidates()) {
    if (existsSync(p)) { cached = req(p) as Engine; return cached; }
  }
  throw Object.assign(new Error('محرك المحاضر غير متوفر.'), { statusCode: 503 });
}
export function setEngineForTests(e: Engine | null) { cached = e; }
