import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUserId } from "@/server/current-user";
import { getBook } from "@/server/book-service";
import { NotFoundError } from "@/server/errors";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddReviewForm } from "@/components/add-review-form";
import { ReviewItem } from "@/components/review-item";
import { DocumentUpload } from "@/components/document-upload";
import { DocumentActions } from "@/components/document-actions";
import { ConceptMapView } from "@/components/concept-map";
import { parseConceptMap } from "@/lib/validators/document";
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
        <h2 className="font-semibold">Material de estudio</h2>
        <p className="mt-1 mb-3 text-sm text-zinc-500 dark:text-zinc-400">
          Subí un PDF y la IA generará un resumen y un mapa conceptual para estudiar.
        </p>
        <DocumentUpload bookId={book.id} />

        {book.documents.length > 0 && (
          <ul className="mt-4 space-y-3">
            {book.documents.map((doc) => {
              const conceptMap = parseConceptMap(doc.aiConceptMap);
              return (
                <li
                  key={doc.id}
                  className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800"
                >
                  <div className="flex items-start justify-between gap-2 text-sm">
                    <span className="flex items-center gap-2">
                      <span aria-hidden>📄</span>
                      <span className="font-medium">{doc.filename}</span>
                      {doc.pageCount != null && (
                        <span className="text-zinc-400">· {doc.pageCount} pág.</span>
                      )}
                      <time className="text-xs text-zinc-400">{formatDate(doc.createdAt)}</time>
                    </span>
                    <DocumentActions
                      bookId={book.id}
                      documentId={doc.id}
                      analyzed={Boolean(doc.aiSummary)}
                    />
                  </div>

                  {doc.aiSummary && (
                    <div className="mt-3 rounded-md bg-indigo-50 p-3 text-sm dark:bg-indigo-950/40">
                      <p className="mb-1 text-xs font-medium tracking-wide text-indigo-600 uppercase dark:text-indigo-300">
                        Resumen IA
                      </p>
                      <p className="whitespace-pre-line text-zinc-700 dark:text-zinc-200">
                        {doc.aiSummary}
                      </p>
                    </div>
                  )}

                  {conceptMap && (
                    <div className="mt-3">
                      <p className="mb-2 text-xs font-medium tracking-wide text-indigo-600 uppercase dark:text-indigo-300">
                        Mapa conceptual
                      </p>
                      <ConceptMapView map={conceptMap} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

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
            <ReviewItem key={review.id} bookId={book.id} review={review} />
          ))
        )}
      </section>
    </div>
  );
}
