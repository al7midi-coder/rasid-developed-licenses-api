import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { pool } from '../db/pool.js';

const actorSchema = z.object({
  name: z.string().max(200).optional(),
  email: z.string().email().optional()
}).optional();

const analysisSchema = z.object({
  bridgeProjectsEnabled: z.boolean(),
  bridgeRouteEnabled: z.boolean().default(false),
  bridgeRouteSensitivityM: z.number().int().min(1).max(100).default(25),
  routeEnabled: z.boolean(),
  routeSensitivityM: z.number().int().min(1).max(100),
  routeStreetEnabled: z.boolean(),
  routeStreetSensitivityM: z.number().int().min(1).max(100),
  streetOnlyEnabled: z.boolean(),
  actor: actorSchema
});

const collectorSchema = z.object({
  version: z.string().min(1).max(40),
  extensionId: z.string().regex(/^[a-p]{32}$/i, 'معرف إضافة Chrome غير صالح').optional(),
  bridgeChannel: z.string().min(1).max(120).optional(),
  appsScriptVersion: z.string().min(1).max(40).optional(),
  appsScriptUrl: z.string().url().optional(),
  packageUrl: z.string().url().optional(),
  notes: z.string().max(1000).optional(),
  actor: actorSchema
});

const routeType = z.enum(['administration', 'main', 'transit', 'bridges']);
const routeSchema = z.object({
  name: z.string().min(1).max(200),
  department: z.string().min(1).max(200),
  sourceFile: z.string().max(500).optional(),
  geojson: z.object({
    type: z.literal('FeatureCollection'),
    features: z.array(z.unknown())
  }),
  actor: actorSchema
});

const analysisDefaults = {
  bridgeProjectsEnabled: true,
  bridgeRouteEnabled: false,
  bridgeRouteSensitivityM: 25,
  routeEnabled: true,
  routeSensitivityM: 25,
  routeStreetEnabled: true,
  routeStreetSensitivityM: 8,
  streetOnlyEnabled: true
};

const collectorDefaults = {
  version: '0.24.7',
  bridgeChannel: 'rasid-center-license-lookup-current',
  appsScriptVersion: '0.24.7',
  appsScriptUrl: 'https://script.google.com/macros/s/AKfycbwrCeFugL6G88ZaqGzno5glW2zU2nMpHlHOplxKcq5w8-moVkkfyDLre2V6vXSyBTdC/exec'
};

async function readSettings(code: string) {
  const { rows } = await pool.query<{ settings: Record<string, unknown>; updated_at: string }>(
    `SELECT settings, updated_at FROM developed_licenses.sources WHERE code=$1 LIMIT 1`,
    [code]
  );
  return rows[0] || null;
}

async function writeSettings(code: string, name: string, settings: Record<string, unknown>) {
  const id = randomUUID();
  const { rows } = await pool.query(
    `INSERT INTO developed_licenses.sources(id,code,name,source_type,settings,created_at,updated_at)
     VALUES($1,$2,$3,'governance',$4::jsonb,now(),now())
     ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,settings=EXCLUDED.settings,updated_at=now()
     RETURNING id,code,name,settings,updated_at`,
    [id, code, name, JSON.stringify(settings)]
  );
  return rows[0];
}

function mapRoute(row: Record<string, unknown>) {
  const settings = (row.settings || {}) as Record<string, unknown>;
  return {
    id: row.id,
    name: settings.name || row.name,
    department: settings.department || '',
    layer_type: settings.layerType || '',
    source_file: settings.sourceFile || '',
    geojson: settings.geojson || null,
    active: true,
    updated_at: row.updated_at,
    updated_by: settings.actor || {}
  };
}

export async function governanceRoutes(app: FastifyInstance) {
  app.get('/analysis-settings', async () => {
    const saved = await readSettings('governance:analysis');
    return {
      ok: true,
      settings: { ...analysisDefaults, ...(saved?.settings || {}), updatedAt: saved?.updated_at || null }
    };
  });

  app.put('/analysis-settings', async request => {
    const body = analysisSchema.parse(request.body);
    const saved = await writeSettings('governance:analysis', 'Developed License Analysis Settings', {
      ...body,
      updatedAt: new Date().toISOString()
    });
    return { ok: true, settings: saved.settings };
  });

  app.get('/route-layers', async () => {
    const { rows } = await pool.query(
      `SELECT id,code,name,settings,updated_at
       FROM developed_licenses.sources
       WHERE code LIKE 'governance:route:%'
       ORDER BY code`
    );
    return { ok: true, rows: rows.map(mapRoute) };
  });

  app.put('/route-layers/:layerType', async request => {
    const layerType = routeType.parse((request.params as { layerType: string }).layerType);
    const body = routeSchema.parse(request.body);
    const saved = await writeSettings(`governance:route:${layerType}`, `Route Layer ${layerType}`, {
      ...body,
      layerType,
      updatedAt: new Date().toISOString()
    });
    return { ok: true, row: mapRoute(saved) };
  });

  app.get('/collector', async () => {
    const saved = await readSettings('governance:collector');
    return {
      ok: true,
      collector: { ...collectorDefaults, ...(saved?.settings || {}), updatedAt: saved?.updated_at || null }
    };
  });

  app.put('/collector', async request => {
    const body = collectorSchema.parse(request.body);
    const saved = await writeSettings('governance:collector', 'Rasid License Collector Governance', {
      ...body,
      bridgeChannel: body.bridgeChannel || 'rasid-center-license-lookup-current',
      updatedAt: new Date().toISOString()
    });
    return { ok: true, collector: saved.settings };
  });
}
