import { describe, expect, it } from 'vitest';
import { assertTestDatabaseUrl, databaseNameFromUrl } from './databaseGuard.js';

describe('test database guard', () => {
  it('accepts a database name ending with _test', () => {
    expect(() =>
      assertTestDatabaseUrl(
        'postgresql://user:password@localhost:5432/biblioteca_test?schema=public',
      ),
    ).not.toThrow();
  });

  it('rejects a non-test database', () => {
    expect(() =>
      assertTestDatabaseUrl('postgresql://user:password@localhost:5432/biblioteca'),
    ).toThrow(/must target a database ending with "_test"/);
  });

  it('rejects a missing or malformed database URL', () => {
    expect(() => assertTestDatabaseUrl(undefined)).toThrow(/DATABASE_URL is required/);
    expect(() => databaseNameFromUrl('not-a-url')).toThrow(/Invalid DATABASE_URL/);
  });
});
