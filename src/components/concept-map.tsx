import type { ConceptMap } from "@/lib/validators/document";

/**
 * Render simple de un mapa conceptual: el tema central y, debajo, cada concepto
 * con su descripción y los conceptos con los que se relaciona.
 *
 * Es una vista de lista (no un grafo dibujado): se lee bien, es accesible y no
 * necesita una librería de canvas. Las conexiones se muestran como chips.
 */
export function ConceptMapView({ map }: { map: ConceptMap }) {
  return (
    <div className="space-y-3">
      <div className="inline-flex rounded-full bg-indigo-600 px-3 py-1 text-sm font-semibold text-white">
        {map.central}
      </div>

      <ul className="space-y-2">
        {map.concepts.map((concept) => (
          <li
            key={concept.name}
            className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800"
          >
            <p className="font-medium text-zinc-800 dark:text-zinc-100">{concept.name}</p>
            <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-300">{concept.description}</p>
            {concept.connections.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-zinc-400">Se relaciona con:</span>
                {concept.connections.map((target) => (
                  <span
                    key={target}
                    className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    {target}
                  </span>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
