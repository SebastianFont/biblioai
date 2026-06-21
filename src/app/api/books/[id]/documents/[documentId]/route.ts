import { bookIdSchema } from "@/lib/validators/book";
import { documentIdSchema, generateOptionsSchema } from "@/lib/validators/document";
import { getCurrentUserId } from "@/server/current-user";
import { deleteDocument, reanalyzeDocument } from "@/server/document-service";
import { handleRoute, json, parseBody, parseParam } from "@/server/http";

type Context = { params: Promise<{ id: string; documentId: string }> };

// POST /api/books/:id/documents/:documentId — re-procesa el documento
// (regenera el resumen y/o el mapa conceptual según el body `{ summary, conceptMap }`).
export function POST(request: Request, { params }: Context) {
  return handleRoute(async () => {
    const userId = await getCurrentUserId();
    const { id, documentId } = await params;
    const bookId = parseParam(id, bookIdSchema);
    const docId = parseParam(documentId, documentIdSchema);
    const generate = await parseBody(request, generateOptionsSchema);
    return json(await reanalyzeDocument(userId, bookId, docId, generate));
  });
}

// DELETE /api/books/:id/documents/:documentId — elimina un documento.
export function DELETE(_request: Request, { params }: Context) {
  return handleRoute(async () => {
    const userId = await getCurrentUserId();
    const { id, documentId } = await params;
    const bookId = parseParam(id, bookIdSchema);
    const docId = parseParam(documentId, documentIdSchema);
    await deleteDocument(userId, bookId, docId);
    return new Response(null, { status: 204 });
  });
}
