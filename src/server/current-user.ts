import { prisma } from "@/lib/db/client";
import { NotFoundError } from "@/server/errors";

/**
 * Resuelve el usuario actual.
 *
 * Decisión de alcance: la app es single-user (muestra de portfolio), así que
 * devolvemos el usuario demo del seed. Toda la app depende de esta función y no
 * de cómo se obtiene el usuario: sumar autenticación real (p. ej. leer acá la
 * sesión de Auth.js) sería un cambio local, sin tocar services ni rutas.
 */
const DEMO_EMAIL = "demo@biblioai.dev";

export async function getCurrentUserId(): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
    select: { id: true },
  });
  if (!user) {
    throw new NotFoundError(
      "No hay usuario demo. Ejecutá `npm run db:seed` para crear los datos de ejemplo.",
    );
  }
  return user.id;
}
