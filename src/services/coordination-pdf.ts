import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

function findChromium(): string | undefined {
  const env = process.env.CHROMIUM_PATH || process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  if (env && existsSync(env)) return env;
  for (const p of ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable']) if (existsSync(p)) return p;
  const roots = [process.env.PLAYWRIGHT_BROWSERS_PATH, '/opt/pw-browsers', path.join(process.env.HOME || '/root', '.cache/ms-playwright')].filter(Boolean) as string[];
  for (const r of roots) {
    try {
      for (const d of readdirSync(r).sort().reverse()) {
        for (const sub of ['chrome-linux/chrome', 'chrome-linux/headless_shell']) {
          const p = path.join(r, d, sub);
          if (d.startsWith('chromium') && existsSync(p)) return p;
        }
      }
    } catch { /* ignore */ }
  }
  return undefined;
}

/**
 * Renders HTML to an A4 PDF via playwright-core/chromium.
 * Returns null when chromium/playwright is unavailable so the caller can fall back to returning HTML for client-side print.
 */
export async function htmlToPdf(html: string): Promise<Buffer | null> {
  if (process.env.COORD_DISABLE_PDF === '1') return null;
  let browser: any;
  try {
    const pw: any = await import('playwright-core');
    const chromium = pw.chromium ?? pw.default?.chromium;
    const executablePath = findChromium();
    if (!chromium || !executablePath) return null;
    browser = await chromium.launch({ executablePath, args: ['--no-sandbox', '--disable-gpu'], timeout: 15000 });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load', timeout: 20000 });
    const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '14mm', bottom: '16mm', left: '12mm', right: '12mm' }, displayHeaderFooter: false, preferCSSPageSize: false });
    return Buffer.from(pdf);
  } catch {
    return null;
  } finally {
    try { await browser?.close(); } catch { /* ignore */ }
  }
}
