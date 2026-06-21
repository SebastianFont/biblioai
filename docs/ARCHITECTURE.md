# Arquitectura

Este documento explica **cómo** está organizado el proyecto y, sobre todo, **por
qué** se tomaron ciertas decisiones.

## Principios

1. **Separación por responsabilidad.** Cada capa tiene un trabajo y un solo
   motivo para cambiar.
2. **Las dependencias externas se aíslan.** El LLM y la base de datos se
   consumen siempre a través de una capa propia, nunca directamente desde la UI
   o los controladores.
3. **Nada sin validar entra al sistema.** Toda entrada se valida con Zod en el
   borde.
4. **Testeable por diseño.** La lógica de negocio no depende del framework ni de
   servicios externos reales.

## Capas

```
┌─────────────────────────────────────────────┐
│  app/ (UI + route handlers)                  │  ← HTTP / React
├─────────────────────────────────────────────┤
│  server/ (services)                          │  ← reglas de negocio
├──────────────────────┬──────────────────────┤
│  lib/db (Prisma)     │  lib/ai (Claude)      │  ← dependencias externas aisladas
└──────────────────────┴──────────────────────┘
         lib/validators (Zod) cruza todas las capas de entrada
```

### `app/`

Páginas (React Server Components) y route handlers. Los handlers son delgados:
parsean la request, validan con Zod, delegan en un service y mapean el resultado
a una respuesta HTTP.

### `server/`

Lógica de negocio. Orquesta el acceso a datos y la IA. No conoce detalles de
HTTP, lo que permite testearla de forma aislada.

### `lib/ai`

Único punto de contacto con el LLM. Ver [AI_USAGE.md](./AI_USAGE.md). Decisión
clave: el resto del código depende de una interfaz nuestra, no del SDK del
proveedor. Cambiar de modelo o proveedor es un cambio local.

### `lib/db`

Cliente Prisma como singleton para evitar agotar el pool de conexiones durante
el hot-reload de Next.js en desarrollo.

### `lib/validators`

Esquemas Zod. Los tipos de TS se derivan con `z.infer`, manteniendo una sola
fuente de verdad entre validación en runtime y tipos en compile-time.

## Decisiones registradas

| Decisión                           | Motivo                                                                                                                                                 |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Next.js App Router (monorepo)      | Full stack en un solo lenguaje y un solo deploy.                                                                                                       |
| SQLite en dev, Postgres en prod    | Cero fricción local; Prisma abstrae el motor.                                                                                                          |
| Zod como fuente de tipos           | Evita duplicar validación runtime y tipos estáticos.                                                                                                   |
| Capa `lib/ai` aislada              | Desacopla el producto del proveedor de IA; habilita mocks.                                                                                             |
| Services separados de handlers     | Controladores delgados y lógica de negocio testeable.                                                                                                  |
| Driver adapter de Prisma 7         | Prisma 7 requiere un adapter, no una URL; SQLite vía `better-sqlite3`.                                                                                 |
| `aiSentiment` como `String`        | SQLite no soporta enums en Prisma; los valores se validan con Zod.                                                                                     |
| IA detrás de `ReviewAnalyzer`      | Interfaz con impl mock (default, sin costo) y Claude (suscripción); intercambiables.                                                                   |
| Enriquecido con degradación        | Si la IA falla, la reseña igual se guarda; la IA es un extra, no un SPOF.                                                                              |
| Single-user vía `getCurrentUserId` | App de portfolio: un solo usuario (demo del seed). El acceso a la sesión está aislado en una función, así que sumar Auth.js no toca services ni rutas. |
