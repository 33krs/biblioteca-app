import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { assertTestDatabaseUrl } from './databaseGuard.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.join(__dirname, '..');

// Reset the disposable test schema and apply the committed migrations before
// running the integration suite. The database guard prevents destructive
// operations against non-test databases.
export default function globalSetup() {
  const env = { ...process.env };
  dotenv.config({ path: path.join(backendRoot, '.env.test'), processEnv: env });
  assertTestDatabaseUrl(env.DATABASE_URL);

  execSync('npx prisma migrate reset --force --skip-seed', {
    cwd: backendRoot,
    env,
    stdio: 'inherit',
  });
}
