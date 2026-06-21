import { z } from "zod";

/** Restricciones de subida de documentos PDF. */
export const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10 MB
export const PDF_MIME = "application/pdf";

export const documentFilenameSchema = z
  .string()
  .trim()
  .min(1, "Nombre de archivo inválido")
  .max(255);

// ─────────────────────────────────────────────────────────────────────────────
// Análisis de IA de un documento: resumen + mapa conceptual.
// Esta forma valida tanto la salida del modelo como lo que se persiste.
// ─────────────────────────────────────────────────────────────────────────────

// Un concepto del mapa: una idea con su explicación y los conceptos con los que
// se relaciona (por nombre). El grafo se arma a partir de esas conexiones.
export const conceptSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(400),
  connections: z.array(z.string().trim().min(1).max(120)).max(8).default([]),
});

// Mapa conceptual: un tema central y los conceptos que lo desarrollan.
export const conceptMapSchema = z.object({
  central: z.string().trim().min(1).max(120),
  concepts: z.array(conceptSchema).min(1).max(20),
});

export type ConceptMap = z.infer<typeof conceptMapSchema>;

export const documentAnalysisSchema = z.object({
  summary: z.string().trim().min(1).max(4000),
  conceptMap: conceptMapSchema,
});

export type DocumentAnalysis = z.infer<typeof documentAnalysisSchema>;

/**
 * Parsea el mapa conceptual guardado (JSON string) de forma tolerante.
 * Devuelve `null` si está ausente o no cumple el esquema, para que la UI
 * pueda degradar con elegancia en vez de romper.
 */
export function parseConceptMap(raw: string | null | undefined): ConceptMap | null {
  if (!raw) return null;
  try {
    return conceptMapSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}
