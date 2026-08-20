import type { FastifyInstance } from 'fastify';
import { pool } from '../db/pool.js';

export async function developedMapDetailsRoutes(app: FastifyInstance) {
  app.get('/map-details', async request => {
    const q = request.query as Record<string, unknown>;
    const box = String(q.bbox || '').split(',').map(Number);
    if (box.length !== 4 || box.some(x => !Number.isFinite(x))) {
      throw Object.assign(Error('bbox غير صالح'), { statusCode: 400 });
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
          NULLIF(l.extra_payload->>'issuedAt','')::timestamptz,
          NULLIF(l.extra_payload->>'issued_at','')::timestamptz,
          NULLIF(sl.raw_payload->>'issuedAt','')::timestamptz,
          NULLIF(sl.raw_payload->>'issued_at','')::timestamptz
        ) AS issued_at,
        COALESCE(
          NULLIF(l.extra_payload->>'expiresAt','')::timestamptz,
          NULLIF(l.extra_payload->>'expires_at','')::timestamptz,
          NULLIF(sl.raw_payload->>'expiresAt','')::timestamptz,
          NULLIF(sl.raw_payload->>'expires_at','')::timestamptz
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
      ORDER BY l.updated_at DESC
      LIMIT 2000
    `, box);

    return {
      type: 'FeatureCollection',
      features: rows.map(row => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [Number(row.longitude), Number(row.latitude)]
        },
        properties: row
      }))
    };
  });
}
