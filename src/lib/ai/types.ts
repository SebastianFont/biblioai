import type { ReviewAnalysis } from "@/lib/validators/review";

/**
 * Contrato de la capa de IA.
 *
 * Todo el resto de la app depende de esta interfaz, nunca de un proveedor
 * concreto. Hoy hay dos implementaciones (mock y Claude); agregar otra (o
 * cambiar de modelo) no afecta a quien la consume.
 */

/** Datos que recibe el analizador para procesar una reseña. */
export interface AnalyzeInput {
  /** Texto de la reseña escrito por el usuario. */
  content: string;
  /** Título del libro reseñado (da contexto al modelo). */
  bookTitle: string;
  /** Autor del libro. */
  author: string;
}

/**
 * Analiza una reseña y devuelve un resumen, etiquetas y sentimiento.
 * La salida siempre cumple `reviewAnalysisSchema` (se valida en cada impl).
 */
export interface ReviewAnalyzer {
  analyze(input: AnalyzeInput): Promise<ReviewAnalysis>;
}
