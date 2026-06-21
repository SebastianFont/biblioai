"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * Buscador de la biblioteca. Navega a `/?q=...`; la página (server component)
 * lee ese parámetro y filtra en la base. La búsqueda y el filtro por etiqueta
 * son independientes: buscar limpia la etiqueta activa.
 */
export function BookSearch({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const term = query.trim();
    router.push(term ? `/?q=${encodeURIComponent(term)}` : "/");
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2" role="search">
      <Input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar por título, autor o etiqueta..."
        aria-label="Buscar libros"
      />
      <Button type="submit" variant="secondary">
        Buscar
      </Button>
    </form>
  );
}
