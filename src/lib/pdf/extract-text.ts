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

export const extractPdfText: PdfTextExtractor = async (data) => {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(data);
  const { totalPages, text } = await extractText(pdf, { mergePages: true });
  return { text: text.trim(), pageCount: totalPages };
};
