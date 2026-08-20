import { pool } from '../db/pool.js';
import { cleanStreetName } from './street-normalization.js';

const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwrCeFugL6G88ZaqGzno5glW2zU2nMpHlHOplxKcq5w8-moVkkfyDLre2V6vXSyBTdC/exec';
const SHEET_NAME = 'التراخيص التابعة';
const INTERVAL_MS = 10 * 60 * 1000;
let running = false;
let timer: NodeJS.Timeout | null = null;

function text(row: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = String(row[key] ?? '').trim();
    if (value) return value;
  }
  return '';
}

function dateOrNull(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

async function scriptUrl() {
  const { rows } = await pool.query<{ settings: Record<string, unknown> }>(
    `SELECT settings FROM developed_licenses.sources WHERE code='governance:collector' LIMIT 1`
  );
  return String(rows[0]?.settings?.appsScriptUrl || DEFAULT_SCRIPT_URL).trim();
}

async function readAffiliatedRows(url: string) {
  const rows: Record<string, unknown>[] = [];
  let headers: string[] = [];
  let startRow = 2;
  let done = false;
  let guard = 0;

  while (!done && guard++ < 1000) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'readSheetChunk', sheetName: SHEET_NAME, startRow, chunkSize: 600 })
    });
    if (!response.ok) throw new Error(`Apps Script HTTP ${response.status}`);
    const payload = await response.json() as Record<string, unknown>;
    if (!payload.ok) throw new Error(String(payload.error || 'تعذر قراءة شيت التراخيص التابعة'));
    if (Array.isArray(payload.headers)) headers = payload.headers.map(x => String(x || '').trim());
    const values = Array.isArray(payload.rows) ? payload.rows as unknown[][] : [];
    for (const valuesRow of values) {
      const row: Record<string, unknown> = {};
      headers.forEach((header, index) => { if (header) row[header] = valuesRow[index] ?? ''; });
      if (text(row, 'رقم الرخصة')) rows.push(row);
    }
    done = Boolean(payload.done);
    startRow = Number(payload.nextStartRow || (startRow + Math.max(values.length, 1)));
    if (!values.length && !done) break;
  }
  return rows;
}

export async function refreshDevelopedLicensesFromAffiliatedSheet() {
  if (running) return { ok: true, skipped: true };
  running = true;
  const startedAt = Date.now();
  try {
    const url = await scriptUrl();
    const sheetRows = await readAffiliatedRows(url);
    const client = await pool.connect();
    let matched = 0;
    try {
      await client.query('BEGIN');
      for (const raw of sheetRows) {
        const licenseNumber = text(raw, 'رقم الرخصة');
        if (!licenseNumber) continue;
        const street = cleanStreetName(text(raw, 'اسم الشارع')) || null;
        const processingDeadline = dateOrNull(text(raw, 'انتهاء فترة المعالجة', 'متاح للإغلاق خلال - تاريخ ووقت'));
        const result = await client.query(
          `UPDATE developed_licenses.licenses SET
             status=COALESCE(NULLIF($2,''),status),
             closure_request_status=COALESCE(NULLIF($3,''),closure_request_status),
             contractor=COALESCE(NULLIF($4,''),contractor),
             consultant=COALESCE(NULLIF($5,''),consultant),
             project_name=COALESCE(NULLIF($6,''),project_name),
             owner_entity=COALESCE(NULLIF($7,''),owner_entity),
             street_name=COALESCE($8,street_name),
             district=COALESCE(NULLIF($9,''),district),
             municipality=COALESCE(NULLIF($10,''),municipality),
             closure_order_number=COALESCE(NULLIF($11,''),closure_order_number),
             processing_deadline=COALESCE($12::timestamptz,processing_deadline),
             extra_payload=COALESCE(extra_payload,'{}'::jsonb) || $13::jsonb,
             source_updated_at=now(),updated_at=now()
           WHERE license_number=$1 AND dependency='تابع'`,
          [
            licenseNumber,
            text(raw, 'حالة الرخصة'),
            text(raw, 'حالة طلب الإغلاق'),
            text(raw, 'اسم المقاول'),
            text(raw, 'اسم الاستشاري'),
            text(raw, 'اسم المشروع'),
            text(raw, 'اسم القطاع', 'الجهة المالكة', 'اسم الجهة المالكة'),
            street,
            text(raw, 'الحي'),
            text(raw, 'البلدية'),
            text(raw, 'رقم أمر الإغلاق'),
            processingDeadline,
            JSON.stringify({ collectorBackgroundRefresh: raw, collectorBackgroundRefreshedAt: new Date().toISOString() })
          ]
        );
        matched += result.rowCount || 0;
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    return { ok: true, sheetRows: sheetRows.length, updatedExisting: matched, elapsedMs: Date.now() - startedAt };
  } finally {
    running = false;
  }
}

export function startAffiliatedSheetBackgroundSync() {
  if (timer) return;
  setTimeout(() => refreshDevelopedLicensesFromAffiliatedSheet().catch(error => console.error('Affiliated sheet initial sync failed', error)), 60_000);
  timer = setInterval(() => refreshDevelopedLicensesFromAffiliatedSheet().catch(error => console.error('Affiliated sheet background sync failed', error)), INTERVAL_MS);
  timer.unref?.();
}
