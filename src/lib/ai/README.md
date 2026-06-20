# `lib/ai` — Capa de integración con IA

Encapsula **toda** la comunicación con el proveedor de LLM (Claude API).

## Por qué existe esta capa

El resto de la app nunca habla con el LLM directamente: lo hace a través de las
funciones que se exponen acá. Así logramos:

- **Aislamiento de la dependencia externa:** si mañana cambiamos de proveedor o
  de modelo, solo se toca esta carpeta.
- **Testeabilidad:** el cliente del LLM se puede mockear, los tests no gastan
  tokens ni dependen de la red.
- **Un único punto** para prompts, manejo de errores y reintentos.

## Contenido (a medida que avanza el proyecto)

- `client.ts` — inicialización del SDK de Anthropic.
- `summarize-review.ts` — resume y categoriza una reseña.
- `prompts/` — prompts versionados y documentados.
