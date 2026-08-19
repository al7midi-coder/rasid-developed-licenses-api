import { describe, expect, it } from 'vitest';
import { createTlsPoolConfig, sanitizeDatabaseUrl } from '../src/db/connection.js';

describe('database TLS connection configuration', () => {
  it('removes only SSL URL parameters and preserves connection identity', () => {
    const original =
      'postgresql://developed_licenses_app:secret@db.example.com:25060/defaultdb?sslmode=require&sslrootcert=ca.pem&sslcert=client.pem&sslkey=client.key&application_name=rasid';

    const sanitized = new URL(sanitizeDatabaseUrl(original));

    expect(sanitized.username).toBe('developed_licenses_app');
    expect(sanitized.password).toBe('secret');
    expect(sanitized.hostname).toBe('db.example.com');
    expect(sanitized.port).toBe('25060');
    expect(sanitized.pathname).toBe('/defaultdb');
    expect(sanitized.searchParams.get('application_name')).toBe('rasid');
    expect(sanitized.searchParams.has('sslmode')).toBe(false);
    expect(sanitized.searchParams.has('sslrootcert')).toBe(false);
    expect(sanitized.searchParams.has('sslcert')).toBe(false);
    expect(sanitized.searchParams.has('sslkey')).toBe(false);
  });

  it('keeps TLS enabled while accepting the managed database certificate chain', () => {
    const poolConfig = createTlsPoolConfig(
      'postgresql://doadmin:secret@db.example.com:25060/defaultdb?sslmode=require'
    );

    expect(poolConfig.ssl).toEqual({ rejectUnauthorized: false });
    expect(poolConfig.connectionString).not.toContain('sslmode');
  });
});
