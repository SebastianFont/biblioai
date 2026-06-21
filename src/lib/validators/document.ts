import { z } from "zod";

/** Restricciones de subida de documentos PDF. */
export const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10 MB
export const PDF_MIME = "application/pdf";

export const documentFilenameSchema = z
  .string()
  .trim()
  .min(1, "Nombre de archivo inválido")
  .max(255);

// Identificador de documento en parámetros de ruta.
export const documentIdSchema = z.cuid("Identificador de documento inválido");

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

// El análisis es parcial a propósito: el usuario elige qué generar (resumen,
// mapa conceptual, o ambos), así que cada parte es opcional. Se exige al menos
// una para que el resultado tenga sentido.
export const documentAnalysisSchema = z
  .object({
    summary: z.string().trim().min(1).max(4000).optional(),
    conceptMap: conceptMapSchema.optional(),
  })
  .refine((data) => data.summary !== undefined || data.conceptMap !== undefined, {
    message: "El análisis debe incluir al menos el resumen o el mapa conceptual",
  });

export type DocumentAnalysis = z.infer<typeof documentAnalysisSchema>;

// Booleano tolerante: acepta el tipo nativo o las formas típicas de un form/JSON
// ("true"/"on"/"1" → true; "false"/"off"/"0"/ausente → false). No uso
// z.coerce.boolean porque convierte CUALQUIER string no vacío (incluso "false")
// en true. Por defecto false: lo no marcado no se genera.
const checkboxBool = z
  .union([z.boolean(), z.string()])
  .optional()
  .transform((v) => v === true || v === "true" || v === "on" || v === "1");

// Qué partes generar. Se exige elegir al menos una.
// Se usa tanto al subir (form) como al re-analizar (body JSON).
export const generateOptionsSchema = z
  .object({
    summary: checkboxBool,
    conceptMap: checkboxBool,
  })
  .refine((data) => data.summary || data.conceptMap, {
    message: "Elegí al menos una opción para generar (resumen o mapa conceptual)",
  });

export type GenerateOptions = z.infer<typeof generateOptionsSchema>;

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
