import { z } from "zod";

/** Restricciones de subida de documentos PDF. */
export const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10 MB
export const PDF_MIME = "application/pdf";

export const documentFilenameSchema = z
  .string()
  .trim()
  .min(1, "Nombre de archivo inválido")
  .max(255);
