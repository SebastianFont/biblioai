import { bookIdSchema, updateBookSchema } from "@/lib/validators/book";
import { getCurrentUserId } from "@/server/current-user";
import { deleteBook, getBook, updateBook } from "@/server/book-service";
import { handleRoute, json, parseBody, parseParam } from "@/server/http";

// El segundo argumento trae los parámetros dinámicos de la ruta.
// En Next 16 `params` es una promesa: hay que await-earla.
type Context = { params: Promise<{ id: string }> };

// GET /api/books/:id — detalle de un libro con sus reseñas.
export function GET(_request: Request, { params }: Context) {
  return handleRoute(async () => {
    const userId = await getCurrentUserId();
    const id = parseParam((await params).id, bookIdSchema);
    const book = await getBook(userId, id);
    return json(book);
  });
}

// PATCH /api/books/:id — actualización parcial.
export function PATCH(request: Request, { params }: Context) {
  return handleRoute(async () => {
    const userId = await getCurrentUserId();
    const id = parseParam((await params).id, bookIdSchema);
    const input = await parseBody(request, updateBookSchema);
    const book = await updateBook(userId, id, input);
    return json(book);
  });
}

// DELETE /api/books/:id — elimina el libro (y sus reseñas en cascada).
export function DELETE(_request: Request, { params }: Context) {
  return handleRoute(async () => {
    const userId = await getCurrentUserId();
    const id = parseParam((await params).id, bookIdSchema);
    await deleteBook(userId, id);
    return new Response(null, { status: 204 });
  });
}
