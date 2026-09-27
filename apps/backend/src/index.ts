import 'dotenv/config';
import { createApp } from './app.js';
import { getMailConfig } from './config/mail.js';
import { prisma } from './prismaClient.js';

const app = createApp();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

if (process.env.NODE_ENV === 'production') {
  getMailConfig();
}

const server = app.listen(PORT, () => {
  console.log(`Backend escuchando en http://localhost:${PORT}`);
});

let isShuttingDown = false;

function shutdown(signal: NodeJS.Signals) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`Señal ${signal} recibida; cerrando el backend`);
  server.close(async (error) => {
    if (error) {
      console.error('Error al cerrar el servidor HTTP', error);
      process.exitCode = 1;
    }

    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error('Error al desconectar Prisma', disconnectError);
      process.exitCode = 1;
    }
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
