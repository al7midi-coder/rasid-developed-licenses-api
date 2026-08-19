import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Pool } from 'pg';
import { pool } from './pool.js';

async function bootstrapSchema() {
  const adminUrl = process.env.DATABASE_ADMIN_URL;
  if (!adminUrl) return;
  const adminPool = new Pool({ connectionString: adminUrl, ssl: { rejectUnauthorized: false } });
  try {
    const db = await adminPool.query<{ current_database: string }>('SELECT current_database()');
    const databaseName = db.rows[0].current_database.replace(/"/g, '""');
    await adminPool.query('GRANT CONNECT ON DATABASE "' + databaseName + '" TO developed_licenses_app');
    await adminPool.query('CREATE SCHEMA IF NOT EXISTS developed_licenses AUTHORIZATION developed_licenses_app');
    await adminPool.query('GRANT USAGE, CREATE ON SCHEMA developed_licenses TO developed_licenses_app');
  } finally {
    await adminPool.end();
  }
}

export async function runMigrations() {
  await bootstrapSchema();
  const directory = resolve(process.cwd(), 'migrations');
  await pool.query('CREATE TABLE IF NOT EXISTS developed_licenses.schema_migrations(name text primary key, applied_at timestamptz not null default now())');
  for (const name of (await readdir(directory)).filter((x) => x.endsWith('.sql')).sort()) {
    const exists = await pool.query('SELECT 1 FROM developed_licenses.schema_migrations WHERE name=$1', [name]);
    if (exists.rowCount) continue;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(await readFile(resolve(directory, name), 'utf8'));
      await client.query('INSERT INTO developed_licenses.schema_migrations(name) VALUES($1)', [name]);
      await client.query('COMMIT');
      console.log('Applied migration', name);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === invokedPath) {
  await runMigrations();
  await pool.end();
}
