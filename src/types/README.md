# `types` — Tipos compartidos

Tipos de TypeScript usados en varias capas (dominio, DTOs de la API).

Cuando un tipo se deriva de un esquema Zod, vive junto al esquema en
`lib/validators`; acá quedan los tipos de dominio que no nacen de una validación.
