"use client";

export interface GenerateOptionsValue {
  summary: boolean;
  conceptMap: boolean;
}

/**
 * Par de checkboxes para elegir qué genera la IA: resumen y/o mapa conceptual.
 * Controlado por el componente padre. La validación de "al menos uno" se hace
 * arriba (deshabilitando el botón) y, por las dudas, también en el server.
 */
export function GenerateOptionsFields({
  value,
  onChange,
  disabled,
}: {
  value: GenerateOptionsValue;
  onChange: (value: GenerateOptionsValue) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-700 dark:text-zinc-300">
      <span className="text-zinc-500 dark:text-zinc-400">Generar:</span>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={value.summary}
          onChange={(e) => onChange({ ...value, summary: e.target.checked })}
          disabled={disabled}
          className="h-4 w-4 accent-indigo-600"
        />
        Resumen
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={value.conceptMap}
          onChange={(e) => onChange({ ...value, conceptMap: e.target.checked })}
          disabled={disabled}
          className="h-4 w-4 accent-indigo-600"
        />
        Mapa conceptual
      </label>
    </div>
  );
}
