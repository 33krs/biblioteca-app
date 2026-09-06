import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import shelfRouter from './routes/shelf.js';
import booksRouter from './routes/googleBooks.js';
import authRouter from './routes/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// El frontend siempre llega al backend a través de un proxy same-origin (el
// dev server de Vite o Nginx en docker-compose.conf), nunca directo desde el
// navegador con otro origin. Este allowlist es una capa extra por si algo
// llega a llamar a la API directo desde un browser.
const allowedOrigins = new Set(
  [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:8080'].filter(
    (origin): origin is string => Boolean(origin),
  ),
);

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) return callback(null, true);
        callback(new Error('Origen no permitido por CORS'));
      },
    }),
  );
  app.use(express.json());
  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

  app.use('/api/auth', authRouter);
  app.use('/api/shelf', shelfRouter);
  app.use('/api/books', booksRouter);
  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  return app;
}
