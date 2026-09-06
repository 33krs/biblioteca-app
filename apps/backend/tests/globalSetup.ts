import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.join(__dirname, '..');

// Sincroniza el schema de Prisma contra la base de datos de test antes de
// correr la suite. Usa `db push` (no migraciones) porque la base de test es
// desechable: no necesitamos historial de migraciones, solo que el schema
// coincida.
export default function globalSetup() {
  const env = { ...process.env };
  dotenv.config({ path: path.join(backendRoot, '.env.test'), processEnv: env });

  execSync('npx prisma db push --skip-generate --accept-data-loss', {
    cwd: backendRoot,
    env,
    stdio: 'inherit',
  });
}
