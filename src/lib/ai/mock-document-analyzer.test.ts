import { describe, expect, it } from "vitest";
import { mockDocumentAnalyzer } from "@/lib/ai/mock-document-analyzer";
import { documentAnalysisSchema } from "@/lib/validators/document";

const base = { bookTitle: "Estructuras de datos", filename: "capitulo-1.pdf" };
const BOTH = { summary: true, conceptMap: true };

const SAMPLE_TEXT = [
  "Una pila es una estructura de datos lineal que sigue el principio LIFO.",
  "La cola sigue el principio FIFO y se usa en algoritmos de recorrido.",
  "Los árboles permiten representar jerarquías y búsquedas eficientes.",
].join(" ");

describe("mockDocumentAnalyzer", () => {
  it("produce una salida que cumple el contrato (documentAnalysisSchema)", async () => {
    const result = await mockDocumentAnalyzer.analyze({
      ...base,
      text: SAMPLE_TEXT,
      generate: BOTH,
    });
    expect(documentAnalysisSchema.safeParse(result).success).toBe(true);
  });

  it("es determinista: misma entrada, misma salida", async () => {
    const input = { ...base, text: SAMPLE_TEXT, generate: BOTH };
    const a = await mockDocumentAnalyzer.analyze(input);
    const b = await mockDocumentAnalyzer.analyze(input);
    expect(a).toEqual(b);
  });

  it("genera solo el resumen cuando es lo único pedido", async () => {
    const result = await mockDocumentAnalyzer.analyze({
      ...base,
      text: SAMPLE_TEXT,
      generate: { summary: true, conceptMap: false },
    });
    expect(result.summary).toBeTruthy();
    expect(result.conceptMap).toBeUndefined();
  });

  it("genera solo el mapa conceptual cuando es lo único pedido", async () => {
    const result = await mockDocumentAnalyzer.analyze({
      ...base,
      text: SAMPLE_TEXT,
      generate: { summary: false, conceptMap: true },
    });
    expect(result.summary).toBeUndefined();
    expect(result.conceptMap?.central).toBe(base.bookTitle);
  });

  it("cumple el contrato aun con texto pobre (un solo término)", async () => {
    const result = await mockDocumentAnalyzer.analyze({
      ...base,
      text: "ok ok ok",
      generate: BOTH,
    });
    expect(documentAnalysisSchema.safeParse(result).success).toBe(true);
    expect(result.conceptMap?.concepts.length).toBeGreaterThanOrEqual(1);
  });
});
