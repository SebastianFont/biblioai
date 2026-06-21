import { bookIdSchema } from "@/lib/validators/book";
import { MAX_PDF_BYTES, PDF_MIME, generateOptionsSchema } from "@/lib/validators/document";
import { getCurrentUserId } from "@/server/current-user";
import { addDocument, listDocuments } from "@/server/document-service";
import { BadRequestError } from "@/server/errors";
import { handleRoute, json, parseParam } from "@/server/http";

type Context = { params: Promise<{ id: string }> };

// GET /api/books/:id/documents — metadatos de los PDFs del libro.
export function GET(_request: Request, { params }: Context) {
  return handleRoute(async () => {
    const userId = await getCurrentUserId();
    const bookId = parseParam((await params).id, bookIdSchema);
    return json(await listDocuments(userId, bookId));
  });
}

// POST /api/books/:id/documents — sube un PDF (multipart/form-data, campo "file").
export function POST(request: Request, { params }: Context) {
  return handleRoute(async () => {
    const userId = await getCurrentUserId();
    const bookId = parseParam((await params).id, bookIdSchema);

    const form = await request.formData().catch(() => {
      throw new BadRequestError("Se esperaba multipart/form-data");
    });
    const file = form.get("file");

    if (!(file instanceof File)) {
      throw new BadRequestError("Falta el archivo PDF (campo «file»).");
    }
    if (file.type && file.type !== PDF_MIME) {
      throw new BadRequestError("El archivo debe ser un PDF.");
    }
    if (file.size > MAX_PDF_BYTES) {
      throw new BadRequestError("El PDF supera el tamaño máximo (10 MB).");
    }

    // Qué generar viene en el mismo form (checkboxes). Por defecto ambos.
    const generate = generateOptionsSchema.parse({
      summary: form.get("summary") ?? "true",
      conceptMap: form.get("conceptMap") ?? "true",
    });

    const data = new Uint8Array(await file.arrayBuffer());
    const document = await addDocument(userId, bookId, { filename: file.name, data }, generate);
    return json(document, 201);
  });
}
