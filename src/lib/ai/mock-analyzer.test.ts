import { describe, expect, it } from "vitest";
import { mockAnalyzer } from "@/lib/ai/mock-analyzer";
import { reviewAnalysisSchema } from "@/lib/validators/review";

const base = { bookTitle: "Dungeon Crawler Carl", author: "Matt Dinniman" };

describe("mockAnalyzer", () => {
  it("produce una salida que cumple el contrato (reviewAnalysisSchema)", async () => {
    const result = await mockAnalyzer.analyze({ ...base, content: "Me encanta, es brillante." });
    expect(reviewAnalysisSchema.safeParse(result).success).toBe(true);
  });

  it("detecta sentimiento positivo", async () => {
    const { sentiment } = await mockAnalyzer.analyze({
      ...base,
      content: "Me encanta, recomiendo.",
    });
    expect(sentiment).toBe("POSITIVE");
  });

  it("detecta sentimiento mixto cuando hay señales en ambos sentidos", async () => {
    const { sentiment } = await mockAnalyzer.analyze({
      ...base,
      content: "Es brillante pero por momentos lento.",
    });
    expect(sentiment).toBe("MIXED");
  });

  it("es determinista: misma entrada, misma salida", async () => {
    const input = { ...base, content: "Fantasía épica con mucho humor." };
    const a = await mockAnalyzer.analyze(input);
    const b = await mockAnalyzer.analyze(input);
    expect(a).toEqual(b);
  });

  it("deriva etiquetas del contenido y cae en 'General' si no hay coincidencias", async () => {
    const withTags = await mockAnalyzer.analyze({ ...base, content: "Pura fantasía y humor." });
    expect(withTags.tags).toContain("Fantasía");

    const noTags = await mockAnalyzer.analyze({ ...base, content: "Estuvo correcto nomás." });
    expect(noTags.tags).toEqual(["General"]);
  });
});
