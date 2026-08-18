import { pool } from './db/pool.js';

const sourceUrl = process.env.LEGACY_LICENSES_URL;
if (!sourceUrl) throw new Error('LEGACY_LICENSES_URL is required');

type SourceRow = Record<string, unknown>;

const clean = (value: unknown) => String(value ?? '').trim().replace(/\s+/g, ' ');
const normalized = (value: unknown) => clean(value)
  .replace(/[أإآ]/g, 'ا')
  .replace(/ى/g, 'ي')
  .toLowerCase();
const number = (value: unknown) => clean(value).replace(/[^0-9]/g, '');

function expand(row: SourceRow): SourceRow {
  for (const key of ['RawJSON', 'rawData', 'raw_data']) {
    const value = row[key];
    if (typeof value !== 'string' || !value.trim().startsWith('{')) continue;
    try { return { ...JSON.parse(value), ...row }; } catch { /* keep flat row */ }
  }
  return row;
}

function pick(row: SourceRow, ...aliases: string[]): string {
  for (const alias of aliases) {
    if (row[alias] !== undefined && clean(row[alias])) return clean(row[alias]);
    const wanted = normalized(alias);
    const key = Object.keys(row).find(candidate => normalized(candidate) === wanted);
    if (key && clean(row[key])) return clean(row[key]);
  }
  return '';
}

function coordinate(row: SourceRow, kind: 'lat' | 'lng'): number | null {
  const aliases = kind === 'lat'
    ? ['خط العرض', 'Latitude', 'Lat', 'latitude']
    : ['خط الطول', 'Longitude', 'Lon', 'Long', 'longitude'];
  const direct = Number(pick(row, ...aliases));
  if (Number.isFinite(direct) && (kind === 'lat' ? Math.abs(direct) <= 90 : Math.abs(direct) <= 180)) return direct;
  const pair = pick(row, 'احداثيات الموقع', 'إحداثيات الموقع', 'coordinates').match(/(-?\d+(?:\.\d+)?)\D+(-?\d+(?:\.\d+)?)/);
  if (!pair) return null;
  const value = Number(kind === 'lat' ? pair[1] : pair[2]);
  return Number.isFinite(value) ? value : null;
}

const response = await fetch(sourceUrl);
if (!response.ok) throw new Error(`Legacy source returned ${response.status}`);
const payload = await response.json() as { ok?: boolean; rows?: SourceRow[] };
if (!payload.ok || !Array.isArray(payload.rows)) throw new Error('Legacy source returned invalid data');

const unique = new Map<string, SourceRow>();
for (const rawRow of payload.rows) {
  const row = expand(rawRow);
  const licenseNumber = number(pick(row, 'رقم الرخصة', 'رقم الترخيص', 'licenseNumber', 'LicenseNumber'));
  if (licenseNumber) unique.set(licenseNumber, row);
}

const rows = [...unique.entries()];
let imported = 0;
for (let offset = 0; offset < rows.length; offset += 400) {
  const batch = rows.slice(offset, offset + 400);
  const params: unknown[] = [];
  const values = batch.map(([licenseNumber, row], index) => {
    const dependencyValue = normalized(pick(row, 'التبعية', 'تابع/غير تابع', 'isRelated', 'afRelated'));
    const dependency = dependencyValue.includes('غير تابع') ? 'غير تابع' : 'تابع';
    const department = pick(row, 'الإدارة', 'الادارة', 'الإدارة التابعة', 'department', 'agDepartment') || 'المحاور الرئيسية';
    const status = pick(row, 'الحالة', 'حالة التحليل', 'analysisStatus', 'ahStatus', 'حالة طلب الإغلاق', 'حالة الرخصة') || 'تحت الإجراء';
    const version = licenseNumber.length === 7 && licenseNumber.startsWith('2') ? 'النسخة المطورة' : 'النسخة القديمة';
    const fields = [
      licenseNumber,
      pick(row, 'رقم الإغلاق', 'رقم أمر الإغلاق', 'رقم طلب الإغلاق', 'closureNumber'),
      pick(row, 'نوع الرخصة', 'licenseType'),
      pick(row, 'المقاول', 'اسم المقاول', 'contractor'),
      pick(row, 'الاستشاري', 'اسم الاستشاري', 'consultant'),
      pick(row, 'اسم المشروع', 'المشروع', 'projectName'),
      pick(row, 'اسم الطريق', 'اسم الشارع', 'الطريق', 'الشارع', 'roadName'),
      pick(row, 'الحي', 'district'),
      pick(row, 'البلدية', 'municipality'),
      pick(row, 'الجهة المالكة', 'ownerEntity'),
      pick(row, 'الجهة المشرفة', 'اسم الجهة المشرفة', 'supervisingEntity'),
      dependency,
      department,
      status,
      version,
      pick(row, 'السبب', 'سبب التصنيف', 'reason'),
      coordinate(row, 'lat'),
      coordinate(row, 'lng'),
      JSON.stringify(row),
      pick(row, 'اسم الملف المصدر', 'sourceFile') || 'Google Sheet migration'
    ];
    params.push(...fields);
    const start = index * fields.length;
    return `(${fields.map((_, fieldIndex) => `$${start + fieldIndex + 1}`).join(',')})`;
  });

  await pool.query(`INSERT INTO licenses (
    license_number, closure_number, license_type, contractor, consultant,
    project_name, road_name, district, municipality, owner_entity,
    supervising_entity, dependency, department, analysis_status,
    license_version, reason, latitude, longitude, raw_data, source_file
  ) VALUES ${values.join(',')}
  ON CONFLICT (license_number) DO UPDATE SET
    closure_number=EXCLUDED.closure_number, license_type=EXCLUDED.license_type,
    contractor=EXCLUDED.contractor, consultant=EXCLUDED.consultant,
    project_name=EXCLUDED.project_name, road_name=EXCLUDED.road_name,
    district=EXCLUDED.district, municipality=EXCLUDED.municipality,
    owner_entity=EXCLUDED.owner_entity, supervising_entity=EXCLUDED.supervising_entity,
    dependency=EXCLUDED.dependency, department=EXCLUDED.department,
    analysis_status=EXCLUDED.analysis_status, license_version=EXCLUDED.license_version,
    reason=EXCLUDED.reason, latitude=EXCLUDED.latitude, longitude=EXCLUDED.longitude,
    raw_data=EXCLUDED.raw_data, source_file=EXCLUDED.source_file, updated_at=NOW()`, params);
  imported += batch.length;
  console.log(`Imported ${imported}/${rows.length}`);
}

await pool.query('REFRESH MATERIALIZED VIEW license_daily_metrics');
await pool.end();
console.log(JSON.stringify({ sourceRows: payload.rows.length, uniqueLicenses: rows.length, imported }));
