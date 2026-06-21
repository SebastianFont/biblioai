import { prisma } from "@/lib/db/client";
import { getAnalyzer, type ReviewAnalyzer } from "@/lib/ai";
import { NotFoundError } from "@/server/errors";
import type { CreateReviewInput } from "@/lib/validators/review";

/**
 * Lógica de negocio de reseñas.
 *
 * Una reseña siempre pertenece a un libro, y el libro a un usuario. Por eso
 * cada operación valida que el libro sea del usuario antes de tocar nada.
 *
 * Al crear una reseña, se la enriquece con la capa de IA (resumen, etiquetas y
 * sentimiento). El analizador se recibe por parámetro (inyección de dependencia)
 * para poder testear sin IA real; por defecto se resuelve según `AI_PROVIDER`.
 */

/** Agrega una reseña a un libro del usuario y la enriquece con IA. */
export async function addReview(
  userId: string,
  bookId: string,
  input: CreateReviewInput,
  analyzer: ReviewAnalyzer = getAnalyzer(),
) {
  const book = await getOwnedBook(userId, bookId);

  // La reseña se guarda primero con lo que escribió el usuario. Así, si la IA
  // falla, no perdemos su aporte (degradación elegante).
  const review = await prisma.review.create({ data: { ...input, bookId } });

  try {
    const analysis = await analyzer.analyze({
      content: input.content,
      bookTitle: book.title,
      author: book.author,
    });

    // Guardamos el análisis y propagamos las etiquetas al libro (N-N).
    const [enriched] = await prisma.$transaction([
      prisma.review.update({
        where: { id: review.id },
        data: { aiSummary: analysis.summary, aiSentiment: analysis.sentiment },
      }),
      prisma.book.update({
        where: { id: bookId },
        data: {
          tags: {
            connectOrCreate: analysis.tags.map((name) => ({
              where: { name },
              create: { name },
            })),
          },
        },
      }),
    ]);
    return enriched;
  } catch (error) {
    // La IA es un "extra": si falla, la reseña ya quedó guardada.
    console.error("No se pudo analizar la reseña con IA:", error);
    return review;
  }
}

/** Lista las reseñas de un libro del usuario (más recientes primero). */
export async function listReviews(userId: string, bookId: string) {
  await getOwnedBook(userId, bookId);
  return prisma.review.findMany({
    where: { bookId },
    orderBy: { createdAt: "desc" },
  });
}

/** Devuelve el libro si pertenece al usuario (con los datos que la IA necesita). */
async function getOwnedBook(userId: string, bookId: string) {
  const book = await prisma.book.findFirst({
    where: { id: bookId, ownerId: userId },
    select: { id: true, title: true, author: true },
  });
  if (!book) {
    throw new NotFoundError("Libro no encontrado");
  }
  return book;
}
