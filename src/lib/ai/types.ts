import type { ReviewAnalysis } from "@/lib/validators/review";
import type { DocumentAnalysis, GenerateOptions } from "@/lib/validators/document";

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

/** Datos que recibe el analizador para procesar un documento (PDF). */
export interface AnalyzeDocumentInput {
  /** Texto del documento, ya preprocesado para estudio (sin ejercicios, acotado). */
  text: string;
  /** Título del libro al que pertenece el documento (da contexto al modelo). */
  bookTitle: string;
  /** Nombre del archivo (puede orientar sobre el tema: «Capítulo 3», etc.). */
  filename: string;
  /** Qué partes generar. El analizador produce solo lo pedido (menos tokens). */
  generate: GenerateOptions;
}

/**
 * Analiza un documento de estudio y devuelve el resumen y/o el mapa conceptual
 * según lo pedido en `generate`. La salida siempre cumple `documentAnalysisSchema`.
 */
export interface DocumentAnalyzer {
  analyze(input: AnalyzeDocumentInput): Promise<DocumentAnalysis>;
}
