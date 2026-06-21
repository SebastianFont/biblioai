import { z } from "zod";

/**
 * Esquemas de validación de reseñas.
 */

// Valores posibles del análisis de sentimiento que produce la IA.
// Se define acá (y no como enum de Prisma) porque SQLite no soporta enums;
// este esquema valida tanto la salida del modelo como lo que se guarda.
export const sentimentSchema = z.enum(["POSITIVE", "NEUTRAL", "NEGATIVE", "MIXED"]);
export type Sentiment = z.infer<typeof sentimentSchema>;

// Datos que el usuario envía al crear una reseña.
// El resumen, las etiquetas y el sentimiento NO se aceptan del cliente:
// los genera la capa de IA (ver lib/ai), nunca llegan desde la request.
export const createReviewSchema = z.object({
  content: z.string().trim().min(1, "La reseña no puede estar vacía").max(5000),
  rating: z.number().int().min(1).max(5).optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

// Forma esperada del análisis que devuelve el modelo (se valida al recibirlo).
export const reviewAnalysisSchema = z.object({
  summary: z.string().trim().min(1).max(1000),
  tags: z.array(z.string().trim().min(1).max(40)).max(10),
  sentiment: sentimentSchema,
});

export type ReviewAnalysis = z.infer<typeof reviewAnalysisSchema>;
