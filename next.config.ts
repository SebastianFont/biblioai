import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `better-sqlite3` (vía el driver adapter de Prisma) es un módulo nativo:
  // no se puede empaquetar en el bundle del servidor, hay que externalizarlo
  // para que Next lo cargue desde node_modules en runtime.
  serverExternalPackages: ["@prisma/adapter-better-sqlite3", "better-sqlite3"],
};

export default nextConfig;
