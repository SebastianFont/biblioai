import { prisma } from "@/lib/db/client";
import { getAnalyzer, type ReviewAnalyzer } from "@/lib/ai";
import { NotFoundError } from "@/server/errors";
import type { CreateReviewInput, UpdateReviewInput } from "@/lib/validators/review";

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

  return enrichWithAnalysis(review, book, input.content, analyzer);
}

/**
 * Edita una reseña del usuario. Siempre actualiza los campos enviados; además,
 * si cambió el contenido, vuelve a pasar la reseña por la IA (resumen, etiquetas
 * y sentimiento) porque el análisis anterior ya no la representa.
 */
export async function updateReview(
  userId: string,
  bookId: string,
  reviewId: string,
  input: UpdateReviewInput,
  analyzer: ReviewAnalyzer = getAnalyzer(),
) {
  const book = await getOwnedBook(userId, bookId);
  await assertReviewInBook(reviewId, bookId);

  const review = await prisma.review.update({ where: { id: reviewId }, data: input });

  // Sin contenido nuevo, el análisis previo sigue siendo válido: no gastamos IA.
  if (input.content === undefined) return review;

  return enrichWithAnalysis(review, book, input.content, analyzer);
}

/** Elimina una reseña del usuario (verifica pertenencia primero). */
export async function deleteReview(
  userId: string,
  bookId: string,
  reviewId: string,
): Promise<void> {
  await getOwnedBook(userId, bookId);
  await assertReviewInBook(reviewId, bookId);
  await prisma.review.delete({ where: { id: reviewId } });
}

/** Lista las reseñas de un libro del usuario (más recientes primero). */
export async function listReviews(userId: string, bookId: string) {
  await getOwnedBook(userId, bookId);
  return prisma.review.findMany({
    where: { bookId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Analiza el contenido con la IA y guarda el resultado: resumen y sentimiento en
 * la reseña, y las etiquetas propagadas al libro (N-N). Si la IA falla, devuelve
 * la reseña tal cual (degradación elegante: la IA es un extra, no un SPOF).
 */
async function enrichWithAnalysis<T>(
  review: T,
  book: { id: string; title: string; author: string },
  content: string,
  analyzer: ReviewAnalyzer,
): Promise<T> {
  try {
    const analysis = await analyzer.analyze({
      content,
      bookTitle: book.title,
      author: book.author,
    });

    const [enriched] = await prisma.$transaction([
      prisma.review.update({
        where: { id: (review as { id: string }).id },
        data: { aiSummary: analysis.summary, aiSentiment: analysis.sentiment },
      }),
      prisma.book.update({
        where: { id: book.id },
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
    return enriched as T;
  } catch (error) {
    console.error("No se pudo analizar la reseña con IA:", error);
    return review;
  }
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

/** Verifica que la reseña exista y pertenezca al libro; si no, NotFoundError. */
async function assertReviewInBook(reviewId: string, bookId: string): Promise<void> {
  const review = await prisma.review.findFirst({
    where: { id: reviewId, bookId },
    select: { id: true },
  });
  if (!review) {
    throw new NotFoundError("Reseña no encontrada");
  }
}
