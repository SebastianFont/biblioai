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

## Contenido

- `types.ts` — la interfaz `ReviewAnalyzer` (el contrato) y sus tipos.
- `mock-analyzer.ts` — implementación determinista, sin costo (por defecto).
- `claude-analyzer.ts` — implementación real con el Claude Agent SDK
  (suscripción del usuario, sin API key).
- `index.ts` — `getAnalyzer()`: elige la implementación según `AI_PROVIDER`.

Ver [docs/AI_USAGE.md](../../../docs/AI_USAGE.md) para el detalle de decisiones.
