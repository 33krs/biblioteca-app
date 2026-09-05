import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from './prismaClient.js';
import shelfRouter from './routes/shelf.js';
import booksRouter from './routes/googleBooks.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/shelf', shelfRouter);
app.use('/api/books', booksRouter);
app.get('/api/health', (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

async function bootstrap() {
  // Usuario local por defecto: hoy la app corre en modo single-user,
  // pero el modelo de datos ya está listo para multiusuario (ver User/UserBook).
  await prisma.user.upsert({
    where: { email: 'local@biblioteca.app' },
    update: {},
    create: { id: 'local-user', email: 'local@biblioteca.app', name: 'Usuario local' },
  });

  app.listen(PORT, () => {
    console.log(`Backend escuchando en http://localhost:${PORT}`);
  });
}

bootstrap();
