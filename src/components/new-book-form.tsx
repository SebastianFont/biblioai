"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

type Fields = Record<string, string>;

const EMPTY = { title: "", author: "", description: "", coverUrl: "" };

/** Formulario para crear un libro. Postea a /api/books y refresca la lista. */
export function NewBookForm() {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Fields>({});
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof EMPTY, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setErrors({});

    // Solo enviamos los opcionales si tienen valor (un string vacío no es URL válida).
    const payload: Record<string, string> = { title: form.title, author: form.author };
    if (form.description.trim()) payload.description = form.description.trim();
    if (form.coverUrl.trim()) payload.coverUrl = form.coverUrl.trim();

    const res = await fetch("/api/books", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setForm(EMPTY);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setErrors(data.fields ?? { _: data.error ?? "No se pudo crear el libro" });
    }
    setLoading(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3" noValidate>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Título" error={errors.title}>
          <Input
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="Dungeon Crawler Carl"
          />
        </Field>
        <Field label="Autor" error={errors.author}>
          <Input
            value={form.author}
            onChange={(e) => update("author", e.target.value)}
            placeholder="Matt Dinniman"
          />
        </Field>
      </div>
      <Field label="Portada (URL, opcional)" error={errors.coverUrl}>
        <Input
          value={form.coverUrl}
          onChange={(e) => update("coverUrl", e.target.value)}
          placeholder="https://..."
        />
      </Field>
      <Field label="Descripción (opcional)" error={errors.description}>
        <Textarea
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="Una breve sinopsis..."
        />
      </Field>

      {errors._ && <p className="text-sm text-red-600">{errors._}</p>}

      <Button type="submit" disabled={loading}>
        {loading && <Spinner />}
        {loading ? "Guardando..." : "Agregar libro"}
      </Button>
    </form>
  );
}

/** Campo de formulario con etiqueta y mensaje de error. */
function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
      {children}
      {error && <span className="block text-xs text-red-600">{error}</span>}
    </label>
  );
}
