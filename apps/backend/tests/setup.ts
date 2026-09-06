import { beforeEach, afterAll } from 'vitest';
import { prisma } from '../src/prismaClient.js';

beforeEach(async () => {
  await prisma.userBook.deleteMany();
  await prisma.book.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
