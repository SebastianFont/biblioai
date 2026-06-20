# Cómo se usó la IA en este proyecto

Este proyecto fue desarrollado **con asistencia de IA** de forma deliberada y
transparente. Esta página documenta cómo, porque dirigir bien una IA es hoy una
habilidad de ingeniería en sí misma.

## La IA dentro del producto

BiblioAI usa el modelo **Claude** para procesar las reseñas que escribe el
usuario y devolver:

- un **resumen** breve,
- un conjunto de **etiquetas/géneros**,
- un **análisis de sentimiento**.

Decisiones de diseño relevantes:

- **Modelo:** se usa un modelo liviano y económico (`claude-haiku-4-5`) porque
  la tarea es acotada y el costo por reseña importa.
- **Aislamiento:** toda la integración vive en [`src/lib/ai`](../src/lib/ai). El
  resto de la app no conoce al proveedor.
- **Salida estructurada:** se le pide al modelo un JSON con forma fija, validado
  con Zod al recibirlo. Si la respuesta no valida, se trata como error
  controlado (no se confía ciegamente en la salida del modelo).
- **Tests sin red:** el cliente del LLM se mockea en los tests; no se gastan
  tokens ni se depende de la disponibilidad del servicio.

## La IA como herramienta de desarrollo

El código se escribió con asistencia de un agente de IA. El criterio humano se
aplicó en:

- definir la **arquitectura** y los límites entre capas,
- **revisar** todo el código generado antes de commitearlo,
- decidir **prácticas** (validación en el borde, tests, CI),
- mantener un **historial de commits** limpio y con intención.

> La IA acelera la escritura; las decisiones de diseño, la revisión y la calidad
> siguen siendo responsabilidad de quien la dirige.
