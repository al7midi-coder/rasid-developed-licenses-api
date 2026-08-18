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
    const token=request.headers['x-collector-token'];
    if (config.COLLECTOR_INGEST_TOKEN && token===config.COLLECTOR_INGEST_TOKEN) return;
  }

  const origin = request.headers.origin;

  // السماح بعمليات الكتابة من واجهة راصد المعتمدة فقط.
  if (origin && allowedOrigins.has(origin)) return;

  // الطلبات الخادمة أو التي لا تحمل Origin تتطلب مفتاح الإدارة.
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

app.get('/ready', async () => {
  const result = await pool.query(`
    SELECT
      to_regclass('public.licenses') IS NOT NULL licenses,
      to_regclass('public.license_closure_events') IS NOT NULL closure_events,
      EXISTS(
        SELECT 1
        FROM schema_migrations
        WHERE name='003_license_api_runtime_fix.sql'
      ) migration_003,
      EXISTS(
        SELECT 1
        FROM schema_migrations
        WHERE name='004_agreed_workflow_extensions.sql'
      ) migration_004,
      to_regclass('public.road_dependency_rules') IS NOT NULL road_rules,
      to_regclass('public.route_layers') IS NOT NULL route_layers,
      to_regclass('public.project_classification_rules') IS NOT NULL project_rules,
      to_regclass('public.rasid_admin_events') IS NOT NULL admin_events
  `);

  const checks = result.rows[0];

  const ready = Boolean(
    checks.licenses &&
    checks.closure_events &&
    checks.migration_003 &&
    checks.migration_004 &&
    checks.road_rules &&
    checks.route_layers &&
    checks.project_rules &&
    checks.admin_events
  );

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
