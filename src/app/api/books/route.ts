import { createBookSchema } from "@/lib/validators/book";
import { getCurrentUserId } from "@/server/current-user";
import { createBook, listBooks } from "@/server/book-service";
import { handleRoute, json, parseBody } from "@/server/http";

// GET /api/books — lista los libros del usuario actual.
export function GET() {
  return handleRoute(async () => {
    const userId = await getCurrentUserId();
    const books = await listBooks(userId);
    return json(books);
  });
}

// POST /api/books — crea un libro.
export function POST(request: Request) {
  return handleRoute(async () => {
    const userId = await getCurrentUserId();
    const input = await parseBody(request, createBookSchema);
    const book = await createBook(userId, input);
    return json(book, 201);
  });
}
