import { documentAnalysisSchema } from "@/lib/validators/document";
import type { AnalyzeDocumentInput, DocumentAnalyzer } from "@/lib/ai/types";

/**
 * Analizador de documentos real con el Claude Agent SDK.
 *
 * Mismas consideraciones que `claude-analyzer.ts`: usa la suscripción de Claude
 * del usuario logueado (no requiere ANTHROPIC_API_KEY), importa el SDK de forma
 * diferida, y pide JSON crudo por prompt que luego se valida con Zod (más robusto
 * entre versiones del SDK y sin gastar turnos extra).
 */

// Límite de caracteres del texto que se manda al modelo. Un PDF largo puede
// exceder el contexto y disparar costo/latencia; recortamos a una porción
// representativa (el resumen extractivo igual prioriza el inicio del material).
const MAX_TEXT_CHARS = 24_000;

const SYSTEM_PROMPT = [
  "Sos un asistente que crea material de estudio a partir de textos y respondés en español.",
  "Respondé ÚNICAMENTE con un objeto JSON válido, sin texto extra ni markdown,",
  "con exactamente estas claves:",
  '- "summary": string (resumen claro del documento, 1 a 3 párrafos).',
  '- "conceptMap": objeto con:',
  '    - "central": string (el tema central, pocas palabras).',
  '    - "concepts": array de 3 a 12 objetos, cada uno con:',
  '        - "name": string (nombre del concepto, pocas palabras).',
  '        - "description": string (1 a 2 frases que lo explican).',
  '        - "connections": array de strings (nombres de otros conceptos relacionados).',
].join(" ");

function buildPrompt({ text, bookTitle, filename }: AnalyzeDocumentInput): string {
  const clipped =
    text.length > MAX_TEXT_CHARS
      ? `${text.slice(0, MAX_TEXT_CHARS)}\n[...texto recortado...]`
      : text;
  return [
    `Libro: «${bookTitle}». Documento: «${filename}».`,
    "Texto del documento:",
    clipped,
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
        systemPrompt: SYSTEM_PROMPT,
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

    // Defensa en profundidad: nunca confiamos a ciegas en la salida del modelo.
    return documentAnalysisSchema.parse(raw);
  },
};
