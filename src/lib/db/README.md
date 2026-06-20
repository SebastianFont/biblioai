# `lib/db` — Acceso a datos

Cliente de Prisma (singleton) y queries reutilizables.

- `client.ts` — instancia única de `PrismaClient` (evita agotar conexiones en
  dev por el hot-reload de Next.js).
- Las queries complejas viven acá para no repetir lógica de acceso a datos en
  los route handlers.
