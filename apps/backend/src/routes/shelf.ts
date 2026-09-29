import { Router, type RequestHandler } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'node:crypto';
import { unlink, writeFile } from 'node:fs/promises';
import { prisma } from '../prismaClient.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';
import { requireCsrf } from '../middleware/csrf.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { logSafeEvent } from '../middleware/errorResponse.js';
import { validateBody } from '../middleware/validate.js';
import { createShelfItemSchema, updateShelfItemSchema } from '../schemas/shelf.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDirectory = path.join(__dirname, '..', '..', 'uploads');
const MAX_COVER_SIZE_BYTES = 5 * 1024 * 1024;

const COVER_EXTENSION = {
  JPEG: '.jpg',
  PNG: '.png',
  WEBP: '.webp',
} as const;

function startsWith(buffer: Buffer, signature: number[]): boolean {
  return signature.every((byte, index) => buffer[index] === byte);
}

export function detectCoverExtension(file: Buffer): string | null {
  if (startsWith(file, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return COVER_EXTENSION.PNG;
  }

  if (startsWith(file, [0xff, 0xd8, 0xff])) return COVER_EXTENSION.JPEG;

  if (
    startsWith(file, [0x52, 0x49, 0x46, 0x46]) &&
    startsWith(file.subarray(8), [0x57, 0x45, 0x42, 0x50])
  ) {
    return COVER_EXTENSION.WEBP;
  }

  return null;
}

export function createCoverFilename(file: Buffer): string {
  const extension = detectCoverExtension(file);
  if (!extension) throw new Error('Unsupported cover image signature');
  return `${randomUUID()}${extension}`;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_COVER_SIZE_BYTES },
});

const router = Router();

router.use(requireAuth);
router.use(requireCsrf);

// Confirma que el userBook :id existe y pertenece al usuario autenticado.
async function findOwnedUserBook(id: string, userId: string) {
  const userBook = await prisma.userBook.findUnique({ where: { id } });
  if (!userBook || userBook.userId !== userId) return null;
  return userBook;
}

const uploadSingleCover: RequestHandler = (req, res, next) => {
  upload.single('cover')(req, res, (error: unknown) => {
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'La portada no puede superar los 5 MiB' });
    }

    next(error);
  });
};

async function removeCustomCover(customCoverUrl: string | null): Promise<void> {
  if (!customCoverUrl?.startsWith('/uploads/')) return;

  const filename = path.basename(customCoverUrl);
  if (filename !== customCoverUrl.slice('/uploads/'.length)) return;

  await unlink(path.join(uploadsDirectory, filename)).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== 'ENOENT') throw error;
  });
}

// GET /api/shelf - lista los libros del usuario
router.get(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const items = await prisma.userBook.findMany({
      where: { userId: req.userId },
      include: { book: true },
      orderBy: { createdAt: 'asc' },
    });
    res.json(items);
  }),
);

// POST /api/shelf - añade un libro (crea el Book si no existe todavía)
router.post(
  '/',
  validateBody(createShelfItemSchema),
  asyncHandler(async (req: AuthedRequest, res) => {
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
      where: { userId_bookId: { userId: req.userId!, bookId: book.id } },
      update: {},
      create: { userId: req.userId!, bookId: book.id },
      include: { book: true },
    });

    res.status(201).json(userBook);
  }),
);

// PATCH /api/shelf/:id - actualiza estado, valoración, reseña, notas o portada
router.patch(
  '/:id',
  validateBody(updateShelfItemSchema),
  asyncHandler(async (req: AuthedRequest, res) => {
    const { id } = req.params;
    const owned = await findOwnedUserBook(id, req.userId!);
    if (!owned) return res.status(404).json({ error: 'No encontrado' });

    const { status, rating, review, notes } = req.body;
    const userBook = await prisma.userBook.update({
      where: { id },
      data: { status, rating, review, notes },
      include: { book: true },
    });

    res.json(userBook);
  }),
);

// DELETE /api/shelf/:id
router.delete(
  '/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const { id } = req.params;
    const owned = await findOwnedUserBook(id, req.userId!);
    if (!owned) return res.status(404).json({ error: 'No encontrado' });

    await prisma.userBook.delete({ where: { id } });
    res.status(204).send();
  }),
);

// POST /api/shelf/:id/cover - sube una portada personalizada desde el computador
router.post(
  '/:id/cover',
  uploadSingleCover,
  asyncHandler(async (req: AuthedRequest, res) => {
    const { id } = req.params;
    const owned = await findOwnedUserBook(id, req.userId!);
    if (!owned) return res.status(404).json({ error: 'No encontrado' });

    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ningún archivo' });
    }

    if (!detectCoverExtension(req.file.buffer)) {
      return res
        .status(400)
        .json({ error: 'El archivo debe ser una imagen JPEG, PNG o WebP válida' });
    }

    const filename = createCoverFilename(req.file.buffer);
    const url = `/uploads/${filename}`;

    try {
      await writeFile(path.join(uploadsDirectory, filename), req.file.buffer, { flag: 'wx' });
    } catch {
      return res.status(500).json({ error: 'No se pudo guardar la portada' });
    }

    const userBook = await prisma.userBook
      .update({
        where: { id },
        data: { customCoverUrl: url },
        include: { book: true },
      })
      .catch(async (error: unknown) => {
        await unlink(path.join(uploadsDirectory, filename)).catch(() => undefined);
        throw error;
      });

    try {
      await removeCustomCover(owned.customCoverUrl);
    } catch {
      logSafeEvent('error', 'cover_cleanup_failed', { resource: 'obsolete_cover' });
    }

    res.json(userBook);
  }),
);

export default router;
