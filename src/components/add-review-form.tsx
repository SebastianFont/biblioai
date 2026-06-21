"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

/** Formulario para agregar una reseña a un libro. La IA la enriquece en el server. */
export function AddReviewForm({ bookId }: { bookId: string }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [rating, setRating] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const payload: Record<string, unknown> = { content };
    if (rating) payload.rating = Number(rating);

    const res = await fetch(`/api/books/${bookId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setContent("");
      setRating("");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.fields?.content ?? data.error ?? "No se pudo guardar la reseña");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3" noValidate>
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="¿Qué te pareció el libro?"
        disabled={loading}
      />
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          Puntuación
          <select
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            disabled={loading}
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
        <Button type="submit" disabled={loading || !content.trim()}>
          {loading && <Spinner />}
          {loading ? "Analizando con IA..." : "Publicar reseña"}
        </Button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
