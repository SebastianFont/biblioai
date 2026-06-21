import { prisma } from "@/lib/db/client";
import { NotFoundError } from "@/server/errors";

/**
 * Resuelve el usuario autenticado actual.
 *
 * TEMPORAL (etapa 3): todavía no hay autenticación, así que devolvemos el
 * usuario demo del seed. En la etapa 6 (Auth.js) esto leerá la sesión real;
 * el resto del código no se entera porque depende de esta función, no de
 * cómo se obtiene el usuario.
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
