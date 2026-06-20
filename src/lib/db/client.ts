import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Instancia única (singleton) de PrismaClient.
 *
 * En desarrollo, el hot-reload de Next.js reevalúa los módulos en cada cambio.
 * Si creáramos un `new PrismaClient()` por módulo, abriríamos una conexión nueva
 * cada vez y agotaríamos el pool. Por eso cacheamos la instancia en `globalThis`
 * fuera de producción.
 *
 * Prisma 7 usa "driver adapters": el cliente ya no recibe una URL, sino un
 * adapter que abre la conexión. Para SQLite usamos `@prisma/adapter-better-sqlite3`.
 * La URL se carga del entorno (Next.js lee .env automáticamente).
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
