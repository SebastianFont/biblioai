"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { GenerateOptionsFields, type GenerateOptionsValue } from "@/components/generate-options";

/**
 * Acciones sobre un documento ya subido: re-analizar (regenerar resumen y/o mapa
 * conceptual con la IA, según se elija) y borrar. Componente cliente: maneja el
 * estado de envío y refresca la vista al terminar.
 */
export function DocumentActions({
  bookId,
  documentId,
  analyzed,
}: {
  bookId: string;
  documentId: string;
  analyzed: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<null | "reanalyze" | "delete">(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [generate, setGenerate] = useState<GenerateOptionsValue>({
    summary: true,
    conceptMap: true,
  });

  const endpoint = `/api/books/${bookId}/documents/${documentId}`;
  const nothingSelected = !generate.summary && !generate.conceptMap;

  async function reanalyze() {
    setBusy("reanalyze");
    setError(null);
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(generate),
    });
    if (res.ok) {
      setOpen(false);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo re-analizar el documento");
    }
    setBusy(null);
  }

  async function remove() {
    if (!confirm("¿Borrar este documento? No se puede deshacer.")) return;
    setBusy("delete");
    setError(null);
    const res = await fetch(endpoint, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo borrar el documento");
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={busy !== null}
          onClick={() => setOpen((v) => !v)}
        >
          {analyzed ? "Re-analizar" : "Analizar"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={busy !== null}
          onClick={remove}
          className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
        >
          {busy === "delete" && <Spinner />}
          Borrar
        </Button>
      </div>

      {open && (
        <div className="flex flex-col items-end gap-2 rounded-md border border-zinc-200 p-2 dark:border-zinc-800">
          <GenerateOptionsFields value={generate} onChange={setGenerate} disabled={busy !== null} />
          <Button
            type="button"
            size="sm"
            disabled={busy !== null || nothingSelected}
            onClick={reanalyze}
          >
            {busy === "reanalyze" && <Spinner />}
            {busy === "reanalyze" ? "Analizando con IA..." : "Generar"}
          </Button>
        </div>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
