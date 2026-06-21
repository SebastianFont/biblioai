import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/db/client", () => ({
  prisma: {
    book: { findFirst: vi.fn() },
    document: { create: vi.fn(), findMany: vi.fn() },
  },
}));

import { prisma } from "@/lib/db/client";
import { addDocument } from "@/server/document-service";
import { BadRequestError, NotFoundError } from "@/server/errors";

const findFirst = prisma.book.findFirst as Mock;
const create = prisma.document.create as Mock;

const USER = "user_1";
const BOOK = "book_1";
const DATA = new Uint8Array([1, 2, 3]);

beforeEach(() => {
  vi.clearAllMocks();
  findFirst.mockResolvedValue({ id: BOOK });
  create.mockResolvedValue({ id: "doc_1", filename: "apunte.pdf" });
});

describe("addDocument", () => {
  it("rechaza si el libro no es del usuario y no extrae ni guarda", async () => {
    findFirst.mockResolvedValue(null);
    const extractor = vi.fn();
    await expect(
      addDocument(USER, BOOK, { filename: "x.pdf", data: DATA }, extractor),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(extractor).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it("falla si el PDF no tiene texto extraíble", async () => {
    const extractor = vi.fn().mockResolvedValue({ text: "", pageCount: 2 });
    await expect(
      addDocument(USER, BOOK, { filename: "scan.pdf", data: DATA }, extractor),
    ).rejects.toBeInstanceOf(BadRequestError);
    expect(create).not.toHaveBeenCalled();
  });

  it("extrae el texto y guarda el documento", async () => {
    const extractor = vi.fn().mockResolvedValue({ text: "Contenido del PDF", pageCount: 3 });
    const result = await addDocument(USER, BOOK, { filename: "apunte.pdf", data: DATA }, extractor);

    expect(extractor).toHaveBeenCalledWith(DATA);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { filename: "apunte.pdf", text: "Contenido del PDF", pageCount: 3, bookId: BOOK },
      }),
    );
    expect(result).toEqual({ id: "doc_1", filename: "apunte.pdf" });
  });
});
