# `server` — Lógica de negocio (services)

Capa de servicios entre los route handlers (HTTP) y el acceso a datos.

- Los **route handlers** solo se ocupan de HTTP: parsear, validar, responder.
- Los **services** contienen las reglas de negocio y orquestan `lib/db` y
  `lib/ai`.

Esta separación mantiene los controladores delgados y la lógica testeable de
forma aislada del framework.
