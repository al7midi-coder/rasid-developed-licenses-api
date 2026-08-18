import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { pool } from '../db/pool.js';

const settingsSchema = z.object({
  bridgeProjectsEnabled: z.boolean(),
  routeEnabled: z.boolean(),
  routeSensitivityM: z.number().int().min(1).max(100),
  routeStreetEnabled: z.boolean(),
  routeStreetSensitivityM: z.number().int().min(1).max(100),
  streetOnlyEnabled: z.boolean(),
  actor: z.object({
    name: z.string().optional(),
    email: z.string().email().optional()
  }).optional()
});

async function ensureSettingsRow() {
  await pool.query(`
    INSERT INTO rasid_analysis_settings (id)
    VALUES (1)
    ON CONFLICT (id) DO NOTHING
  `);
}

function mapRow(row: Record<string, unknown>) {
  return {
    bridgeProjectsEnabled: row.bridge_projects_enabled !== false,
    routeEnabled: row.route_enabled !== false,
    routeSensitivityM: Number(row.route_sensitivity_m || 25),
    routeStreetEnabled: row.route_street_enabled !== false,
    routeStreetSensitivityM: Number(row.route_street_sensitivity_m || 8),
    streetOnlyEnabled: row.street_only_enabled !== false,
    updatedAt: row.updated_at || null,
    updatedBy: row.updated_by || {}
  };
}

export async function analysisSettingsRoutes(app: FastifyInstance) {
  app.get('/analysis-settings', async () => {
    await ensureSettingsRow();

    const result = await pool.query(`
      SELECT
        bridge_projects_enabled,
        route_enabled,
        route_sensitivity_m,
        route_street_enabled,
        route_street_sensitivity_m,
        street_only_enabled,
        updated_at,
        updated_by
      FROM rasid_analysis_settings
      WHERE id = 1
      LIMIT 1
    `);

    return {
      ok: true,
      settings: mapRow(result.rows[0] || {})
    };
  });

  app.put('/analysis-settings', async request => {
    const body = settingsSchema.parse(request.body);

    await ensureSettingsRow();

    const result = await pool.query(
      `UPDATE rasid_analysis_settings
       SET
         bridge_projects_enabled = $1,
         route_enabled = $2,
         route_sensitivity_m = $3,
         route_street_enabled = $4,
         route_street_sensitivity_m = $5,
         street_only_enabled = $6,
         updated_at = NOW(),
         updated_by = $7::jsonb
       WHERE id = 1
       RETURNING
         bridge_projects_enabled,
         route_enabled,
         route_sensitivity_m,
         route_street_enabled,
         route_street_sensitivity_m,
         street_only_enabled,
         updated_at,
         updated_by`,
      [
        body.bridgeProjectsEnabled,
        body.routeEnabled,
        body.routeSensitivityM,
        body.routeStreetEnabled,
        body.routeStreetSensitivityM,
        body.streetOnlyEnabled,
        JSON.stringify(body.actor || {})
      ]
    );

    return {
      ok: true,
      settings: mapRow(result.rows[0] || {})
    };
  });
}
