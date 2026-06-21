import { describe, expect, it } from "vitest";
import { PAGE_BREAK } from "@/lib/pdf/extract-text";
import { isExercisePage, prepareStudyText } from "@/lib/pdf/study-text";

const PROSE =
  "La fotosíntesis es el proceso por el cual las plantas convierten la luz en energía. " +
  "Ocurre en los cloroplastos y produce glucosa y oxígeno.";

const EXERCISES = [
  "Ejercicios del capítulo",
  "1) Calculá la energía liberada.",
  "2) Explicá el rol de la clorofila.",
  "3) Resolvé el siguiente problema.",
  "4) Indicá verdadero o falso.",
].join("\n");

describe("isExercisePage", () => {
  it("detecta una página de ejercicios (encabezado + ítems numerados)", () => {
    expect(isExercisePage(EXERCISES)).toBe(true);
  });

  it("no marca prosa normal como ejercicios", () => {
    expect(isExercisePage(PROSE)).toBe(false);
  });

  it("no marca una mención suelta a 'ejercicio' sin densidad de enumeración", () => {
    expect(isExercisePage("Este ejercicio mental ayuda a entender el concepto central.")).toBe(
      false,
    );
  });
});

describe("prepareStudyText", () => {
  it("descarta las páginas de ejercicios y conserva la prosa", () => {
    const raw = [PROSE, EXERCISES].join(PAGE_BREAK);
    const result = prepareStudyText(raw);

    expect(result.totalPages).toBe(2);
    expect(result.usedPages).toBe(1);
    expect(result.droppedPages).toBe(1);
    expect(result.text).toContain("fotosíntesis");
    expect(result.text).not.toContain("Calculá la energía");
  });

  it("si todas las páginas son ejercicios, no deja a la IA sin material (fallback)", () => {
    const raw = [EXERCISES, EXERCISES].join(PAGE_BREAK);
    const result = prepareStudyText(raw);
    expect(result.usedPages).toBe(2);
    expect(result.text.length).toBeGreaterThan(0);
  });

  it("recorta al presupuesto de caracteres sin partir una palabra", () => {
    const raw = "palabra ".repeat(200).trim();
    const result = prepareStudyText(raw, { maxChars: 50 });
    expect(result.truncated).toBe(true);
    expect(result.text.length).toBeLessThanOrEqual(50);
    expect(result.text.endsWith("palabra")).toBe(true);
  });

  it("normaliza el espacio en blanco de más", () => {
    const result = prepareStudyText("Hola    mundo\n\n\n\nadiós");
    expect(result.text).toBe("Hola mundo\n\nadiós");
  });
});
