import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

// Mockeamos el cliente de Prisma: los tests no tocan una base real, solo
// verifican que el service consulta con los filtros correctos y aplica las
// reglas de negocio (pertenencia, errores de dominio).
vi.mock("@/lib/db/client", () => ({
  prisma: {
    book: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db/client";
import { createBook, deleteBook, getBook, listBooks, updateBook } from "@/server/book-service";
import { NotFoundError } from "@/server/errors";

const findMany = prisma.book.findMany as Mock;
const findFirst = prisma.book.findFirst as Mock;
const create = prisma.book.create as Mock;
const update = prisma.book.update as Mock;
const del = prisma.book.delete as Mock;

const USER = "user_1";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("listBooks", () => {
  it("filtra por el usuario dueño", async () => {
    findMany.mockResolvedValue([]);
    await listBooks(USER);
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { ownerId: USER } }));
  });
});

describe("getBook", () => {
  it("devuelve el libro cuando pertenece al usuario", async () => {
    findFirst.mockResolvedValue({ id: "book_1", ownerId: USER });
    const book = await getBook(USER, "book_1");
    expect(book).toEqual({ id: "book_1", ownerId: USER });
  });

  it("lanza NotFoundError cuando no existe o es de otro usuario", async () => {
    findFirst.mockResolvedValue(null);
    await expect(getBook(USER, "book_x")).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("createBook", () => {
  it("asigna el ownerId del usuario", async () => {
    create.mockResolvedValue({ id: "book_1" });
    await createBook(USER, { title: "Libro", author: "Autor" });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { title: "Libro", author: "Autor", ownerId: USER },
      }),
    );
  });
});

describe("updateBook", () => {
  it("no actualiza si el libro no es del usuario", async () => {
    findFirst.mockResolvedValue(null);
    await expect(updateBook(USER, "book_x", { title: "X" })).rejects.toBeInstanceOf(NotFoundError);
    expect(update).not.toHaveBeenCalled();
  });

  it("actualiza cuando el libro pertenece al usuario", async () => {
    findFirst.mockResolvedValue({ id: "book_1" });
    update.mockResolvedValue({ id: "book_1", title: "X" });
    await updateBook(USER, "book_1", { title: "X" });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "book_1" }, data: { title: "X" } }),
    );
  });
});

describe("deleteBook", () => {
  it("no elimina si el libro no es del usuario", async () => {
    findFirst.mockResolvedValue(null);
    await expect(deleteBook(USER, "book_x")).rejects.toBeInstanceOf(NotFoundError);
    expect(del).not.toHaveBeenCalled();
  });
});
