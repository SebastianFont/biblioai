import { prisma } from "@/lib/db/client";
import { extractPdfText, type PdfTextExtractor } from "@/lib/pdf/extract-text";
import { BadRequestError, NotFoundError } from "@/server/errors";
import { documentFilenameSchema } from "@/lib/validators/document";

/**
 * Lógica de negocio de documentos (PDFs) asociados a un libro.
 *
 * Al subir un PDF se extrae su texto y se guarda. Ese texto es la base para el
 * resumen y el mapa conceptual que genera la IA (etapa siguiente).
 *
 * El extractor se recibe por parámetro (inyección de dependencia) para testear
 * sin procesar PDFs reales.
 */

interface AddDocumentInput {
  filename: string;
  data: Uint8Array;
}

export async function addDocument(
  userId: string,
  bookId: string,
  input: AddDocumentInput,
  extractor: PdfTextExtractor = extractPdfText,
) {
  await assertBookOwnership(userId, bookId);
  const filename = documentFilenameSchema.parse(input.filename);

  const { text, pageCount } = await extractor(input.data);
  if (!text) {
    throw new BadRequestError(
      "No se pudo extraer texto del PDF (puede ser un PDF escaneado sin texto).",
    );
  }

  return prisma.document.create({
    data: { filename, text, pageCount, bookId },
    select: { id: true, filename: true, pageCount: true, createdAt: true },
  });
}

/** Lista los documentos de un libro (metadatos, sin el texto completo). */
export async function listDocuments(userId: string, bookId: string) {
  await assertBookOwnership(userId, bookId);
  return prisma.document.findMany({
    where: { bookId },
    orderBy: { createdAt: "desc" },
    select: { id: true, filename: true, pageCount: true, createdAt: true },
  });
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
