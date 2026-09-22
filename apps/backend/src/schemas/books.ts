import { z } from 'zod';

export const searchBooksQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
});
