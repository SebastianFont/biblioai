import { z, ZodError, type ZodType } from "zod";
import { BadRequestError, ForbiddenError, NotFoundError } from "@/server/errors";

/**
 * Utilidades compartidas por los route handlers.
 *
 * Centralizan dos cosas que, si se repiten en cada endpoint, terminan
 * divergiendo: el parseo+validación del body y la traducción de errores a
 * códigos HTTP. Con esto, cada handler se concentra solo en su caso de uso.
 */

/** Respuesta JSON tipada. */
export function json<T>(data: T, status = 200): Response {
  return Response.json(data, { status });
}

/**
 * Lee el body JSON de la request y lo valida contra un esquema Zod.
 * Si el JSON es inválido o no cumple el esquema, lanza un ZodError que
 * `toErrorResponse` convierte en un 400 con el detalle por campo.
 */
export async function parseBody<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    // Body ausente o no parseable.
    throw new BadRequestError("El cuerpo debe ser JSON válido");
  }
  return schema.parse(body);
}

/** Aplana un ZodError a un mapa `campo -> mensaje` fácil de consumir en el front. */
function fieldErrors(error: ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join(".") : "_";
    result[key] ??= issue.message;
  }
  return result;
}

/** Traduce cualquier error lanzado por un handler/service a una Response HTTP. */
export function toErrorResponse(error: unknown): Response {
  if (error instanceof ZodError) {
    return json({ error: "Datos inválidos", fields: fieldErrors(error) }, 400);
  }
  if (error instanceof BadRequestError) {
    return json({ error: error.message }, 400);
  }
  if (error instanceof NotFoundError) {
    return json({ error: error.message }, 404);
  }
  if (error instanceof ForbiddenError) {
    return json({ error: error.message }, 403);
  }
  // Error inesperado: se loguea para diagnóstico y se responde genérico
  // para no filtrar detalles internos.
  console.error("Error no controlado en un route handler:", error);
  return json({ error: "Error interno del servidor" }, 500);
}

/**
 * Envuelve la lógica de un handler con el manejo de errores común.
 * El handler solo se ocupa del camino feliz; los errores se mapean acá.
 */
export async function handleRoute(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** Valida un parámetro de ruta (p. ej. un id) y devuelve el valor tipado. */
export function parseParam<T>(value: string, schema: ZodType<T>): T {
  return schema.parse(value);
}

// Re-export acotado para que los handlers no importen Zod directamente si no lo necesitan.
export { z };
