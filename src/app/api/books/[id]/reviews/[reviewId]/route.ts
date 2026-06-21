import { bookIdSchema } from "@/lib/validators/book";
import { reviewIdSchema, updateReviewSchema } from "@/lib/validators/review";
import { getCurrentUserId } from "@/server/current-user";
import { deleteReview, updateReview } from "@/server/review-service";
import { handleRoute, json, parseBody, parseParam } from "@/server/http";

type Context = { params: Promise<{ id: string; reviewId: string }> };

// PATCH /api/books/:id/reviews/:reviewId — edita una reseña.
// Si cambia el contenido, la IA la vuelve a analizar (ver review-service).
export function PATCH(request: Request, { params }: Context) {
  return handleRoute(async () => {
    const userId = await getCurrentUserId();
    const { id, reviewId } = await params;
    const bookId = parseParam(id, bookIdSchema);
    const rId = parseParam(reviewId, reviewIdSchema);
    const input = await parseBody(request, updateReviewSchema);
    return json(await updateReview(userId, bookId, rId, input));
  });
}

// DELETE /api/books/:id/reviews/:reviewId — elimina una reseña.
export function DELETE(_request: Request, { params }: Context) {
  return handleRoute(async () => {
    const userId = await getCurrentUserId();
    const { id, reviewId } = await params;
    const bookId = parseParam(id, bookIdSchema);
    const rId = parseParam(reviewId, reviewIdSchema);
    await deleteReview(userId, bookId, rId);
    return new Response(null, { status: 204 });
  });
}
