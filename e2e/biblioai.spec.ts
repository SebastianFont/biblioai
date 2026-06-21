import { test, expect, type Page } from "@playwright/test";
import { FIXTURE_PDF } from "./global-setup";

/**
 * Tests end-to-end del flujo principal de BiblioAI sobre el navegador real:
 * biblioteca + búsqueda, ciclo de vida de reseñas, y documentos de estudio
 * (subir con opciones, re-analizar, borrar). La IA corre en modo mock.
 */

// Acepta automáticamente los confirm() de las acciones de borrado.
test.beforeEach(async ({ page }) => {
  page.on("dialog", (dialog) => dialog.accept());
});

let counter = 0;
function unique(prefix: string): string {
  counter += 1;
  return `${prefix} ${Date.now()}-${counter}`;
}

/** Crea un libro desde la home y devuelve su título. */
async function createBook(page: Page, title: string, author = "Autor E2E"): Promise<void> {
  await page.goto("/");
  await page.getByPlaceholder("Dungeon Crawler Carl").fill(title);
  await page.getByPlaceholder("Matt Dinniman").fill(author);
  await page.getByRole("button", { name: "Agregar libro" }).click();
  await expect(page.getByRole("link", { name: new RegExp(escapeRegExp(title)) })).toBeVisible();
}

async function openBook(page: Page, title: string): Promise<void> {
  await page.getByRole("link", { name: new RegExp(escapeRegExp(title)) }).click();
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("biblioteca: crear, buscar y filtrar libros", async ({ page }) => {
  const title = unique("Libro Buscable");
  await createBook(page, title);

  // Búsqueda por título: lo encuentra.
  await page.getByPlaceholder("Buscar por título, autor o etiqueta...").fill(title);
  await page.getByRole("button", { name: "Buscar" }).click();
  await expect(page).toHaveURL(/\?q=/);
  await expect(page.getByRole("link", { name: new RegExp(escapeRegExp(title)) })).toBeVisible();

  // Búsqueda sin resultados.
  await page.getByPlaceholder("Buscar por título, autor o etiqueta...").fill("zzz-no-existe-zzz");
  await page.getByRole("button", { name: "Buscar" }).click();
  await expect(page.getByText(/No se encontraron libros/)).toBeVisible();
});

test("reseñas: agregar, ver análisis IA, editar y borrar", async ({ page }) => {
  const title = unique("Libro Reseñable");
  await createBook(page, title);
  await openBook(page, title);

  const content = unique("Me encanta, es brillante y lo recomiendo");
  await page.getByPlaceholder("¿Qué te pareció el libro?").fill(content);
  await page.getByRole("button", { name: "Publicar reseña" }).click();

  // La reseña aparece con el resumen de IA (mock).
  await expect(page.getByText(content)).toBeVisible();
  await expect(page.getByText("Resumen IA")).toBeVisible();

  // Editar. El textarea de edición es el del form que tiene el botón "Guardar"
  // (no confundir con el de "Agregar reseña", que está arriba en el DOM).
  const edited = unique("Reseña editada");
  await page.getByRole("button", { name: "Editar" }).click();
  const editForm = page.locator("form", { has: page.getByRole("button", { name: "Guardar" }) });
  await editForm.getByRole("textbox").fill(edited);
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText(edited)).toBeVisible();
  await expect(page.getByText(content)).toHaveCount(0);

  // Borrar.
  await page.getByRole("button", { name: "Borrar" }).click();
  await expect(page.getByText(edited)).toHaveCount(0);
});

test("documentos: subir solo resumen, re-analizar con mapa y borrar", async ({ page }) => {
  const title = unique("Libro Con PDF");
  await createBook(page, title);
  await openBook(page, title);

  // Subir el PDF pidiendo SOLO el resumen (sin mapa conceptual).
  await page.locator('input[type="file"]').setInputFiles(FIXTURE_PDF);
  await page.getByLabel("Mapa conceptual").uncheck();
  await page.getByRole("button", { name: "Subir PDF" }).click();

  // Aparece el documento y su resumen (de la prosa); NO el mapa conceptual.
  const docItem = page.locator("li", { hasText: "apunte.pdf" });
  await expect(docItem).toBeVisible();
  await expect(page.getByText(/fotosintesis/i)).toBeVisible();
  await expect(page.getByText(/Concepto clave del material/)).toHaveCount(0);

  // El insumo a la IA omite la página de ejercicios: no debe filtrarse al resumen.
  await expect(page.getByText(/Calcula la energia liberada/)).toHaveCount(0);

  // Re-analizar pidiendo el mapa conceptual.
  await docItem.getByRole("button", { name: "Re-analizar" }).click();
  await docItem.getByLabel("Mapa conceptual").check();
  await docItem.getByRole("button", { name: "Generar" }).click();
  await expect(page.getByText(/Concepto clave del material/).first()).toBeVisible();

  // Borrar el documento.
  await docItem.getByRole("button", { name: "Borrar" }).click();
  await expect(page.locator("li", { hasText: "apunte.pdf" })).toHaveCount(0);
});
