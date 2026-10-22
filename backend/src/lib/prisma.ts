import { PrismaClient } from '@prisma/client';
import { hasDatabase, env } from '../config/env';

// Reuse one client per process (important for serverless warm starts and tsx watch reloads).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient | null = hasDatabase
  ? (globalForPrisma.prisma ??= new PrismaClient({
      log: env.nodeEnv === 'development' ? ['warn', 'error'] : ['error'],
    }))
  : null;
