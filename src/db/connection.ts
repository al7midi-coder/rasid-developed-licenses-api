import type { PoolConfig } from 'pg';

const sslQueryParameters = ['sslmode', 'sslrootcert', 'sslcert', 'sslkey'];

export function sanitizeDatabaseUrl(connectionString: string): string {
  const url = new URL(connectionString);

  for (const parameter of sslQueryParameters) {
    url.searchParams.delete(parameter);
  }

  return url.toString();
}

export function createTlsPoolConfig(connectionString: string): PoolConfig {
  return {
    connectionString: sanitizeDatabaseUrl(connectionString),
    ssl: { rejectUnauthorized: false }
  };
}
