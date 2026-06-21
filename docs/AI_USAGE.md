# Cómo se usó la IA en este proyecto

Este proyecto fue desarrollado **con asistencia de IA** de forma deliberada y
transparente. Esta página documenta cómo, porque dirigir bien una IA es hoy una
habilidad de ingeniería en sí misma.

## La IA dentro del producto

BiblioAI usa **Claude** para procesar las reseñas que escribe el usuario y
devolver un **resumen**, un conjunto de **etiquetas/géneros** y un **análisis de
sentimiento**. Toda la integración vive aislada en [`src/lib/ai`](../src/lib/ai)
detrás de una interfaz (`ReviewAnalyzer`); el resto de la app no conoce al
proveedor.

### Dos implementaciones, elegibles por configuración (`AI_PROVIDER`)

- **`mock` (por defecto):** analizador determinista, sin costo ni credenciales.
  Hace que el repo funcione para cualquiera y en CI sin gastar tokens.
- **`claude`:** usa el **Claude Agent SDK** (`@anthropic-ai/claude-agent-sdk`),
  que se autentica con la **suscripción de Claude Code** del usuario logueado,
  **sin API key**. Modelo liviano (`haiku`) porque la tarea es acotada.

> **Decisión consciente y su límite:** usar la suscripción vía el Agent SDK evita
> pagar la API por token, pero solo funciona **localmente**, donde el usuario está
> logueado en Claude Code. No sirve para un deploy público que sirva a terceros
> (para eso haría falta la API paga). Para este proyecto de portfolio —que se
> muestra corriendo en local— es la opción correcta. La interfaz desacoplada
> permite cambiar a otro proveedor sin tocar el resto del código.

### Robustez

- **No se confía a ciegas en el modelo:** se le pide JSON y la respuesta se
  valida con Zod (`reviewAnalysisSchema`) antes de guardarla. Si no valida, es un
  error controlado.
- **Degradación elegante:** si el análisis falla (sin red, error del modelo), la
  reseña del usuario igual se guarda; la IA es un "extra", no un punto único de
  fallo.
- **Tests sin red:** el analizador se inyecta y se mockea en los tests; no se
  gastan tokens ni se depende de la disponibilidad del servicio.

## La IA como herramienta de desarrollo

El código se escribió con asistencia de un agente de IA. El criterio humano se
aplicó en:

- definir la **arquitectura** y los límites entre capas,
- **revisar** todo el código generado antes de commitearlo,
- decidir **prácticas** (validación en el borde, tests, CI),
- mantener un **historial de commits** limpio y con intención.

> La IA acelera la escritura; las decisiones de diseño, la revisión y la calidad
> siguen siendo responsabilidad de quien la dirige.
