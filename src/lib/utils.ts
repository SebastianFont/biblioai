/** Une clases de Tailwind ignorando valores falsy. Pequeño y sin dependencias. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/** Formatea una fecha (string o Date) en formato legible es-AR. */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}
