import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import shelfRouter from './routes/shelf.js';
import booksRouter from './routes/googleBooks.js';
import authRouter from './routes/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

  app.use('/api/auth', authRouter);
  app.use('/api/shelf', shelfRouter);
  app.use('/api/books', booksRouter);
  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  return app;
}
