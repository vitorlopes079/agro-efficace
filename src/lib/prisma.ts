// src/lib/prisma.ts
import { PrismaClient } from "@/generated/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// Verify environment variable exists
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create connection pool with Vercel serverless optimizations
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1, // ← CRITICAL: Limit connections for serverless
  idleTimeoutMillis: 0,
  connectionTimeoutMillis: 10000, // 10 second timeout
});

// Create Prisma adapter
const adapter = new PrismaPg(pool);

// Initialize Prisma Client with adapter
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ 
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
