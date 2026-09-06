import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Carga las credenciales de la base de test aquí (proceso principal de Vitest)
// para que se propaguen a los workers que ejecutan los tests, antes de que
// estos importen el cliente de Prisma.
dotenv.config({ path: path.join(__dirname, '.env.test'), override: true });

export default defineConfig({
  test: {
    environment: 'node',
    globalSetup: './tests/globalSetup.ts',
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 15000,
    hookTimeout: 20000,
    // Los tests de shelf.ts comparten una única base de test real; correr
    // los archivos en paralelo hace que sus beforeEach (borrar/crear el
    // usuario local) se pisen entre sí.
    fileParallelism: false,
  },
});
