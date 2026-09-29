import { Minus, Plus } from "lucide-react";

interface Props {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label: string;
  size?: "md" | "lg";
  tour?: string;
}

export function Stepper({ value, onChange, min = 1, max = 20, label, size = "md", tour }: Props) {
  const btn = size === "lg" ? "size-14" : "size-11";
  const num = size === "lg" ? "w-16 text-[2rem]" : "w-10 text-[1.25rem]";
  return (
    <div className="inline-flex items-center rounded-2xl bg-white ring-1 ring-ink/12 p-1" role="group" aria-label={label}>
      <button
        type="button"
        className={`press grid place-items-center rounded-xl ${btn} hover:bg-ink/5 disabled:opacity-30`}
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label={`Quitar uno. ${label}`}
      >
        <Minus size={22} strokeWidth={2.5} aria-hidden="true" />
      </button>
      <output className={`text-center font-mono font-bold tabular-nums ${num}`} aria-live="polite">
        {value}
      </output>
      <button
        type="button"
        data-tour={tour}
        className={`press grid place-items-center rounded-xl ${btn} hover:bg-ink/5 disabled:opacity-30`}
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label={`Agregar uno. ${label}`}
      >
        <Plus size={22} strokeWidth={2.5} aria-hidden="true" />
      </button>
    </div>
  );
}
