import pg from 'pg';
import { config } from '../config.js';

const { Pool } = pg;

function normalizeDatabaseUrl(value?: string): string | undefined {
  if (!value) return undefined;

  const url = new URL(value);

  // منع إعدادات SSL داخل الرابط من تجاوز إعداد ssl أدناه
  url.searchParams.delete('sslmode');
  url.searchParams.delete('sslrootcert');
  url.searchParams.delete('sslcert');
  url.searchParams.delete('sslkey');

  return url.toString();
}

const connectionString = normalizeDatabaseUrl(config.DATABASE_URL);

const ssl =
  config.DATABASE_SSL === 'disable'
    ? false
    : config.DATABASE_SSL === 'verify-full'
      ? {
          rejectUnauthorized: true,
          ca: config.DATABASE_CA_CERT?.replace(/\\n/g, '\n')
        }
      : {
          // اتصال مشفر بدون التحقق من سلسلة CA
          rejectUnauthorized: false
        };

export const pool = new Pool({
  ...(connectionString
    ? { connectionString }
    : {
        host: config.PGHOST,
        port: config.PGPORT,
        database: config.PGDATABASE,
        user: config.PGUSER,
        password: config.PGPASSWORD
      }),
  ssl,
  max: config.DATABASE_POOL_MAX,
  statement_timeout: config.STATEMENT_TIMEOUT_MS,
  application_name: 'rasid-license-engine-v32',
  keepAlive: true,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000
});

pool.on('error', error => {
  console.error('PostgreSQL pool error', error);
});