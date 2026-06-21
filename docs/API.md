# API REST

Base: `/api`. Todas las respuestas son JSON. Los errores tienen la forma
`{ "error": string }`, y los de validación agregan `{ "fields": { campo: mensaje } }`.

> La app es single-user por diseño: todas las operaciones actúan sobre el usuario
> demo del seed (resuelto en `getCurrentUserId()`). Sumar autenticación real solo
> requeriría que esa función lea la sesión; los endpoints no cambian.

## Libros

| Método   | Ruta             | Descripción                       | Éxito |
| -------- | ---------------- | --------------------------------- | ----- |
| `GET`    | `/api/books`     | Lista los libros del usuario      | 200   |
| `POST`   | `/api/books`     | Crea un libro                     | 201   |
| `GET`    | `/api/books/:id` | Detalle del libro con sus reseñas | 200   |
| `PATCH`  | `/api/books/:id` | Actualización parcial             | 200   |
| `DELETE` | `/api/books/:id` | Elimina el libro (y sus reseñas)  | 204   |

### Crear libro — `POST /api/books`

```json
{
  "title": "Mother of Learning",
  "author": "nobody103",
  "description": "Opcional, máx. 2000 caracteres",
  "coverUrl": "https://opcional/portada.jpg"
}
```

## Reseñas

| Método | Ruta                     | Descripción                 | Éxito |
| ------ | ------------------------ | --------------------------- | ----- |
| `GET`  | `/api/books/:id/reviews` | Lista las reseñas del libro | 200   |
| `POST` | `/api/books/:id/reviews` | Agrega una reseña al libro  | 201   |

### Crear reseña — `POST /api/books/:id/reviews`

```json
{
  "content": "Texto de la reseña (obligatorio, máx. 5000)",
  "rating": 5
}
```

El resumen, las etiquetas y el sentimiento (`aiSummary`, `aiSentiment`) los
genera la capa de IA (etapa 4); no se aceptan desde el cliente.

## Documentos (PDF)

| Método | Ruta                       | Descripción                          | Éxito |
| ------ | -------------------------- | ------------------------------------ | ----- |
| `GET`  | `/api/books/:id/documents` | Lista los PDFs del libro (metadatos) | 200   |
| `POST` | `/api/books/:id/documents` | Sube un PDF y extrae su texto        | 201   |

### Subir documento — `POST /api/books/:id/documents`

`multipart/form-data` con un campo `file` (PDF, máx. 10 MB). Se extrae el texto
del PDF y se guarda; el resumen y el mapa conceptual los genera la IA en una
etapa posterior. Respuestas de error: `400` si falta el archivo, no es PDF,
supera el tamaño, o no tiene texto extraíble.

## Códigos de error

| Código | Cuándo                                                          |
| ------ | --------------------------------------------------------------- |
| `400`  | Body no JSON, datos que no pasan la validación, o id malformado |
| `404`  | El libro no existe o no pertenece al usuario                    |
| `500`  | Error inesperado (se loguea en el servidor)                     |
