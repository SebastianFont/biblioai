import { claudeAnalyzer } from "@/lib/ai/claude-analyzer";
import { mockAnalyzer } from "@/lib/ai/mock-analyzer";
import { claudeDocumentAnalyzer } from "@/lib/ai/claude-document-analyzer";
import { mockDocumentAnalyzer } from "@/lib/ai/mock-document-analyzer";
import type { DocumentAnalyzer, ReviewAnalyzer } from "@/lib/ai/types";

export type {
  AnalyzeInput,
  ReviewAnalyzer,
  AnalyzeDocumentInput,
  DocumentAnalyzer,
} from "@/lib/ai/types";

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

/**
 * Devuelve el analizador de documentos según `AI_PROVIDER` (mismo criterio que
 * `getAnalyzer`). Se mantiene separado porque es otro contrato (otra salida),
 * aunque hoy ambos respeten el mismo selector de proveedor.
 */
export function getDocumentAnalyzer(): DocumentAnalyzer {
  switch (process.env.AI_PROVIDER) {
    case "claude":
      return claudeDocumentAnalyzer;
    case "mock":
    default:
      return mockDocumentAnalyzer;
  }
}
