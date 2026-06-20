/**
 * Seed de la base de datos: datos de ejemplo para desarrollo y demos.
 *
 * Se ejecuta con `npm run db:seed`. Es repetible: limpia las tablas antes de
 * insertar, así que correrlo varias veces deja siempre el mismo estado.
 *
 * Nota: importa el cliente con ruta relativa (no con el alias `@/`) porque
 * corre con tsx, fuera del runtime de Next.js que resuelve el alias.
 */
import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { hash } from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";

// El seed corre con tsx (fuera de Next), por eso carga .env arriba.
// Prisma 7 usa driver adapters: el cliente se construye con un adapter de SQLite
// (ver lib/db/client.ts para la misma configuración en el runtime de Next).
const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Estado limpio antes de sembrar. El orden respeta las claves foráneas;
  // borrar usuarios arrastra libros y reseñas por el `onDelete: Cascade`.
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();

  // Usuario demo (contraseña: "demo1234").
  const passwordHash = await hash("demo1234", 10);
  const user = await prisma.user.upsert({
    where: { email: "demo@biblioai.dev" },
    update: {},
    create: {
      email: "demo@biblioai.dev",
      name: "Lector Demo",
      passwordHash,
    },
  });

  // Libros con reseñas y etiquetas (las etiquetas simulan la salida de la IA).
  const books = [
    {
      title: "Dungeon Crawler Carl",
      author: "Matt Dinniman",
      description: "LitRPG frenético, oscuro y con mucho humor.",
      tags: ["LitRPG", "Humor", "Ciencia ficción"],
      review: {
        content:
          "Una vuelta de tuerca brillante al género. El tono cómico convive con momentos durísimos y el sistema de mazmorra está muy bien pensado.",
        rating: 5,
        aiSummary:
          "Reseña muy positiva: destaca el humor, la profundidad emocional y el diseño del sistema.",
        aiSentiment: "POSITIVE",
      },
    },
    {
      title: "He Who Fights with Monsters",
      author: "Shirtaloon",
      description: "Isekai LitRPG con un protagonista sarcástico.",
      tags: ["LitRPG", "Isekai", "Aventura"],
      review: {
        content:
          "El protagonista cae bien por su sarcasmo, aunque por momentos el ritmo se hace lento. Igual engancha.",
        rating: 4,
        aiSummary: "Reseña mayormente positiva con una crítica al ritmo en algunos tramos.",
        aiSentiment: "MIXED",
      },
    },
    {
      title: "The Wandering Inn",
      author: "pirateaba",
      description: "Fantasía épica y enorme alrededor de una posada.",
      tags: ["Fantasía", "Slice of life", "Épica"],
      review: {
        content:
          "Empieza despacio y es larguísima, pero la construcción de mundo y los personajes son excepcionales.",
        rating: 5,
        aiSummary:
          "Valoración positiva centrada en el worldbuilding y los personajes, con aviso sobre la extensión.",
        aiSentiment: "POSITIVE",
      },
    },
  ];

  for (const { tags, review, ...bookData } of books) {
    await prisma.book.create({
      data: {
        ...bookData,
        ownerId: user.id,
        tags: {
          connectOrCreate: tags.map((name) => ({
            where: { name },
            create: { name },
          })),
        },
        reviews: { create: review },
      },
    });
  }

  const [users, bookCount, tagCount] = await Promise.all([
    prisma.user.count(),
    prisma.book.count(),
    prisma.tag.count(),
  ]);
  console.log(
    `Seed completo: ${users} usuario(s), ${bookCount} libro(s), ${tagCount} etiqueta(s).`,
  );
}

main()
  .catch((error) => {
    console.error("Error en el seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
