import { prisma } from './prismaClient.js';

export const LOCAL_USER_ID = 'local-user';

// Usuario local por defecto: hoy la app corre en modo single-user,
// pero el modelo de datos ya está listo para multiusuario (ver User/UserBook).
export async function ensureLocalUser() {
  await prisma.user.upsert({
    where: { email: 'local@biblioteca.app' },
    update: {},
    create: { id: LOCAL_USER_ID, email: 'local@biblioteca.app', name: 'Usuario local' },
  });
}
