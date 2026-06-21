"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { SentimentBadge } from "@/components/sentiment-badge";
import { formatDate } from "@/lib/utils";

interface Review {
  id: string;
  content: string;
  rating: number | null;
  aiSentiment: string | null;
  aiSummary: string | null;
  createdAt: Date | string;
}

/**
 * Una reseña con acciones de editar y borrar.
 *
 * Es un componente cliente porque maneja estado de UI (modo edición, envío) y
 * llama a la API. Al editar el contenido, el server vuelve a analizar la reseña;
 * por eso después de guardar refrescamos para ver el nuevo resumen/sentimiento.
 */
export function ReviewItem({ bookId, review }: { bookId: string; review: Review }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(review.content);
  const [rating, setRating] = useState(review.rating?.toString() ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const endpoint = `/api/books/${bookId}/reviews/${review.id}`;

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const payload: Record<string, unknown> = { content };
    payload.rating = rating ? Number(rating) : undefined;

    const res = await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setEditing(false);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.fields?.content ?? data.error ?? "No se pudo guardar la reseña");
    }
    setBusy(false);
  }

  async function remove() {
    if (!confirm("¿Borrar esta reseña? No se puede deshacer.")) return;
    setBusy(true);
    setError(null);
    const res = await fetch(endpoint, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo borrar la reseña");
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <Card>
        <form onSubmit={save} className="space-y-3" noValidate>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={busy}
            autoFocus
          />
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              Puntuación
              <select
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                disabled={busy}
                className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="">—</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} ★
                  </option>
                ))}
              </select>
            </label>
            <Button type="submit" size="sm" disabled={busy || !content.trim()}>
              {busy && <Spinner />}
              {busy ? "Analizando con IA..." : "Guardar"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => {
                setEditing(false);
                setContent(review.content);
                setRating(review.rating?.toString() ?? "");
                setError(null);
              }}
            >
              Cancelar
            </Button>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      </Card>
    );
  }

  return (
    <Card className="space-y-3">
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

      <div className="flex items-center gap-1">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={busy}
          onClick={() => setEditing(true)}
        >
          Editar
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={busy}
          onClick={remove}
          className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
        >
          {busy && <Spinner />}
          Borrar
        </Button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </Card>
  );
}
