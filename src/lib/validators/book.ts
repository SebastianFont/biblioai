import { z } from "zod";

/**
 * Esquemas de validación de libros.
 *
 * Son la única fuente de verdad: los tipos de entrada se derivan con `z.infer`,
 * así no se duplica la forma de los datos entre runtime (Zod) y compile-time (TS).
 */

// Datos que el cliente envía al crear un libro.
export const createBookSchema = z.object({
  title: z.string().trim().min(1, "El título es obligatorio").max(200),
  author: z.string().trim().min(1, "El autor es obligatorio").max(120),
  description: z.string().trim().max(2000).optional(),
  coverUrl: z.url("La portada debe ser una URL válida").optional(),
});

// Actualización parcial: todos los campos son opcionales, pero al menos uno
// debe venir para que la operación tenga sentido.
export const updateBookSchema = createBookSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Se debe enviar al menos un campo para actualizar",
  });

// Identificador de libro en parámetros de ruta.
export const bookIdSchema = z.cuid("Identificador de libro inválido");

// Texto de búsqueda de la biblioteca (opcional, acotado). Se normaliza a
// `undefined` cuando viene vacío para no filtrar de más.
export const bookSearchSchema = z
  .string()
  .trim()
  .max(120)
  .optional()
  .transform((value) => (value ? value : undefined));

export type CreateBookInput = z.infer<typeof createBookSchema>;
export type UpdateBookInput = z.infer<typeof updateBookSchema>;
