import { prisma } from "@/lib/db/client";
import { NotFoundError } from "@/server/errors";
import type { CreateBookInput, UpdateBookInput } from "@/lib/validators/book";

/**
 * Lógica de negocio de libros.
 *
 * Todas las operaciones reciben el `userId` y están acotadas a sus libros:
 * un usuario nunca puede leer ni modificar libros de otro. Al recibir el
 * usuario como parámetro (en vez de leer la sesión acá dentro), el service
 * queda desacoplado de la autenticación y es testeable de forma aislada.
 */

/**
 * Lista los libros del usuario, con sus etiquetas y la cantidad de reseñas.
 *
 * Con `search`, filtra por coincidencia (parcial) en título, autor o nombre de
 * etiqueta. En SQLite `contains` usa LIKE, que es insensible a mayúsculas para
 * ASCII; alcanza para una búsqueda simple sin índice de texto completo.
 */
export function listBooks(userId: string, search?: string) {
  const term = search?.trim();
  return prisma.book.findMany({
    where: {
      ownerId: userId,
      ...(term
        ? {
            OR: [
              { title: { contains: term } },
              { author: { contains: term } },
              { tags: { some: { name: { contains: term } } } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      tags: { select: { id: true, name: true } },
      _count: { select: { reviews: true } },
    },
  });
}

/** Devuelve un libro del usuario con sus reseñas y etiquetas, o lanza NotFoundError. */
export async function getBook(userId: string, bookId: string) {
  const book = await prisma.book.findFirst({
    where: { id: bookId, ownerId: userId },
    include: {
      tags: { select: { id: true, name: true } },
      reviews: { orderBy: { createdAt: "desc" } },
      documents: {
        select: {
          id: true,
          filename: true,
          pageCount: true,
          aiSummary: true,
          aiConceptMap: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!book) {
    throw new NotFoundError("Libro no encontrado");
  }
  return book;
}

/** Crea un libro para el usuario. */
export function createBook(userId: string, input: CreateBookInput) {
  return prisma.book.create({
    data: { ...input, ownerId: userId },
    include: { tags: true },
  });
}

/** Actualiza un libro del usuario (verifica pertenencia primero). */
export async function updateBook(userId: string, bookId: string, input: UpdateBookInput) {
  await assertOwnership(userId, bookId);
  return prisma.book.update({
    where: { id: bookId },
    data: input,
    include: { tags: true },
  });
}

/** Elimina un libro del usuario (y en cascada sus reseñas). */
export async function deleteBook(userId: string, bookId: string): Promise<void> {
  await assertOwnership(userId, bookId);
  await prisma.book.delete({ where: { id: bookId } });
}

/** Verifica que el libro exista y sea del usuario; si no, lanza NotFoundError. */
async function assertOwnership(userId: string, bookId: string): Promise<void> {
  const owned = await prisma.book.findFirst({
    where: { id: bookId, ownerId: userId },
    select: { id: true },
  });
  if (!owned) {
    throw new NotFoundError("Libro no encontrado");
  }
}
