import Link from "next/link";

/** Encabezado del sitio, presente en todas las páginas. */
export function SiteHeader() {
  return (
    <header className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <span aria-hidden>📚</span>
          <span>BiblioAI</span>
        </Link>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">Biblioteca personal con IA</span>
      </div>
    </header>
  );
}
