import { prisma } from './prismaClient.js';

export type ReadinessProbe = () => Promise<void>;

export const checkDatabaseReadiness: ReadinessProbe = async () => {
  await prisma.$queryRaw`SELECT 1`;
};
