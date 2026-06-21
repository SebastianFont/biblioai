import { prisma } from "@/lib/db/client";
import { extractPdfText, type PdfTextExtractor } from "@/lib/pdf/extract-text";
import { getDocumentAnalyzer, type DocumentAnalyzer } from "@/lib/ai";
import { BadRequestError, NotFoundError } from "@/server/errors";
import { documentFilenameSchema } from "@/lib/validators/document";

/**
 * Lógica de negocio de documentos (PDFs) asociados a un libro.
 *
 * Al subir un PDF se extrae su texto, se guarda y se lo enriquece con la capa de
 * IA: un resumen y un mapa conceptual para estudiar.
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

interface AddDocumentInput {
  filename: string;
  data: Uint8Array;
}

export async function addDocument(
  userId: string,
  bookId: string,
  input: AddDocumentInput,
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

  // Se guarda primero con el texto extraído. Así, si la IA falla, no perdemos el
  // documento (degradación elegante, igual que con las reseñas).
  const document = await prisma.document.create({
    data: { filename, text, pageCount, bookId },
    select: DOCUMENT_SELECT,
  });

  try {
    const analysis = await analyzer.analyze({ text, bookTitle: book.title, filename });
    return prisma.document.update({
      where: { id: document.id },
      data: {
        aiSummary: analysis.summary,
        aiConceptMap: JSON.stringify(analysis.conceptMap),
      },
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
