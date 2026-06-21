import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/db/client", () => ({
  prisma: {
    book: { findFirst: vi.fn(), update: vi.fn() },
    review: {
      create: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { prisma } from "@/lib/db/client";
import { addReview, deleteReview, updateReview as updateReviewSvc } from "@/server/review-service";
import { NotFoundError } from "@/server/errors";
import type { ReviewAnalyzer } from "@/lib/ai";

const findFirst = prisma.book.findFirst as Mock;
const createReview = prisma.review.create as Mock;
const updateReview = prisma.review.update as Mock;
const findFirstReview = prisma.review.findFirst as Mock;
const deleteReviewDb = prisma.review.delete as Mock;
const updateBook = prisma.book.update as Mock;
const transaction = prisma.$transaction as Mock;

const USER = "user_1";
const BOOK = "book_1";
const REVIEW = "rev_1";

// Analizador de prueba: no toca ninguna IA real.
function analyzerReturning(tags: string[]): ReviewAnalyzer {
  return {
    analyze: vi.fn().mockResolvedValue({ summary: "resumen", tags, sentiment: "POSITIVE" }),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  findFirst.mockResolvedValue({ id: BOOK, title: "Libro", author: "Autor" });
  createReview.mockResolvedValue({ id: "rev_1", content: "Buenísimo", bookId: BOOK });
});

describe("addReview", () => {
  it("rechaza si el libro no es del usuario y no crea la reseña", async () => {
    findFirst.mockResolvedValue(null);
    await expect(addReview(USER, BOOK, { content: "Hola" })).rejects.toBeInstanceOf(NotFoundError);
    expect(createReview).not.toHaveBeenCalled();
  });

  it("crea la reseña, la enriquece con IA y propaga las etiquetas al libro", async () => {
    const enriched = { id: "rev_1", aiSummary: "resumen", aiSentiment: "POSITIVE" };
    transaction.mockResolvedValue([enriched, {}]);
    const analyzer = analyzerReturning(["Fantasía"]);

    const result = await addReview(USER, BOOK, { content: "Buenísimo" }, analyzer);

    expect(analyzer.analyze).toHaveBeenCalledWith(
      expect.objectContaining({ content: "Buenísimo", bookTitle: "Libro", author: "Autor" }),
    );
    expect(updateReview).toHaveBeenCalledWith(
      expect.objectContaining({ data: { aiSummary: "resumen", aiSentiment: "POSITIVE" } }),
    );
    expect(updateBook).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          tags: {
            connectOrCreate: [{ where: { name: "Fantasía" }, create: { name: "Fantasía" } }],
          },
        },
      }),
    );
    expect(result).toEqual(enriched);
  });

  it("degrada con elegancia: si la IA falla, devuelve la reseña ya guardada", async () => {
    const failing: ReviewAnalyzer = { analyze: vi.fn().mockRejectedValue(new Error("sin red")) };

    const result = await addReview(USER, BOOK, { content: "Buenísimo" }, failing);

    expect(result).toEqual({ id: "rev_1", content: "Buenísimo", bookId: BOOK });
    expect(transaction).not.toHaveBeenCalled();
  });
});

describe("updateReview", () => {
  beforeEach(() => {
    findFirstReview.mockResolvedValue({ id: REVIEW });
    updateReview.mockResolvedValue({ id: REVIEW, content: "Editada" });
  });

  it("rechaza si la reseña no pertenece al libro", async () => {
    findFirstReview.mockResolvedValue(null);
    await expect(updateReviewSvc(USER, BOOK, REVIEW, { content: "X" })).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect(updateReview).not.toHaveBeenCalled();
  });

  it("re-analiza con IA cuando cambia el contenido", async () => {
    const enriched = { id: REVIEW, aiSummary: "nuevo", aiSentiment: "POSITIVE" };
    transaction.mockResolvedValue([enriched, {}]);
    const analyzer = analyzerReturning(["Drama"]);

    const result = await updateReviewSvc(USER, BOOK, REVIEW, { content: "Editada" }, analyzer);

    expect(updateReview).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: REVIEW }, data: { content: "Editada" } }),
    );
    expect(analyzer.analyze).toHaveBeenCalledWith(
      expect.objectContaining({ content: "Editada", bookTitle: "Libro" }),
    );
    expect(result).toEqual(enriched);
  });

  it("no gasta IA si solo cambia la puntuación (sin contenido nuevo)", async () => {
    const analyzer = analyzerReturning(["Drama"]);
    const result = await updateReviewSvc(USER, BOOK, REVIEW, { rating: 4 }, analyzer);

    expect(updateReview).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: REVIEW }, data: { rating: 4 } }),
    );
    expect(analyzer.analyze).not.toHaveBeenCalled();
    expect(transaction).not.toHaveBeenCalled();
    expect(result).toEqual({ id: REVIEW, content: "Editada" });
  });
});

describe("deleteReview", () => {
  it("elimina cuando la reseña pertenece al libro del usuario", async () => {
    findFirstReview.mockResolvedValue({ id: REVIEW });
    await deleteReview(USER, BOOK, REVIEW);
    expect(deleteReviewDb).toHaveBeenCalledWith({ where: { id: REVIEW } });
  });

  it("no elimina si la reseña no pertenece al libro", async () => {
    findFirstReview.mockResolvedValue(null);
    await expect(deleteReview(USER, BOOK, REVIEW)).rejects.toBeInstanceOf(NotFoundError);
    expect(deleteReviewDb).not.toHaveBeenCalled();
  });

  it("no elimina si el libro no es del usuario", async () => {
    findFirst.mockResolvedValue(null);
    await expect(deleteReview(USER, BOOK, REVIEW)).rejects.toBeInstanceOf(NotFoundError);
    expect(deleteReviewDb).not.toHaveBeenCalled();
  });
});
