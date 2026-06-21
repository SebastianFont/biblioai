import { defineConfig, devices } from "@playwright/test";

/**
 * Configuración de los tests end-to-end.
 *
 * Corren contra una base SQLite dedicada (`e2e.db`) que se migra y siembra en
 * `global-setup`, así no tocan la base de desarrollo. La IA queda en modo `mock`
 * (determinista, sin costo). El server de Next se levanta automáticamente.
 */
const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;

export const E2E_DATABASE_URL = "file:./e2e.db";

export default defineConfig({
  testDir: "./e2e",
  // Comparten la misma base, así que se ejecutan en serie.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? "github" : "list",
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // La base e2e se migra y siembra ANTES de arrancar Next, en el mismo comando,
    // para que el server nunca encuentre tablas inexistentes (evita carreras con
    // global-setup). Todo hereda DATABASE_URL/AI_PROVIDER de `env`.
    command: `npx prisma migrate deploy && npx tsx prisma/seed.ts && npx next dev --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 180_000,
    env: { DATABASE_URL: E2E_DATABASE_URL, AI_PROVIDER: "mock" },
  },
});
