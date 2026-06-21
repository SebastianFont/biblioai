import { reviewAnalysisSchema, type Sentiment } from "@/lib/validators/review";
import type { AnalyzeInput, ReviewAnalyzer } from "@/lib/ai/types";

/**
 * Analizador simulado: determinista y sin costo.
 *
 * Es la implementación por defecto. No llama a ningún servicio externo, así que
 * el repo funciona para cualquiera (y en CI) sin credenciales ni gastar tokens.
 * La heurística es sencilla a propósito; la calidad "real" la aporta el
 * proveedor de Claude (ver claude-analyzer.ts). Lo importante es que cumple el
 * mismo contrato y devuelve datos que pasan `reviewAnalysisSchema`.
 */

const POSITIVE_WORDS = [
  "genial",
  "excelente",
  "brillante",
  "joya",
  "encanta",
  "recomiendo",
  "engancha",
];
const NEGATIVE_WORDS = ["aburrido", "lento", "flojo", "decepción", "malo", "pesado", "abandoné"];

// Palabras clave → etiqueta de género/tema.
const TAG_KEYWORDS: Record<string, string> = {
  litrpg: "LitRPG",
  mazmorra: "Mazmorra",
  magia: "Fantasía",
  fantasía: "Fantasía",
  espacio: "Ciencia ficción",
  romance: "Romance",
  humor: "Humor",
  oscuro: "Oscuro",
  épica: "Épica",
};

function detectSentiment(text: string): Sentiment {
  const lower = text.toLowerCase();
  const positives = POSITIVE_WORDS.filter((w) => lower.includes(w)).length;
  const negatives = NEGATIVE_WORDS.filter((w) => lower.includes(w)).length;

  if (positives > 0 && negatives > 0) return "MIXED";
  if (positives > 0) return "POSITIVE";
  if (negatives > 0) return "NEGATIVE";
  return "NEUTRAL";
}

function detectTags(text: string): string[] {
  const lower = text.toLowerCase();
  const tags = new Set<string>();
  for (const [keyword, tag] of Object.entries(TAG_KEYWORDS)) {
    if (lower.includes(keyword)) tags.add(tag);
  }
  // Siempre devolvemos al menos una etiqueta para que el filtrado tenga sentido.
  if (tags.size === 0) tags.add("General");
  return [...tags].slice(0, 10);
}

function summarize(content: string, bookTitle: string): string {
  const clean = content.replace(/\s+/g, " ").trim();
  const snippet = clean.length > 160 ? `${clean.slice(0, 157)}...` : clean;
  return `Reseña de «${bookTitle}»: ${snippet}`.slice(0, 1000);
}

export const mockAnalyzer: ReviewAnalyzer = {
  async analyze({ content, bookTitle }: AnalyzeInput) {
    // Validamos también acá para garantizar el contrato pase lo que pase.
    return reviewAnalysisSchema.parse({
      summary: summarize(content, bookTitle),
      tags: detectTags(`${bookTitle} ${content}`),
      sentiment: detectSentiment(content),
    });
  },
};
