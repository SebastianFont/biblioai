import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUserId } from "@/server/current-user";
import { getBook } from "@/server/book-service";
import { NotFoundError } from "@/server/errors";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SentimentBadge } from "@/components/sentiment-badge";
import { AddReviewForm } from "@/components/add-review-form";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await getCurrentUserId();

  const book = await getBook(userId, id).catch((error) => {
    if (error instanceof NotFoundError) notFound();
    throw error;
  });

  return (
    <div className="space-y-8">
      <Link href="/" className="text-sm text-indigo-600 hover:underline">
        ← Volver a la biblioteca
      </Link>

      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">{book.title}</h1>
        <p className="text-zinc-500 dark:text-zinc-400">{book.author}</p>
        {book.description && (
          <p className="text-sm text-zinc-600 dark:text-zinc-300">{book.description}</p>
        )}
        {book.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {book.tags.map((tag) => (
              <Badge key={tag.id}>{tag.name}</Badge>
            ))}
          </div>
        )}
      </header>

      <Card>
        <h2 className="mb-3 font-semibold">Escribir una reseña</h2>
        <AddReviewForm bookId={book.id} />
      </Card>

      <section className="space-y-4">
        <h2 className="font-semibold">
          Reseñas <span className="text-sm font-normal text-zinc-400">({book.reviews.length})</span>
        </h2>

        {book.reviews.length === 0 ? (
          <Card className="text-center text-sm text-zinc-500">
            Todavía no hay reseñas. ¡Escribí la primera!
          </Card>
        ) : (
          book.reviews.map((review) => (
            <Card key={review.id} className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {review.rating != null && (
                    <span className="text-sm text-amber-500" aria-label={`${review.rating} de 5`}>
                      {"★".repeat(review.rating)}
                      <span className="text-zinc-300 dark:text-zinc-600">
                        {"★".repeat(5 - review.rating)}
                      </span>
                    </span>
                  )}
                  {review.aiSentiment && <SentimentBadge sentiment={review.aiSentiment} />}
                </div>
                <time className="text-xs text-zinc-400">{formatDate(review.createdAt)}</time>
              </div>

              <p className="text-sm text-zinc-700 dark:text-zinc-200">{review.content}</p>

              {review.aiSummary && (
                <div className="rounded-md bg-indigo-50 p-3 text-sm dark:bg-indigo-950/40">
                  <p className="mb-1 text-xs font-medium tracking-wide text-indigo-600 uppercase dark:text-indigo-300">
                    Resumen IA
                  </p>
                  <p className="text-zinc-700 dark:text-zinc-200">{review.aiSummary}</p>
                </div>
              )}
            </Card>
          ))
        )}
      </section>
    </div>
  );
}
