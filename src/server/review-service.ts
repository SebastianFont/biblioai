import { prisma } from "@/lib/db/client";
import { NotFoundError } from "@/server/errors";
import type { CreateReviewInput } from "@/lib/validators/review";

/**
 * Lógica de negocio de reseñas.
 *
 * Una reseña siempre pertenece a un libro, y el libro a un usuario. Por eso
 * cada operación valida que el libro sea del usuario antes de tocar nada.
 *
 * Nota: el resumen, las etiquetas y el sentimiento se generan en la etapa 4
 * (capa de IA). Acá la reseña se crea solo con lo que escribe el usuario.
 */

/** Agrega una reseña a un libro del usuario. */
export async function addReview(userId: string, bookId: string, input: CreateReviewInput) {
  await assertBookOwnership(userId, bookId);
  return prisma.review.create({
    data: { ...input, bookId },
  });
}

/** Lista las reseñas de un libro del usuario (más recientes primero). */
export async function listReviews(userId: string, bookId: string) {
  await assertBookOwnership(userId, bookId);
  return prisma.review.findMany({
    where: { bookId },
    orderBy: { createdAt: "desc" },
  });
}

async function assertBookOwnership(userId: string, bookId: string): Promise<void> {
  const owned = await prisma.book.findFirst({
    where: { id: bookId, ownerId: userId },
    select: { id: true },
  });
  if (!owned) {
    throw new NotFoundError("Libro no encontrado");
  }
}
