import { documentAnalysisSchema } from "@/lib/validators/document";
import type { AnalyzeDocumentInput, DocumentAnalyzer } from "@/lib/ai/types";

/**
 * Analizador de documentos real con el Claude Agent SDK.
 *
 * Mismas consideraciones que `claude-analyzer.ts`: usa la suscripción de Claude
 * del usuario logueado (no requiere ANTHROPIC_API_KEY), importa el SDK de forma
 * diferida, y pide JSON crudo por prompt que luego se valida con Zod.
 *
 * Optimización de costo/latencia:
 *  - El `text` ya llega preprocesado (sin ejercicios y acotado; ver study-text).
 *  - El system prompt pide SOLO las partes elegidas (`generate`): si únicamente
 *    se quiere el resumen, no se gasta nada en el mapa conceptual (ni al revés).
 */

function buildSystemPrompt({ summary, conceptMap }: { summary: boolean; conceptMap: boolean }) {
  const keys: string[] = [];
  if (summary) {
    keys.push('- "summary": string (resumen claro del documento, 1 a 3 párrafos).');
  }
  if (conceptMap) {
    keys.push(
      '- "conceptMap": objeto con "central" (string, el tema central) y "concepts"',
      '  (array de 3 a 12 objetos con "name" (string), "description" (1-2 frases)',
      '  y "connections" (array de nombres de otros conceptos relacionados)).',
    );
  }
  return [
    "Sos un asistente que crea material de estudio a partir de textos y respondés en español.",
    "Ignorá páginas de ejercicios, listas de problemas o cuestionarios: no aportan al estudio.",
    "Respondé ÚNICAMENTE con un objeto JSON válido, sin texto extra ni markdown,",
    "con exactamente estas claves:",
    ...keys,
  ].join(" ");
}

function buildPrompt({ text, bookTitle, filename }: AnalyzeDocumentInput): string {
  return [
    `Libro: «${bookTitle}». Documento: «${filename}».`,
    "Texto del documento:",
    text,
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

export const claudeDocumentAnalyzer: DocumentAnalyzer = {
  async analyze(input: AnalyzeDocumentInput) {
    const { query } = await import("@anthropic-ai/claude-agent-sdk");

    let raw: unknown;
    for await (const message of query({
      prompt: buildPrompt(input),
      options: {
        model: process.env.AI_MODEL ?? "haiku",
        systemPrompt: buildSystemPrompt(input.generate),
        maxTurns: 2, // Margen para una respuesta de texto; no usa herramientas.
        allowedTools: [], // Tarea de texto pura: sin herramientas.
      },
    })) {
      if (message.type === "result") {
        if (message.subtype !== "success") {
          throw new Error(`El análisis del documento con Claude falló: ${message.subtype}`);
        }
        raw = extractJson(message.result);
        break;
      }
    }

    // Nos quedamos solo con lo pedido (el modelo a veces agrega de más) y
    // validamos en profundidad: nunca confiamos a ciegas en la salida.
    const obj = (raw ?? {}) as Record<string, unknown>;
    const picked: Record<string, unknown> = {};
    if (input.generate.summary) picked.summary = obj.summary;
    if (input.generate.conceptMap) picked.conceptMap = obj.conceptMap;
    return documentAnalysisSchema.parse(picked);
  },
};
