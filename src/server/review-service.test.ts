import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/db/client", () => ({
  prisma: {
    book: { findFirst: vi.fn(), update: vi.fn() },
    review: { create: vi.fn(), update: vi.fn(), findMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { prisma } from "@/lib/db/client";
import { addReview } from "@/server/review-service";
import { NotFoundError } from "@/server/errors";
import type { ReviewAnalyzer } from "@/lib/ai";

const findFirst = prisma.book.findFirst as Mock;
const createReview = prisma.review.create as Mock;
const updateReview = prisma.review.update as Mock;
const updateBook = prisma.book.update as Mock;
const transaction = prisma.$transaction as Mock;

const USER = "user_1";
const BOOK = "book_1";

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
