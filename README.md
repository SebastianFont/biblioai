# 📚 BiblioAI

> Gestor de biblioteca personal con análisis de reseñas asistido por IA.

[![CI](https://github.com/SebastianFont/biblioai/actions/workflows/ci.yml/badge.svg)](https://github.com/SebastianFont/biblioai/actions/workflows/ci.yml)
![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)
![License](https://img.shields.io/badge/license-MIT-green)

BiblioAI es una aplicación full stack para gestionar tu biblioteca personal:
catalogás libros, escribís reseñas, y un modelo de lenguaje (Claude) genera
automáticamente un **resumen**, **etiquetas/géneros** y un **análisis de
sentimiento** de cada reseña, que después podés usar para buscar y filtrar.

> ⚠️ Proyecto de portfolio. El foco está tanto en el producto como en las
> **prácticas de ingeniería**: arquitectura modular, validación estricta, tests,
> CI/CD y documentación. Ver [`docs/`](./docs).

## ✨ Características

- 📖 CRUD de libros y reseñas
- 🤖 Resumen, etiquetado y sentimiento de reseñas con IA (Claude API)
- 🔎 Búsqueda y filtrado por etiquetas generadas
- 🔐 Autenticación de usuarios
- ✅ Validación de extremo a extremo con Zod

## 🛠️ Stack

| Capa          | Tecnología                                    |
| ------------- | --------------------------------------------- |
| Framework     | Next.js 16 (App Router) + TypeScript estricto |
| UI            | React 19 + Tailwind CSS + shadcn/ui           |
| Validación    | Zod                                           |
| Base de datos | Prisma + SQLite (dev) / PostgreSQL (prod)     |
| Autenticación | Auth.js (NextAuth)                            |
| IA            | Claude API (`@anthropic-ai/sdk`)              |
| Tests         | Vitest (unit) + Playwright (e2e)              |
| Calidad       | ESLint + Prettier + Husky                     |
| CI/CD         | GitHub Actions                                |
| Infra         | Docker + docker-compose                       |

## 🚀 Quickstart

Requisitos: Node.js 20+ y npm.

```bash
# 1. Clonar e instalar
git clone https://github.com/SebastianFont/biblioai.git
cd biblioai
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editá .env y completá tu ANTHROPIC_API_KEY

# 3. Levantar en desarrollo
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000).

## 📜 Scripts

| Script              | Descripción                     |
| ------------------- | ------------------------------- |
| `npm run dev`       | Servidor de desarrollo          |
| `npm run build`     | Build de producción             |
| `npm run lint`      | Linter (ESLint)                 |
| `npm run format`    | Formatea el código con Prettier |
| `npm run typecheck` | Chequeo de tipos sin emitir     |

## 📂 Estructura

```
src/
├── app/            # Rutas: páginas (UI) y API (route handlers)
├── components/     # Componentes de UI reutilizables
├── lib/
│   ├── ai/         # Capa aislada de integración con el LLM
│   ├── db/         # Cliente Prisma y queries
│   └── validators/ # Esquemas Zod (única fuente de verdad de tipos de entrada)
├── server/         # Lógica de negocio (services)
└── types/          # Tipos compartidos
```

Cada carpeta documenta su responsabilidad en un `README.md` propio.

## 📚 Documentación

- [Arquitectura y decisiones técnicas](./docs/ARCHITECTURE.md)
- [Cómo se usó la IA en este proyecto](./docs/AI_USAGE.md)

## 📄 Licencia

MIT — ver [LICENSE](./LICENSE).
