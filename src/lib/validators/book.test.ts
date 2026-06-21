import { describe, expect, it } from "vitest";
import { bookIdSchema, createBookSchema, updateBookSchema } from "@/lib/validators/book";

describe("createBookSchema", () => {
  it("acepta un libro válido y recorta espacios", () => {
    const result = createBookSchema.parse({
      title: "  Dungeon Crawler Carl  ",
      author: "Matt Dinniman",
    });
    expect(result.title).toBe("Dungeon Crawler Carl");
    expect(result.author).toBe("Matt Dinniman");
  });

  it("rechaza un título vacío", () => {
    const result = createBookSchema.safeParse({ title: "   ", author: "Alguien" });
    expect(result.success).toBe(false);
  });

  it("rechaza una portada que no es URL", () => {
    const result = createBookSchema.safeParse({
      title: "Libro",
      author: "Autor",
      coverUrl: "no-es-una-url",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateBookSchema", () => {
  it("acepta una actualización parcial", () => {
    const result = updateBookSchema.safeParse({ title: "Nuevo título" });
    expect(result.success).toBe(true);
  });

  it("rechaza un objeto vacío (no hay nada para actualizar)", () => {
    const result = updateBookSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("bookIdSchema", () => {
  it("rechaza un id que no es cuid", () => {
    expect(bookIdSchema.safeParse("123").success).toBe(false);
  });
});
