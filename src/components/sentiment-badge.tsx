import { Badge } from "@/components/ui/badge";
import type { Sentiment } from "@/lib/validators/review";

// Estilo y etiqueta para cada sentimiento que produce la IA.
const SENTIMENT_META: Record<Sentiment, { label: string; emoji: string; className: string }> = {
  POSITIVE: {
    label: "Positiva",
    emoji: "😊",
    className: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  },
  NEUTRAL: {
    label: "Neutral",
    emoji: "😐",
    className: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  },
  NEGATIVE: {
    label: "Negativa",
    emoji: "😕",
    className: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  },
  MIXED: {
    label: "Mixta",
    emoji: "🤔",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  },
};

export function SentimentBadge({ sentiment }: { sentiment: string }) {
  // El valor viene de la base como string; si no es uno conocido, no renderizamos.
  const meta = SENTIMENT_META[sentiment as Sentiment];
  if (!meta) return null;
  return (
    <Badge className={meta.className}>
      {meta.emoji} {meta.label}
    </Badge>
  );
}
