import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from '../prismaClient.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_USER_ID = 'local-user';

const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, '..', '..', 'uploads'),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const router = Router();

// GET /api/shelf - lista los libros del usuario
router.get('/', async (_req, res) => {
  const items = await prisma.userBook.findMany({
    where: { userId: DEFAULT_USER_ID },
    include: { book: true },
    orderBy: { createdAt: 'asc' },
  });
  res.json(items);
});

// POST /api/shelf - añade un libro (crea el Book si no existe todavía)
router.post('/', async (req, res) => {
  const { title, author, coverUrl, isbn, publishedYear, description, externalId } = req.body;
  if (!title || !author) {
    return res.status(400).json({ error: 'title y author son obligatorios' });
  }

  const book = await prisma.book.upsert({
    where: { title_author: { title, author } },
    update: {},
    create: {
      title,
      author,
      defaultCoverUrl: coverUrl || null,
      isbn: isbn || null,
      publishedYear: publishedYear || null,
      description: description || null,
      externalId: externalId || null,
    },
  });

  const userBook = await prisma.userBook.upsert({
    where: { userId_bookId: { userId: DEFAULT_USER_ID, bookId: book.id } },
    update: {},
    create: { userId: DEFAULT_USER_ID, bookId: book.id },
    include: { book: true },
  });

  res.status(201).json(userBook);
});

// PATCH /api/shelf/:id - actualiza estado, valoración, reseña, notas o portada
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { status, rating, review, notes, customCoverUrl } = req.body;

  const userBook = await prisma.userBook.update({
    where: { id },
    data: { status, rating, review, notes, customCoverUrl },
    include: { book: true },
  });

  res.json(userBook);
});

// DELETE /api/shelf/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  await prisma.userBook.delete({ where: { id } });
  res.status(204).send();
});

// POST /api/shelf/:id/cover - sube una portada personalizada desde el computador
router.post('/:id/cover', upload.single('cover'), async (req, res) => {
  const { id } = req.params;
  if (!req.file) {
    return res.status(400).json({ error: 'No se recibió ningún archivo' });
  }

  const url = `/uploads/${req.file.filename}`;
  const userBook = await prisma.userBook.update({
    where: { id },
    data: { customCoverUrl: url },
    include: { book: true },
  });

  res.json(userBook);
});

export default router;
