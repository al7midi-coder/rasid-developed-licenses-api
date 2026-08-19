import pg from 'pg';
import { config } from '../config.js';
import { createTlsPoolConfig } from './connection.js';

const { Pool } = pg;

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
  ...(config.DATABASE_URL
    ? createTlsPoolConfig(config.DATABASE_URL)
    : {
        host: config.PGHOST,
        port: config.PGPORT,
        database: config.PGDATABASE,
        user: config.PGUSER,
        password: config.PGPASSWORD,
        ssl
      }),
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
