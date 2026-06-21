import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/db/client", () => ({
  prisma: {
    book: { findFirst: vi.fn() },
    document: { create: vi.fn(), update: vi.fn(), findMany: vi.fn() },
  },
}));

import { prisma } from "@/lib/db/client";
import { addDocument } from "@/server/document-service";
import { BadRequestError, NotFoundError } from "@/server/errors";
import type { DocumentAnalyzer } from "@/lib/ai";

const findFirst = prisma.book.findFirst as Mock;
const create = prisma.document.create as Mock;
const update = prisma.document.update as Mock;

const USER = "user_1";
const BOOK = "book_1";
const DATA = new Uint8Array([1, 2, 3]);

const ANALYSIS = {
  summary: "Resumen del documento.",
  conceptMap: {
    central: "Tema",
    concepts: [{ name: "Idea", description: "Una idea.", connections: [] }],
  },
};

/** Analizador de prueba que devuelve un análisis fijo (no llama a la IA real). */
function fakeAnalyzer(): DocumentAnalyzer {
  return { analyze: vi.fn().mockResolvedValue(ANALYSIS) };
}

beforeEach(() => {
  vi.clearAllMocks();
  findFirst.mockResolvedValue({ id: BOOK, title: "El libro" });
  create.mockResolvedValue({ id: "doc_1", filename: "apunte.pdf" });
  update.mockResolvedValue({ id: "doc_1", filename: "apunte.pdf", aiSummary: ANALYSIS.summary });
});

describe("addDocument", () => {
  it("rechaza si el libro no es del usuario y no extrae ni guarda", async () => {
    findFirst.mockResolvedValue(null);
    const extractor = vi.fn();
    await expect(
      addDocument(USER, BOOK, { filename: "x.pdf", data: DATA }, extractor, fakeAnalyzer()),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(extractor).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it("falla si el PDF no tiene texto extraíble", async () => {
    const extractor = vi.fn().mockResolvedValue({ text: "", pageCount: 2 });
    await expect(
      addDocument(USER, BOOK, { filename: "scan.pdf", data: DATA }, extractor, fakeAnalyzer()),
    ).rejects.toBeInstanceOf(BadRequestError);
    expect(create).not.toHaveBeenCalled();
  });

  it("extrae el texto, guarda el documento y lo enriquece con IA", async () => {
    const extractor = vi.fn().mockResolvedValue({ text: "Contenido del PDF", pageCount: 3 });
    const analyzer = fakeAnalyzer();
    const result = await addDocument(
      USER,
      BOOK,
      { filename: "apunte.pdf", data: DATA },
      extractor,
      analyzer,
    );

    expect(extractor).toHaveBeenCalledWith(DATA);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { filename: "apunte.pdf", text: "Contenido del PDF", pageCount: 3, bookId: BOOK },
      }),
    );
    expect(analyzer.analyze).toHaveBeenCalledWith({
      text: "Contenido del PDF",
      bookTitle: "El libro",
      filename: "apunte.pdf",
    });
    // Guarda el análisis: resumen y mapa conceptual serializado.
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          aiSummary: ANALYSIS.summary,
          aiConceptMap: JSON.stringify(ANALYSIS.conceptMap),
        },
      }),
    );
    expect(result).toMatchObject({ id: "doc_1", aiSummary: ANALYSIS.summary });
  });

  it("si la IA falla, conserva el documento ya guardado (degradación elegante)", async () => {
    const extractor = vi.fn().mockResolvedValue({ text: "Contenido del PDF", pageCount: 3 });
    const analyzer: DocumentAnalyzer = {
      analyze: vi.fn().mockRejectedValue(new Error("IA caída")),
    };
    const result = await addDocument(
      USER,
      BOOK,
      { filename: "apunte.pdf", data: DATA },
      extractor,
      analyzer,
    );

    expect(create).toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    expect(result).toEqual({ id: "doc_1", filename: "apunte.pdf" });
  });
});
