import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BookCardProps {
  book: {
    id: string;
    title: string;
    author: string;
    description: string | null;
    tags: { id: string; name: string }[];
    _count: { reviews: number };
  };
}

/** Tarjeta resumida de un libro en la lista de la biblioteca. */
export function BookCard({ book }: BookCardProps) {
  return (
    <Link href={`/books/${book.id}`} className="group block">
      <Card className="h-full transition-colors group-hover:border-indigo-400">
        <h3 className="font-semibold text-zinc-900 group-hover:text-indigo-600 dark:text-zinc-100">
          {book.title}
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{book.author}</p>

        {book.description && (
          <p className="mt-2 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-300">
            {book.description}
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-1.5">
          {book.tags.map((tag) => (
            <Badge key={tag.id}>{tag.name}</Badge>
          ))}
        </div>

        <p className="mt-3 text-xs text-zinc-400">
          {book._count.reviews} {book._count.reviews === 1 ? "reseña" : "reseñas"}
        </p>
      </Card>
    </Link>
  );
}
