import { createWriteStream, mkdirSync } from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";

export const FIXTURE_PDF = path.join(__dirname, "fixtures", "apunte.pdf");

// Página de prosa (se resume / mapea) + página de ejercicios (debe descartarse).
const PROSE =
  "La fotosintesis es el proceso por el cual las plantas convierten la luz solar en energia quimica. " +
  "Ocurre en los cloroplastos, donde la clorofila capta la luz. El resultado es glucosa y oxigeno.";
const EXERCISES = [
  "Ejercicios del capitulo",
  "1) Calcula la energia liberada en el proceso.",
  "2) Explica el rol de la clorofila.",
  "3) Resuelve el siguiente problema de balance.",
  "4) Indica verdadero o falso en cada caso.",
].join("\n");

function makeFixturePdf(file: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const stream = createWriteStream(file);
    stream.on("finish", () => resolve());
    stream.on("error", reject);
    doc.pipe(stream);
    doc.fontSize(13).text(PROSE);
    doc.addPage().fontSize(13).text(EXERCISES);
    doc.end();
  });
}

export default async function globalSetup() {
  // La base e2e se migra y siembra en el comando del webServer (ver
  // playwright.config). Acá solo generamos el PDF de prueba para los documentos.
  mkdirSync(path.dirname(FIXTURE_PDF), { recursive: true });
  await makeFixturePdf(FIXTURE_PDF);
}
