const TEST_DATABASE_SUFFIX = '_test';

export function databaseNameFromUrl(databaseUrl: string): string {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(databaseUrl);
  } catch {
    throw new Error('Invalid DATABASE_URL: expected a valid database connection URL.');
  }

  const databaseName = decodeURIComponent(parsedUrl.pathname.replace(/^\/+/, ''));

  if (!databaseName) {
    throw new Error('Invalid DATABASE_URL: database name is missing from the connection URL.');
  }

  return databaseName;
}

export function assertTestDatabaseUrl(databaseUrl: string | undefined): void {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required when running backend tests.');
  }

  const databaseName = databaseNameFromUrl(databaseUrl);

  if (!databaseName.endsWith(TEST_DATABASE_SUFFIX)) {
    throw new Error(
      `Refusing to run tests against database "${databaseName}". ` +
        `The test DATABASE_URL must target a database ending with "${TEST_DATABASE_SUFFIX}".`,
    );
  }
}
