import { randomUUID } from 'node:crypto';
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

function coordinates(row: Record<string, unknown>) {
  const raw = text(row, 'إحداثيات الموقع', 'الاحداثيات', 'coordinates');
  const nums = raw.match(/[-+]?\d+(?:\.\d+)?/g)?.map(Number).filter(Number.isFinite) || [];
  if (nums.length < 2) return { latitude: null, longitude: null };
  let latitude = nums[0]!, longitude = nums[1]!;
  if (Math.abs(latitude) > 90 && Math.abs(longitude) <= 90) [latitude, longitude] = [longitude, latitude];
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return { latitude: null, longitude: null };
  return { latitude, longitude };
}

async function ensureCollectorSource(client: import('pg').PoolClient) {
  const existing = await client.query<{ id: string }>(`SELECT id FROM developed_licenses.sources WHERE code='collector:affiliated-sheet' LIMIT 1`);
  if (existing.rows[0]?.id) return existing.rows[0].id;
  const id = randomUUID();
  const inserted = await client.query<{ id: string }>(`INSERT INTO developed_licenses.sources(id,code,name,source_type) VALUES($1,'collector:affiliated-sheet','الجامع - التراخيص التابعة','google_sheet') ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,source_type=EXCLUDED.source_type,updated_at=now() RETURNING id`, [id]);
  return inserted.rows[0]!.id;
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
      const sourceId = await ensureCollectorSource(client);
      for (const raw of sheetRows) {
        const licenseNumber = text(raw, 'رقم الرخصة');
        if (!licenseNumber) continue;
        const street = cleanStreetName(text(raw, 'اسم الشارع')) || null;
        const processingDeadline = dateOrNull(text(raw, 'انتهاء فترة المعالجة', 'متاح للإغلاق خلال - تاريخ ووقت'));
        const { latitude, longitude } = coordinates(raw);
        const payload = JSON.stringify({ collectorBackgroundRefresh: raw, collectorBackgroundRefreshedAt: new Date().toISOString() });
        await client.query(`INSERT INTO developed_licenses.source_licenses(id,source_id,license_number,raw_payload,created_at,updated_at) VALUES($1,$2,$3,$4::jsonb,now(),now()) ON CONFLICT(license_number) DO UPDATE SET source_id=EXCLUDED.source_id,raw_payload=developed_licenses.source_licenses.raw_payload || EXCLUDED.raw_payload,updated_at=now()`, [randomUUID(), sourceId, licenseNumber, JSON.stringify(raw)]);
        const result = await client.query(
          `INSERT INTO developed_licenses.licenses(
             id,license_number,source_id,dependency,department,status,closure_request_status,contractor,consultant,project_name,owner_entity,street_name,district,municipality,closure_order_number,processing_deadline,latitude,longitude,extra_payload,source_updated_at,created_at,updated_at
           ) VALUES($1,$2,$3,'تابع',$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15::timestamptz,$16,$17,$18::jsonb,now(),now(),now())
           ON CONFLICT(license_number) DO UPDATE SET
             source_id=EXCLUDED.source_id,
             dependency=CASE WHEN developed_licenses.licenses.manual_classification IS NOT NULL THEN developed_licenses.licenses.dependency ELSE 'تابع' END,
             department=CASE WHEN developed_licenses.licenses.manual_classification IS NOT NULL THEN COALESCE(developed_licenses.licenses.manual_department,developed_licenses.licenses.department) ELSE COALESCE(NULLIF(EXCLUDED.department,''),developed_licenses.licenses.department) END,
             status=COALESCE(NULLIF(EXCLUDED.status,''),developed_licenses.licenses.status),
             closure_request_status=COALESCE(NULLIF(EXCLUDED.closure_request_status,''),developed_licenses.licenses.closure_request_status),
             contractor=COALESCE(NULLIF(EXCLUDED.contractor,''),developed_licenses.licenses.contractor),
             consultant=COALESCE(NULLIF(EXCLUDED.consultant,''),developed_licenses.licenses.consultant),
             project_name=COALESCE(NULLIF(EXCLUDED.project_name,''),developed_licenses.licenses.project_name),
             owner_entity=COALESCE(NULLIF(EXCLUDED.owner_entity,''),developed_licenses.licenses.owner_entity),
             street_name=COALESCE(EXCLUDED.street_name,developed_licenses.licenses.street_name),
             district=COALESCE(NULLIF(EXCLUDED.district,''),developed_licenses.licenses.district),
             municipality=COALESCE(NULLIF(EXCLUDED.municipality,''),developed_licenses.licenses.municipality),
             closure_order_number=COALESCE(NULLIF(EXCLUDED.closure_order_number,''),developed_licenses.licenses.closure_order_number),
             processing_deadline=COALESCE(EXCLUDED.processing_deadline,developed_licenses.licenses.processing_deadline),
             latitude=COALESCE(EXCLUDED.latitude,developed_licenses.licenses.latitude),
             longitude=COALESCE(EXCLUDED.longitude,developed_licenses.licenses.longitude),
             extra_payload=COALESCE(developed_licenses.licenses.extra_payload,'{}'::jsonb) || EXCLUDED.extra_payload,
             source_updated_at=now(),updated_at=now()`,
          [
            randomUUID(), licenseNumber, sourceId, text(raw, 'الادارة', 'الإدارة', 'الإدارة التابعة'),
            text(raw, 'حالة الرخصة') || 'تحت الإجراء', text(raw, 'حالة طلب الإغلاق'), text(raw, 'اسم المقاول'),
            text(raw, 'اسم الاستشاري'), text(raw, 'اسم المشروع'), text(raw, 'اسم القطاع', 'الجهة المالكة', 'اسم الجهة المالكة'),
            street, text(raw, 'الحي'), text(raw, 'البلدية'), text(raw, 'رقم أمر الإغلاق'), processingDeadline, latitude, longitude, payload
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
