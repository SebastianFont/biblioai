import { documentAnalysisSchema, type ConceptMap } from "@/lib/validators/document";
import type { AnalyzeDocumentInput, DocumentAnalyzer } from "@/lib/ai/types";

/**
 * Analizador de documentos simulado: determinista y sin costo.
 *
 * Es la implementación por defecto (igual que `mockAnalyzer` para reseñas).
 * No llama a ningún servicio externo, así que el repo funciona para cualquiera
 * (y en CI) sin credenciales. La heurística es deliberadamente simple; la
 * calidad "real" la aporta el proveedor de Claude (ver claude-document-analyzer).
 * Lo importante es que cumple el mismo contrato y pasa `documentAnalysisSchema`.
 */

// Palabras vacías frecuentes en español que no aportan como "concepto".
const STOP_WORDS = new Set([
  "que",
  "con",
  "para",
  "por",
  "una",
  "uno",
  "las",
  "los",
  "del",
  "este",
  "esta",
  "como",
  "más",
  "pero",
  "sus",
  "sin",
  "entre",
  "cuando",
  "donde",
  "porque",
  "también",
  "sobre",
  "todo",
  "todos",
  "cada",
  "ser",
  "son",
  "está",
  "están",
  "hay",
  "fue",
  "han",
]);

/** Divide el texto en oraciones de forma sencilla (por signos de puntuación). */
function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** Resumen extractivo: las primeras oraciones, acotado a un tamaño razonable. */
function summarize(text: string): string {
  const sentences = splitSentences(text);
  const summary = sentences.slice(0, 3).join(" ");
  return (summary || text.trim()).slice(0, 4000);
}

/** Cuenta las palabras significativas (>3 letras, sin stop-words). */
function topTerms(text: string, limit: number): string[] {
  const counts = new Map<string, { display: string; count: number }>();
  const words = text.toLowerCase().match(/[\p{L}]{4,}/gu) ?? [];
  for (const word of words) {
    if (STOP_WORDS.has(word)) continue;
    const entry = counts.get(word);
    if (entry) {
      entry.count += 1;
    } else {
      // Se guarda con mayúscula inicial para mostrarlo como etiqueta.
      counts.set(word, { display: word.charAt(0).toUpperCase() + word.slice(1), count: 1 });
    }
  }
  return [...counts.values()]
    .sort((a, b) => b.count - a.count || a.display.localeCompare(b.display))
    .slice(0, limit)
    .map((e) => e.display);
}

function buildConceptMap(input: AnalyzeDocumentInput): ConceptMap {
  const terms = topTerms(input.text, 6);
  // Si el texto es demasiado pobre para extraer términos, igualamos el contrato
  // con un único concepto derivado del título.
  const names = terms.length > 0 ? terms : [input.bookTitle.slice(0, 120) || "Tema principal"];

  const concepts = names.map((name, i) => {
    // Encadenamos cada concepto con el siguiente para formar un grafo simple.
    const next = names[i + 1];
    return {
      name,
      description: `Concepto clave del material «${input.filename}».`,
      connections: next ? [next] : [],
    };
  });

  return { central: input.bookTitle.slice(0, 120) || "Tema principal", concepts };
}

export const mockDocumentAnalyzer: DocumentAnalyzer = {
  async analyze(input: AnalyzeDocumentInput) {
    // Genera solo lo pedido (igual que el analizador real) y valida el contrato.
    const result: { summary?: string; conceptMap?: ReturnType<typeof buildConceptMap> } = {};
    if (input.generate.summary) result.summary = summarize(input.text);
    if (input.generate.conceptMap) result.conceptMap = buildConceptMap(input);
    return documentAnalysisSchema.parse(result);
  },
};
