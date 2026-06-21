import Link from "next/link";
import { getCurrentUserId } from "@/server/current-user";
import { listBooks } from "@/server/book-service";
import { BookCard } from "@/components/book-card";
import { NewBookForm } from "@/components/new-book-form";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// La lista depende de los datos del usuario, así que se renderiza en cada request.
export const dynamic = "force-dynamic";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag } = await searchParams;
  const userId = await getCurrentUserId();
  const books = await listBooks(userId);

  // Etiquetas únicas para el filtro.
  const allTags = [...new Set(books.flatMap((b) => b.tags.map((t) => t.name)))].sort();
  const visible = tag ? books.filter((b) => b.tags.some((t) => t.name === tag)) : books;

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold tracking-tight">Mi biblioteca</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {books.length} {books.length === 1 ? "libro" : "libros"}. Las reseñas se resumen y
          etiquetan con IA.
        </p>
      </section>

      <Card>
        <h2 className="mb-3 font-semibold">Agregar libro</h2>
        <NewBookForm />
      </Card>

      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-zinc-500">Filtrar:</span>
          <FilterChip label="Todos" href="/" active={!tag} />
          {allTags.map((name) => (
            <FilterChip
              key={name}
              label={name}
              href={`/?tag=${encodeURIComponent(name)}`}
              active={tag === name}
            />
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <Card className="text-center text-sm text-zinc-500">
          {books.length === 0
            ? "Todavía no cargaste ningún libro. ¡Agregá el primero arriba!"
            : "No hay libros con esa etiqueta."}
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {visible.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link href={href}>
      <Badge
        className={
          active
            ? "bg-indigo-600 text-white dark:bg-indigo-600 dark:text-white"
            : "hover:bg-zinc-200 dark:hover:bg-zinc-700"
        }
      >
        {label}
      </Badge>
    </Link>
  );
}
