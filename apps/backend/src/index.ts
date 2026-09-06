import 'dotenv/config';
import { createApp } from './app.js';
import { ensureLocalUser } from './bootstrap.js';

const app = createApp();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

async function bootstrap() {
  await ensureLocalUser();

  app.listen(PORT, () => {
    console.log(`Backend escuchando en http://localhost:${PORT}`);
  });
}

bootstrap();
