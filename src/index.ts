import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { config, allowedOrigins } from './config.js';
import { pool } from './db/pool.js';
import { licenseRoutes } from './routes/licenses.js';
import { runMigrations } from './db/migrate.js';
import { authRoutes } from './routes/auth.js';
import { notificationRoutes } from './routes/notifications.js';
import { analysisSettingsRoutes } from './routes/analysis-settings.js';
import { developedLicenseRoutes } from './routes/developed-licenses.js';
import { googleSheetRoutes } from './routes/google-sheet.js';
import { governanceRoutes } from './routes/governance.js';
import { developedReferralRoutes } from './routes/developed-referrals.js';
import { developedExportRoutes } from './routes/developed-exports.js';
import { developedMapDetailsRoutes } from './routes/developed-map-details.js';
import { developedDatabaseAdminRoutes } from './routes/developed-database-admin.js';
import { normalizeDevelopedLicenseRequestBody } from './services/street-normalization.js';
import { startAffiliatedSheetBackgroundSync } from './services/dependent-sheet-sync.js';

if (config.AUTO_MIGRATE === 'true') {
  try {
    await runMigrations();
  } catch (error) {
    console.error('Database migration failed', error);
    throw error;
  }
}

const app = Fastify({
  logger: true,
  bodyLimit: 20 * 1024 * 1024,
  requestTimeout: 30000
});

await app.register(helmet, {
  contentSecurityPolicy: false
});

await app.register(cors, {
  origin(origin, callback) {
    callback(null, !origin || allowedOrigins.has(origin));
  }
});

await app.register(authRoutes, {
  prefix: '/api/v1/auth'
});

app.addHook('onRequest', async request => {
  if (request.method === 'GET' || request.url === '/health') return;

  const publicWriteRoutes = new Set([
    '/api/v1/auth/login',
    '/api/v1/auth/password-reset/request',
    '/api/v1/auth/password-reset/confirm'
  ]);

  const requestPath = request.url.split('?')[0] ?? request.url;

  if (publicWriteRoutes.has(requestPath)) {
    return;
  }

  if (requestPath.startsWith('/api/v1/developed-licenses/collector-jobs')) {
    const token = request.headers['x-collector-token'];
    if (config.COLLECTOR_INGEST_TOKEN && token === config.COLLECTOR_INGEST_TOKEN) return;
  }

  const origin = request.headers.origin;

  if (origin && allowedOrigins.has(origin)) return;

  if (!config.API_ADMIN_TOKEN) {
    throw Object.assign(
      Error('عمليات الكتابة معطلة للطلبات غير المصرح بها'),
      { statusCode: 503 }
    );
  }

  const token = request.headers.authorization?.replace(/^Bearer\s+/i, '');

  if (token !== config.API_ADMIN_TOKEN) {
    throw Object.assign(Error('غير مصرح'), {
      statusCode: 401
    });
  }
});

app.addHook('preValidation', async request => {
  const requestPath = request.url.split('?')[0] ?? request.url;
  if (
    request.method === 'POST' &&
    (
      requestPath === '/api/v1/developed-licenses/upload' ||
      /^\/api\/v1\/developed-licenses\/collector-jobs\/[^/]+\/records$/.test(requestPath)
    )
  ) {
    normalizeDevelopedLicenseRequestBody(request.body);
  }
});

app.get('/health', async () => {
  const started = Date.now();
  await pool.query('SELECT 1');

  return {
    ok: true,
    version: '35.0.0',
    database: true,
    latencyMs: Date.now() - started
  };
});

await app.register(licenseRoutes, {
  prefix: '/api/v1/licenses'
});

await app.register(analysisSettingsRoutes, {
  prefix: '/api/v1/licenses'
});

await app.register(notificationRoutes, {
  prefix: '/api/v1/notifications'
});

await app.register(developedLicenseRoutes, {
  prefix: '/api/v1/developed-licenses'
});

await app.register(developedReferralRoutes, {
  prefix: '/api/v1/developed-licenses'
});

await app.register(developedExportRoutes, {
  prefix: '/api/v1/developed-licenses/exports'
});

await app.register(developedMapDetailsRoutes, {
  prefix: '/api/v1/developed-licenses'
});

await app.register(developedDatabaseAdminRoutes, {
  prefix: '/api/v1/developed-licenses/admin'
});

await app.register(googleSheetRoutes, {
  prefix: '/api/v1/developed-licenses/google-sheet'
});

await app.register(governanceRoutes, {
  prefix: '/api/v1/developed-licenses/governance'
});

startAffiliatedSheetBackgroundSync();

app.get('/ready', async () => {
  const result = await pool.query(`
    SELECT
      to_regnamespace('developed_licenses') IS NOT NULL schema_exists,
      to_regclass('developed_licenses.schema_migrations') IS NOT NULL schema_migrations,
      to_regclass('developed_licenses.sources') IS NOT NULL sources,
      to_regclass('developed_licenses.import_batches') IS NOT NULL import_batches,
      to_regclass('developed_licenses.source_licenses') IS NOT NULL source_licenses,
      to_regclass('developed_licenses.licenses') IS NOT NULL licenses,
      to_regclass('developed_licenses.status_history') IS NOT NULL status_history,
      to_regclass('developed_licenses.closure_events') IS NOT NULL closure_events,
      to_regclass('developed_licenses.analysis_results') IS NOT NULL analysis_results,
      to_regclass('developed_licenses.collector_jobs') IS NOT NULL collector_jobs,
      to_regclass('developed_licenses.sync_runs') IS NOT NULL sync_runs,
      to_regclass('developed_licenses.sync_map') IS NOT NULL sync_map,
      to_regclass('developed_licenses.sync_events') IS NOT NULL sync_events
  `);

  const checks = result.rows[0];
  const ready = Object.values(checks).every(Boolean);

  return {
    ok: ready,
    version: '35.0.0',
    checks
  };
});

app.setErrorHandler((error, request, reply) => {
  request.log.error(error);

  const statusCode =
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    typeof error.statusCode === 'number'
      ? error.statusCode
      : 500;

  const message =
    error instanceof Error
      ? error.message
      : 'حدث خطأ غير متوقع';

  reply.code(statusCode).send({
    ok: false,
    error: message
  });
});

const shutdown = async () => {
  await app.close();
  await pool.end();
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

await app.listen({
  port: config.PORT,
  host: '0.0.0.0'
});
