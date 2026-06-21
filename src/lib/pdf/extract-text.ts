/**
 * Extracción de texto de PDFs.
 *
 * Aislada acá detrás de una función simple para que el resto de la app no
 * dependa de la librería concreta (`unpdf`) y para poder mockearla en tests.
 * Se importa de forma diferida: solo se carga cuando realmente se procesa un PDF.
 */

export interface ExtractedPdf {
  text: string;
  pageCount: number;
}

export type PdfTextExtractor = (data: Uint8Array) => Promise<ExtractedPdf>;

/** Separador de página en el texto extraído (form feed). Permite, más tarde,
 * descartar páginas que no aportan al estudio (p. ej. ejercicios). */
export const PAGE_BREAK = "\f";

export const extractPdfText: PdfTextExtractor = async (data) => {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(data);
  // mergePages:false devuelve el texto por página; conservamos los límites
  // uniéndolos con PAGE_BREAK para poder filtrar páginas después.
  const { totalPages, text } = await extractText(pdf, { mergePages: false });
  const pages = Array.isArray(text) ? text : [text];
  return { text: pages.join(PAGE_BREAK).trim(), pageCount: totalPages };
};
