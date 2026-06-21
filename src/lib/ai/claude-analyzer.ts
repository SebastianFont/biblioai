import { reviewAnalysisSchema } from "@/lib/validators/review";
import type { AnalyzeInput, ReviewAnalyzer } from "@/lib/ai/types";

/**
 * Analizador real con el Claude Agent SDK.
 *
 * Usa la suscripción de Claude del usuario logueado en Claude Code (no requiere
 * ANTHROPIC_API_KEY): el SDK cae automáticamente en la auth de suscripción
 * cuando no hay API key. Por eso funciona localmente sin costo extra, pero no
 * en un deploy público que sirva a terceros (ver docs/AI_USAGE.md).
 *
 * Se importa el SDK de forma diferida (dynamic import) para que el camino por
 * defecto (mock) y el build no carguen una dependencia pesada que lanza un
 * subproceso.
 *
 * Se pide JSON crudo por prompt (en vez de `outputFormat`) y se valida con Zod:
 * es más robusto entre versiones del SDK y no consume turnos extra.
 */

const SYSTEM_PROMPT = [
  "Sos un asistente que analiza reseñas de libros y respondés en español.",
  "Respondé ÚNICAMENTE con un objeto JSON válido, sin texto extra ni markdown,",
  "con exactamente estas claves:",
  '- "summary": string (1 a 3 frases, resumen objetivo de la reseña).',
  '- "tags": array de 1 a 5 strings (géneros o temas, p. ej. "Fantasía", "Humor").',
  '- "sentiment": uno de "POSITIVE", "NEUTRAL", "NEGATIVE", "MIXED".',
].join(" ");

function buildPrompt({ content, bookTitle, author }: AnalyzeInput): string {
  return [
    `Libro: «${bookTitle}» de ${author}.`,
    "Reseña:",
    content,
    "",
    "Devolvé solo el JSON.",
  ].join("\n");
}

/** Extrae el primer objeto JSON de un texto (por si viene con texto o ```fences). */
function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("La respuesta del modelo no contiene JSON");
  }
  return JSON.parse(text.slice(start, end + 1));
}

export const claudeAnalyzer: ReviewAnalyzer = {
  async analyze(input: AnalyzeInput) {
    const { query } = await import("@anthropic-ai/claude-agent-sdk");

    let raw: unknown;
    for await (const message of query({
      prompt: buildPrompt(input),
      options: {
        model: process.env.AI_MODEL ?? "haiku",
        systemPrompt: SYSTEM_PROMPT,
        maxTurns: 2, // Margen para una respuesta de texto; no usa herramientas.
        allowedTools: [], // Tarea de texto pura: sin herramientas.
      },
    })) {
      if (message.type === "result") {
        if (message.subtype !== "success") {
          throw new Error(`El análisis con Claude falló: ${message.subtype}`);
        }
        raw = extractJson(message.result);
        break;
      }
    }

    // Defensa en profundidad: nunca confiamos a ciegas en la salida del modelo.
    return reviewAnalysisSchema.parse(raw);
  },
};
