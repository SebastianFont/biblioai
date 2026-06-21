import { prisma } from "@/lib/db/client";
import { extractPdfText, type PdfTextExtractor } from "@/lib/pdf/extract-text";
import { prepareStudyText } from "@/lib/pdf/study-text";
import { getDocumentAnalyzer, type DocumentAnalyzer } from "@/lib/ai";
import { BadRequestError, NotFoundError } from "@/server/errors";
import { documentFilenameSchema, type DocumentAnalysis } from "@/lib/validators/document";
import type { GenerateOptions } from "@/lib/validators/document";

/**
 * Lógica de negocio de documentos (PDFs) asociados a un libro.
 *
 * Al subir un PDF se extrae su texto, se guarda y se lo enriquece con la capa de
 * IA: un resumen y/o un mapa conceptual (lo que el usuario elija) para estudiar.
 * Antes de llamar a la IA, el texto se preprocesa (se descartan ejercicios y se
 * acota) para reducir tokens y latencia.
 *
 * El extractor y el analizador se reciben por parámetro (inyección de
 * dependencia) para testear sin procesar PDFs reales ni llamar a la IA.
 */

// Campos que se exponen del documento (nunca el texto completo, que es pesado).
const DOCUMENT_SELECT = {
  id: true,
  filename: true,
  pageCount: true,
  aiSummary: true,
  aiConceptMap: true,
  createdAt: true,
} as const;

/** Mapea el análisis a columnas, incluyendo solo lo que efectivamente se generó. */
function analysisUpdateData(analysis: DocumentAnalysis): {
  aiSummary?: string;
  aiConceptMap?: string;
} {
  const data: { aiSummary?: string; aiConceptMap?: string } = {};
  if (analysis.summary !== undefined) data.aiSummary = analysis.summary;
  if (analysis.conceptMap !== undefined) data.aiConceptMap = JSON.stringify(analysis.conceptMap);
  return data;
}

interface AddDocumentInput {
  filename: string;
  data: Uint8Array;
}

export async function addDocument(
  userId: string,
  bookId: string,
  input: AddDocumentInput,
  generate: GenerateOptions,
  extractor: PdfTextExtractor = extractPdfText,
  analyzer: DocumentAnalyzer = getDocumentAnalyzer(),
) {
  const book = await getOwnedBook(userId, bookId);
  const filename = documentFilenameSchema.parse(input.filename);

  const { text, pageCount } = await extractor(input.data);
  if (!text) {
    throw new BadRequestError(
      "No se pudo extraer texto del PDF (puede ser un PDF escaneado sin texto).",
    );
  }

  // Se guarda primero con el texto crudo extraído (registro fiel). Así, si la IA
  // falla, no perdemos el documento (degradación elegante, igual que reseñas).
  const document = await prisma.document.create({
    data: { filename, text, pageCount, bookId },
    select: DOCUMENT_SELECT,
  });

  try {
    const study = prepareStudyText(text);
    const analysis = await analyzer.analyze({
      text: study.text,
      bookTitle: book.title,
      filename,
      generate,
    });
    return prisma.document.update({
      where: { id: document.id },
      data: analysisUpdateData(analysis),
      select: DOCUMENT_SELECT,
    });
  } catch (error) {
    // La IA es un "extra": si falla, el documento ya quedó guardado.
    console.error("No se pudo analizar el documento con IA:", error);
    return document;
  }
}

/** Lista los documentos de un libro (metadatos + IA, sin el texto completo). */
export async function listDocuments(userId: string, bookId: string) {
  await assertBookOwnership(userId, bookId);
  return prisma.document.findMany({
    where: { bookId },
    orderBy: { createdAt: "desc" },
    select: DOCUMENT_SELECT,
  });
}

/**
 * Vuelve a generar el resumen y/o el mapa conceptual de un documento ya subido,
 * según lo pedido en `generate`. Útil si falló la IA al subirlo, si se cambió de
 * proveedor/modelo, o si ahora se quiere también la parte que no se generó.
 * Reutiliza el texto ya extraído (no reprocesa el PDF) y solo pisa las columnas
 * que se regeneran (si pedís solo el resumen, el mapa conceptual queda intacto).
 */
export async function reanalyzeDocument(
  userId: string,
  bookId: string,
  documentId: string,
  generate: GenerateOptions,
  analyzer: DocumentAnalyzer = getDocumentAnalyzer(),
) {
  const book = await getOwnedBook(userId, bookId);
  const document = await prisma.document.findFirst({
    where: { id: documentId, bookId },
    select: { id: true, filename: true, text: true },
  });
  if (!document) {
    throw new NotFoundError("Documento no encontrado");
  }

  // A diferencia de la subida, acá la IA es el objetivo: si falla, se propaga
  // el error para que la UI lo muestre (no hay nada nuevo que "preservar").
  const study = prepareStudyText(document.text);
  const analysis = await analyzer.analyze({
    text: study.text,
    bookTitle: book.title,
    filename: document.filename,
    generate,
  });
  return prisma.document.update({
    where: { id: document.id },
    data: analysisUpdateData(analysis),
    select: DOCUMENT_SELECT,
  });
}

/** Elimina un documento del usuario (verifica pertenencia primero). */
export async function deleteDocument(
  userId: string,
  bookId: string,
  documentId: string,
): Promise<void> {
  await assertBookOwnership(userId, bookId);
  const document = await prisma.document.findFirst({
    where: { id: documentId, bookId },
    select: { id: true },
  });
  if (!document) {
    throw new NotFoundError("Documento no encontrado");
  }
  await prisma.document.delete({ where: { id: document.id } });
}

/** Devuelve el libro si pertenece al usuario (con los datos que la IA necesita). */
async function getOwnedBook(userId: string, bookId: string) {
  const book = await prisma.book.findFirst({
    where: { id: bookId, ownerId: userId },
    select: { id: true, title: true },
  });
  if (!book) {
    throw new NotFoundError("Libro no encontrado");
  }
  return book;
}

async function assertBookOwnership(userId: string, bookId: string): Promise<void> {
  const owned = await prisma.book.findFirst({
    where: { id: bookId, ownerId: userId },
    select: { id: true },
  });
  if (!owned) {
    throw new NotFoundError("Libro no encontrado");
  }
}
