import { z } from 'zod';

const emailSchema = z.email({ error: 'Email inválido' }).transform((email) => email.toLowerCase());
const passwordSchema = z
  .string()
  .min(8, { error: 'La contraseña debe tener al menos 8 caracteres' });

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().trim().min(1).max(100).optional(),
});

export const loginSchema = z.object({ email: emailSchema, password: z.string().min(1) });
export const forgotPasswordSchema = z.object({ email: emailSchema });
export const resetPasswordSchema = z.object({ token: z.string().min(1), password: passwordSchema });
