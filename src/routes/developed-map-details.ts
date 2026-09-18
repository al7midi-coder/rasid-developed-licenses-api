import type { FastifyInstance } from 'fastify';
import { pool } from '../db/pool.js';

type MapRow = Record<string, unknown>;

const text = (value: unknown) => String(value ?? '').trim();
const rawValue = (raw: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = raw?.[key];
    if (value !== undefined && value !== null && text(value)) return value;
  }
  return null;
};

export async function developedMapDetailsRoutes(app: FastifyInstance) {
  app.get('/map-details', async request => {
    const q = request.query as Record<string, unknown>;
    const box = String(q.bbox || '').split(',').map(Number);
    if (box.length !== 4 || box.some(x => !Number.isFinite(x))) {
      throw Object.assign(Error('bbox غير صالح'), { statusCode: 400 });
    }

    const requestedDependency = text(q.dependency || 'تابع');
    const dependency = requestedDependency === 'all' || requestedDependency === 'الكل'
      ? 'all'
      : requestedDependency === 'غير تابع'
        ? 'غير تابع'
        : 'تابع';
    const department = text(q.department);

    const features: Array<{ type: 'Feature'; geometry: { type: 'Point'; coordinates: number[] }; properties: MapRow }> = [];

    if (dependency === 'تابع' || dependency === 'all') {
      const values: unknown[] = [...box];
      let departmentSql = '';
      if (department) {
        values.push(department);
        departmentSql = ` AND l.department=$${values.length}`;
      }
      const { rows } = await pool.query(`
        SELECT
          l.id,
          l.license_number,
          l.closure_order_number,
          l.contractor,
          l.consultant,
          l.project_name,
          l.owner_entity,
          COALESCE(
            NULLIF(l.extra_payload->>'supervisingEntity',''),
            NULLIF(l.extra_payload->>'supervising_entity',''),
            NULLIF(sl.raw_payload->>'الجهة المشرفة',''),
            NULLIF(sl.raw_payload->>'اسم الجهة المشرفة',''),
            NULLIF(sl.raw_payload->>'supervisingEntity',''),
            NULLIF(sl.raw_payload->>'supervising_entity','')
          ) AS supervising_entity,
          COALESCE(
            NULLIF(l.extra_payload->>'licenseType',''),
            NULLIF(l.extra_payload->>'license_type',''),
            NULLIF(sl.raw_payload->>'نوع الترخيص',''),
            NULLIF(sl.raw_payload->>'licenseType',''),
            NULLIF(sl.raw_payload->>'license_type','')
          ) AS license_type,
          l.district,
          l.municipality,
          l.street_name,
          l.route_name,
          l.dependency,
          l.department,
          l.status AS internal_status,
          l.closure_request_status,
          COALESCE(
            NULLIF(l.extra_payload->>'issuedAt',''),
            NULLIF(l.extra_payload->>'issued_at',''),
            NULLIF(sl.raw_payload->>'issuedAt',''),
            NULLIF(sl.raw_payload->>'issued_at',''),
            NULLIF(sl.raw_payload->>'تاريخ الإصدار','')
          ) AS issued_at,
          COALESCE(
            NULLIF(l.extra_payload->>'expiresAt',''),
            NULLIF(l.extra_payload->>'expires_at',''),
            NULLIF(sl.raw_payload->>'expiresAt',''),
            NULLIF(sl.raw_payload->>'expires_at',''),
            NULLIF(sl.raw_payload->>'تاريخ الانتهاء','')
          ) AS expires_at,
          l.processing_deadline,
          l.latitude,
          l.longitude,
          s.name AS source_name,
          COALESCE(
            NULLIF(l.extra_payload->>'licenseVersion',''),
            NULLIF(l.extra_payload->>'license_version',''),
            NULLIF(sl.raw_payload->>'النسخة',''),
            NULLIF(sl.raw_payload->>'licenseVersion','')
          ) AS license_version,
          ar.matched_route,
          ar.matched_street,
          ar.match_method,
          CASE
            WHEN ar.matched_route IS NOT NULL THEN ar.matched_route
            WHEN ar.matched_street IS NOT NULL THEN ar.matched_street
            WHEN ar.match_method IS NOT NULL THEN ar.match_method
            ELSE NULL
          END AS classification_reason
        FROM developed_licenses.licenses l
        LEFT JOIN developed_licenses.sources s ON s.id=l.source_id
        LEFT JOIN developed_licenses.source_licenses sl ON sl.license_number=l.license_number
        LEFT JOIN LATERAL (
          SELECT matched_route, matched_street, match_method
          FROM developed_licenses.analysis_results a
          WHERE a.license_number=l.license_number
          ORDER BY a.analyzed_at DESC, a.created_at DESC
          LIMIT 1
        ) ar ON true
        WHERE l.dependency='تابع'
          AND l.longitude BETWEEN $1 AND $3
          AND l.latitude BETWEEN $2 AND $4
          ${departmentSql}
        ORDER BY l.updated_at DESC
        LIMIT 2000
      `, values);

      for (const row of rows) {
        features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [Number(row.longitude), Number(row.latitude)] },
          properties: row
        });
      }
    }

    if (dependency === 'غير تابع' || dependency === 'all') {
      const values: unknown[] = [...box];
      let departmentSql = '';
      if (department) {
        values.push(department);
        departmentSql = ` AND COALESCE(
          NULLIF(l.department,''),
          NULLIF(sl.raw_payload->>'الإدارة',''),
          NULLIF(sl.raw_payload->>'الادارة',''),
          NULLIF(sl.raw_payload->>'الإدارة التابعة',''),
          NULLIF(sl.raw_payload->>'department','')
        )=$${values.length}`;
      }

      const { rows } = await pool.query(`
        SELECT
          sl.license_number,
          sl.raw_payload,
          sl.updated_at AS source_updated_at,
          l.id,
          l.dependency AS stored_dependency,
          l.department AS stored_department,
          l.status AS stored_status,
          l.closure_request_status AS stored_closure_status,
          l.processing_deadline AS stored_processing_deadline,
          geo.latitude,
          geo.longitude,
          s.name AS source_name
        FROM developed_licenses.source_licenses sl
        LEFT JOIN developed_licenses.licenses l ON l.license_number=sl.license_number
        LEFT JOIN developed_licenses.sources s ON s.id=sl.source_id
        CROSS JOIN LATERAL (
          SELECT
            COALESCE(
              CASE WHEN NULLIF(sl.raw_payload->>'latitude','') ~ '^-?[0-9]+(?:\\.[0-9]+)?$' THEN (sl.raw_payload->>'latitude')::double precision END,
              CASE WHEN NULLIF(sl.raw_payload->>'lat','') ~ '^-?[0-9]+(?:\\.[0-9]+)?$' THEN (sl.raw_payload->>'lat')::double precision END,
              CASE WHEN NULLIF(sl.raw_payload->>'خط العرض','') ~ '^-?[0-9]+(?:\\.[0-9]+)?$' THEN (sl.raw_payload->>'خط العرض')::double precision END,
              CASE WHEN split_part(COALESCE(sl.raw_payload->>'إحداثيات الموقع',''),',',1) ~ '^\\s*-?[0-9]+(?:\\.[0-9]+)?\\s*$' THEN trim(split_part(sl.raw_payload->>'إحداثيات الموقع',',',1))::double precision END
            ) AS latitude,
            COALESCE(
              CASE WHEN NULLIF(sl.raw_payload->>'longitude','') ~ '^-?[0-9]+(?:\\.[0-9]+)?$' THEN (sl.raw_payload->>'longitude')::double precision END,
              CASE WHEN NULLIF(sl.raw_payload->>'lng','') ~ '^-?[0-9]+(?:\\.[0-9]+)?$' THEN (sl.raw_payload->>'lng')::double precision END,
              CASE WHEN NULLIF(sl.raw_payload->>'lon','') ~ '^-?[0-9]+(?:\\.[0-9]+)?$' THEN (sl.raw_payload->>'lon')::double precision END,
              CASE WHEN NULLIF(sl.raw_payload->>'خط الطول','') ~ '^-?[0-9]+(?:\\.[0-9]+)?$' THEN (sl.raw_payload->>'خط الطول')::double precision END,
              CASE WHEN split_part(COALESCE(sl.raw_payload->>'إحداثيات الموقع',''),',',2) ~ '^\\s*-?[0-9]+(?:\\.[0-9]+)?\\s*$' THEN trim(split_part(sl.raw_payload->>'إحداثيات الموقع',',',2))::double precision END
            ) AS longitude
        ) geo
        WHERE COALESCE(l.dependency,'غير تابع')='غير تابع'
          AND geo.longitude BETWEEN $1 AND $3
          AND geo.latitude BETWEEN $2 AND $4
          ${departmentSql}
        ORDER BY COALESCE(l.updated_at,sl.updated_at) DESC
        LIMIT 2000
      `, values);

      for (const row of rows) {
        const raw = row.raw_payload && typeof row.raw_payload === 'object'
          ? row.raw_payload as Record<string, unknown>
          : {};
        const dependencyValue = text(row.stored_dependency || rawValue(raw, ['التبعية','dependency','isRelated'])) || 'غير تابع';
        if (dependencyValue === 'تابع') continue;
        const properties: MapRow = {
          id: row.id || null,
          license_number: row.license_number,
          closure_order_number: rawValue(raw, ['رقم أمر الإغلاق','رقم طلب الإغلاق','closureOrderNumber','closure_order_number']),
          contractor: rawValue(raw, ['اسم المقاول','المقاول','contractor']),
          consultant: rawValue(raw, ['اسم الاستشاري','الاستشاري','consultant']),
          project_name: rawValue(raw, ['اسم المشروع','المشروع','projectName','project_name']),
          owner_entity: rawValue(raw, ['اسم الجهة المالكة','الجهة المالكة','ownerEntity','owner_entity']),
          supervising_entity: rawValue(raw, ['اسم الجهة المشرفة','الجهة المشرفة','supervisingEntity','supervising_entity']),
          license_type: rawValue(raw, ['نوع الترخيص','نوع الرخصة','licenseType','license_type']),
          district: rawValue(raw, ['الحي','اسم الحي','district']),
          municipality: rawValue(raw, ['البلدية','municipality']),
          street_name: rawValue(raw, ['اسم الشارع','الشارع','streetName','street_name','roadName']),
          route_name: rawValue(raw, ['المسار المطابق','nearestPath','route_name']),
          dependency: dependencyValue,
          department: text(row.stored_department || rawValue(raw, ['الإدارة','الادارة','الإدارة التابعة','department'])) || null,
          internal_status: row.stored_status || rawValue(raw, ['حالة الرخصة','الحالة','status']),
          closure_request_status: row.stored_closure_status || rawValue(raw, ['حالة طلب الإغلاق','حالة طلب الاغلاق','closureRequestStatus']),
          issued_at: rawValue(raw, ['تاريخ إصدار الرخصة','تاريخ الإصدار','issuedAt','issued_at']),
          expires_at: rawValue(raw, ['تاريخ نهاية الرخصة','تاريخ الانتهاء','expiresAt','expires_at']),
          processing_deadline: row.stored_processing_deadline || rawValue(raw, ['انتهاء فترة المعالجة','processingDeadline','متاح للإغلاق خلال - تاريخ ووقت']),
          latitude: Number(row.latitude),
          longitude: Number(row.longitude),
          source_name: row.source_name || rawValue(raw, ['مصدر الرخصة','source']),
          license_version: rawValue(raw, ['النسخة','licenseVersion','license_version']),
          classification_reason: rawValue(raw, ['سبب التصنيف','سبب التبعية','classificationReason','reason'])
        };
        features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [Number(row.longitude), Number(row.latitude)] },
          properties
        });
      }
    }

    return { type: 'FeatureCollection', features };
  });
}
