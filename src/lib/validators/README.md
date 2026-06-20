# `lib/validators` — Esquemas de validación

Esquemas de [Zod](https://zod.dev) que validan toda entrada que cruza el borde
de la aplicación (bodies de la API, params, variables de entorno).

Regla del proyecto: **nada sin validar entra al backend.** Los tipos de
TypeScript se derivan de estos esquemas (`z.infer`), una sola fuente de verdad.
