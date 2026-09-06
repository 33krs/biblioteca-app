import { beforeEach, afterAll } from 'vitest';
import { prisma } from '../src/prismaClient.js';
import { ensureLocalUser } from '../src/bootstrap.js';

beforeEach(async () => {
  await prisma.userBook.deleteMany();
  await prisma.book.deleteMany();
  await prisma.user.deleteMany();
  await ensureLocalUser();
});

afterAll(async () => {
  await prisma.$disconnect();
});
