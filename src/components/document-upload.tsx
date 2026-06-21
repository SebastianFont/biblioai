"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { GenerateOptionsFields, type GenerateOptionsValue } from "@/components/generate-options";

/** Sube un PDF a un libro (multipart) y refresca la vista. */
export function DocumentUpload({ bookId }: { bookId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generate, setGenerate] = useState<GenerateOptionsValue>({
    summary: true,
    conceptMap: true,
  });

  const nothingSelected = !generate.summary && !generate.conceptMap;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setError("Elegí un archivo PDF.");
      return;
    }
    if (nothingSelected) {
      setError("Elegí al menos qué generar: resumen o mapa conceptual.");
      return;
    }
    setLoading(true);
    setError(null);

    const body = new FormData();
    body.append("file", file);
    body.append("summary", String(generate.summary));
    body.append("conceptMap", String(generate.conceptMap));
    const res = await fetch(`/api/books/${bookId}/documents`, { method: "POST", body });

    if (res.ok) {
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo subir el PDF.");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          disabled={loading}
          className="text-sm text-zinc-600 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100 dark:text-zinc-300 dark:file:bg-indigo-950/40 dark:file:text-indigo-300"
        />
        <Button type="submit" disabled={loading || nothingSelected}>
          {loading && <Spinner />}
          {loading ? "Procesando PDF..." : "Subir PDF"}
        </Button>
      </div>
      <GenerateOptionsFields value={generate} onChange={setGenerate} disabled={loading} />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
