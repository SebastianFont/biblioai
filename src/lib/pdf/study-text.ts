import { PAGE_BREAK } from "@/lib/pdf/extract-text";

/**
 * Preprocesa el texto de un documento para mandárselo a la IA al generar el
 * resumen / mapa conceptual. El objetivo es **menos tokens y menos latencia**:
 *
 *  1. Descarta páginas que no aportan al estudio (sobre todo ejercicios), porque
 *     listas de problemas y enunciados no se resumen ni mapean.
 *  2. Normaliza el espacio en blanco (PDFs traen mucho ruido de maquetado).
 *  3. Recorta el resultado a un presupuesto de caracteres.
 *
 * Es una heurística deliberadamente conservadora: ante la duda, conserva la
 * página (mejor mandar de más que perder contenido conceptual).
 */

const MAX_STUDY_CHARS = 24_000;

// Pistas de que una página es de ejercicios/actividades (sin acentos, en minúscula).
const EXERCISE_HINTS = [
  "ejercicio",
  "ejercicios",
  "ejercitacion",
  "actividad",
  "actividades",
  "problemas propuestos",
  "practica",
  "cuestionario",
  "preguntas de repaso",
  "exercises",
  "problems",
];

/** Quita acentos y pasa a minúscula para comparar de forma robusta. */
function fold(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); // marcas diacríticas combinantes
}

/** Colapsa espacios y líneas en blanco de más; recorta. */
function normalizeWhitespace(text: string): string {
  return text
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Heurística: ¿esta página es mayormente ejercicios?
 * Exige señales léxicas (palabras de ejercicio) junto con densidad de ítems
 * enumerados, o una densidad de enumeración muy alta por sí sola (lista de
 * problemas sin encabezado). Así una mención suelta a "ejercicio" no la descarta.
 */
export function isExercisePage(page: string): boolean {
  const norm = fold(page);
  if (!norm.trim()) return false;

  const hintHits = EXERCISE_HINTS.filter((h) => norm.includes(h)).length;

  const lines = page.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return false;
  const numbered = lines.filter((l) => /^\s*\d+\s*[).\-–]\s+/.test(l)).length;
  const numberedRatio = numbered / lines.length;

  return (hintHits > 0 && numberedRatio > 0.25) || numberedRatio > 0.5;
}

export interface PreparedStudyText {
  /** Texto listo para el prompt (sin ejercicios, normalizado y acotado). */
  text: string;
  totalPages: number;
  usedPages: number;
  droppedPages: number;
  truncated: boolean;
}

export function prepareStudyText(
  raw: string,
  { maxChars = MAX_STUDY_CHARS }: { maxChars?: number } = {},
): PreparedStudyText {
  const pages = raw.split(PAGE_BREAK);
  const totalPages = pages.length;

  let kept = pages.filter((p) => p.trim() && !isExercisePage(p));
  // Si filtramos todo (p. ej. un cuadernillo entero de ejercicios), no dejamos
  // a la IA sin material: usamos todas las páginas con contenido.
  if (kept.length === 0) kept = pages.filter((p) => p.trim());

  const droppedPages = totalPages - kept.length;
  const normalized = normalizeWhitespace(kept.join("\n\n"));

  const truncated = normalized.length > maxChars;
  let text = normalized;
  if (truncated) {
    const slice = normalized.slice(0, maxChars);
    // Cortamos en el último espacio para no partir una palabra al medio.
    const lastSpace = slice.lastIndexOf(" ");
    text = (lastSpace > maxChars * 0.8 ? slice.slice(0, lastSpace) : slice).trimEnd();
  }

  return { text, totalPages, usedPages: kept.length, droppedPages, truncated };
}
