import { claudeAnalyzer } from "@/lib/ai/claude-analyzer";
import { mockAnalyzer } from "@/lib/ai/mock-analyzer";
import type { ReviewAnalyzer } from "@/lib/ai/types";

export type { AnalyzeInput, ReviewAnalyzer } from "@/lib/ai/types";

/**
 * Devuelve el analizador de reseñas según la configuración.
 *
 * `AI_PROVIDER`:
 *   - `mock` (por defecto): determinista, sin costo. Ideal para CI y para
 *     clonar el repo sin credenciales.
 *   - `claude`: usa el Claude Agent SDK con la suscripción del usuario.
 *
 * El selector vive acá para que el resto de la app pida "el analizador" sin
 * saber cuál es ni cómo se configura.
 */
export function getAnalyzer(): ReviewAnalyzer {
  switch (process.env.AI_PROVIDER) {
    case "claude":
      return claudeAnalyzer;
    case "mock":
    default:
      return mockAnalyzer;
  }
}
