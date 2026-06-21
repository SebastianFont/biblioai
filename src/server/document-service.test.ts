import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/db/client", () => ({
  prisma: {
    book: { findFirst: vi.fn() },
    document: {
      create: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db/client";
import { addDocument, deleteDocument, reanalyzeDocument } from "@/server/document-service";
import { BadRequestError, NotFoundError } from "@/server/errors";
import type { DocumentAnalyzer } from "@/lib/ai";
import type { DocumentAnalysis } from "@/lib/validators/document";

const findBook = prisma.book.findFirst as Mock;
const create = prisma.document.create as Mock;
const update = prisma.document.update as Mock;
const findDoc = prisma.document.findFirst as Mock;
const deleteDoc = prisma.document.delete as Mock;

const USER = "user_1";
const BOOK = "book_1";
const DOC = "doc_1";
const DATA = new Uint8Array([1, 2, 3]);
const BOTH = { summary: true, conceptMap: true };

const CONCEPT_MAP = {
  central: "Tema",
  concepts: [{ name: "Idea", description: "Una idea.", connections: [] }],
};
const ANALYSIS = { summary: "Resumen del documento.", conceptMap: CONCEPT_MAP };

/** Analizador de prueba que devuelve un análisis fijo (no llama a la IA real). */
function fakeAnalyzer(result: DocumentAnalysis = ANALYSIS): DocumentAnalyzer {
  return { analyze: vi.fn().mockResolvedValue(result) };
}

beforeEach(() => {
  vi.clearAllMocks();
  findBook.mockResolvedValue({ id: BOOK, title: "El libro" });
  create.mockResolvedValue({ id: DOC, filename: "apunte.pdf" });
  update.mockResolvedValue({ id: DOC, filename: "apunte.pdf", aiSummary: ANALYSIS.summary });
  findDoc.mockResolvedValue({ id: DOC, filename: "apunte.pdf", text: "Contenido del PDF" });
  deleteDoc.mockResolvedValue({ id: DOC });
});

describe("addDocument", () => {
  it("rechaza si el libro no es del usuario y no extrae ni guarda", async () => {
    findBook.mockResolvedValue(null);
    const extractor = vi.fn();
    await expect(
      addDocument(USER, BOOK, { filename: "x.pdf", data: DATA }, BOTH, extractor, fakeAnalyzer()),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(extractor).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it("falla si el PDF no tiene texto extraíble", async () => {
    const extractor = vi.fn().mockResolvedValue({ text: "", pageCount: 2 });
    await expect(
      addDocument(
        USER,
        BOOK,
        { filename: "scan.pdf", data: DATA },
        BOTH,
        extractor,
        fakeAnalyzer(),
      ),
    ).rejects.toBeInstanceOf(BadRequestError);
    expect(create).not.toHaveBeenCalled();
  });

  it("extrae el texto, guarda el documento y lo enriquece con IA", async () => {
    const extractor = vi.fn().mockResolvedValue({ text: "Contenido del PDF", pageCount: 3 });
    const analyzer = fakeAnalyzer();
    await addDocument(
      USER,
      BOOK,
      { filename: "apunte.pdf", data: DATA },
      BOTH,
      extractor,
      analyzer,
    );

    expect(extractor).toHaveBeenCalledWith(DATA);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { filename: "apunte.pdf", text: "Contenido del PDF", pageCount: 3, bookId: BOOK },
      }),
    );
    // El analizador recibe las opciones y el texto preprocesado.
    expect(analyzer.analyze).toHaveBeenCalledWith(
      expect.objectContaining({ bookTitle: "El libro", filename: "apunte.pdf", generate: BOTH }),
    );
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { aiSummary: ANALYSIS.summary, aiConceptMap: JSON.stringify(CONCEPT_MAP) },
      }),
    );
  });

  it("guarda solo el resumen cuando es lo único pedido (no toca el mapa)", async () => {
    const extractor = vi.fn().mockResolvedValue({ text: "Contenido del PDF", pageCount: 3 });
    const analyzer = fakeAnalyzer({ summary: ANALYSIS.summary });
    await addDocument(
      USER,
      BOOK,
      { filename: "apunte.pdf", data: DATA },
      { summary: true, conceptMap: false },
      extractor,
      analyzer,
    );

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { aiSummary: ANALYSIS.summary } }),
    );
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
      BOTH,
      extractor,
      analyzer,
    );

    expect(create).toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    expect(result).toEqual({ id: DOC, filename: "apunte.pdf" });
  });
});

describe("reanalyzeDocument", () => {
  it("rechaza si el documento no pertenece al libro", async () => {
    findDoc.mockResolvedValue(null);
    await expect(reanalyzeDocument(USER, BOOK, DOC, BOTH, fakeAnalyzer())).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect(update).not.toHaveBeenCalled();
  });

  it("regenera y guarda solo lo pedido", async () => {
    const analyzer = fakeAnalyzer({ conceptMap: CONCEPT_MAP });
    await reanalyzeDocument(USER, BOOK, DOC, { summary: false, conceptMap: true }, analyzer);

    expect(analyzer.analyze).toHaveBeenCalledWith(
      expect.objectContaining({ generate: { summary: false, conceptMap: true } }),
    );
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { aiConceptMap: JSON.stringify(CONCEPT_MAP) } }),
    );
  });

  it("propaga el error de la IA (acá la IA es el objetivo, no un extra)", async () => {
    const failing: DocumentAnalyzer = { analyze: vi.fn().mockRejectedValue(new Error("IA caída")) };
    await expect(reanalyzeDocument(USER, BOOK, DOC, BOTH, failing)).rejects.toThrow("IA caída");
    expect(update).not.toHaveBeenCalled();
  });
});

describe("deleteDocument", () => {
  it("elimina cuando el documento pertenece al libro del usuario", async () => {
    await deleteDocument(USER, BOOK, DOC);
    expect(deleteDoc).toHaveBeenCalledWith({ where: { id: DOC } });
  });

  it("no elimina si el documento no pertenece al libro", async () => {
    findDoc.mockResolvedValue(null);
    await expect(deleteDocument(USER, BOOK, DOC)).rejects.toBeInstanceOf(NotFoundError);
    expect(deleteDoc).not.toHaveBeenCalled();
  });
});
