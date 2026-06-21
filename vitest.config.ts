import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Resuelve el alias `@/` leyendo los paths del tsconfig (soporte nativo de
    // Vite 4+), así los tests importan con las mismas rutas que producción.
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // El cliente generado por Prisma no se testea.
    exclude: ["node_modules", "src/generated/**"],
  },
});
