import { bookIdSchema } from "@/lib/validators/book";
import { createReviewSchema } from "@/lib/validators/review";
import { getCurrentUserId } from "@/server/current-user";
import { addReview, listReviews } from "@/server/review-service";
import { handleRoute, json, parseBody, parseParam } from "@/server/http";

type Context = { params: Promise<{ id: string }> };

// GET /api/books/:id/reviews — reseñas de un libro.
export function GET(_request: Request, { params }: Context) {
  return handleRoute(async () => {
    const userId = await getCurrentUserId();
    const bookId = parseParam((await params).id, bookIdSchema);
    const reviews = await listReviews(userId, bookId);
    return json(reviews);
  });
}

// POST /api/books/:id/reviews — agrega una reseña al libro.
export function POST(request: Request, { params }: Context) {
  return handleRoute(async () => {
    const userId = await getCurrentUserId();
    const bookId = parseParam((await params).id, bookIdSchema);
    const input = await parseBody(request, createReviewSchema);
    const review = await addReview(userId, bookId, input);
    return json(review, 201);
  });
}
