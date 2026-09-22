import { z } from 'zod';

const readingStatus = z.enum(['TO_READ', 'READING', 'READ']);
const optionalText = z.string().trim().max(10000).nullable().optional();
const optionalUrl = z.url().nullable().optional();

export const createShelfItemSchema = z.object({
  title: z.string().trim().min(1).max(500),
  author: z.string().trim().min(1).max(500),
  coverUrl: optionalUrl,
  isbn: z.string().trim().max(32).nullable().optional(),
  publishedYear: z.number().int().min(0).max(new Date().getFullYear()).nullable().optional(),
  description: optionalText,
  externalId: z.string().trim().max(500).nullable().optional(),
});

export const updateShelfItemSchema = z
  .object({
    status: readingStatus.optional(),
    rating: z.number().int().min(1).max(5).nullable().optional(),
    review: optionalText,
    notes: optionalText,
    customCoverUrl: optionalUrl,
  })
  .refine((value) => Object.keys(value).length > 0, {
    error: 'Debes enviar al menos un campo para actualizar',
  });
