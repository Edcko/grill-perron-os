import { useStore } from "@nanostores/react";
import { AlarmClock, Clock3, TriangleAlert } from "lucide-react";
import { $now } from "../../stores/restaurant";
import { elapsed, timerLabel, timerLevel } from "../../lib/time";

interface Props {
  from: number;
  /** Freeze the timer (e.g. once the order is ready). */
  until?: number | null;
  tone?: "light" | "dark";
  size?: "md" | "xl";
  showLevel?: boolean;
}

/** Real elapsed time. Level is shown with icon + word, never color alone. */
export function Timer({ from, until = null, tone = "light", size = "md", showLevel = true }: Props) {
  const now = useStore($now);
  const end = until ?? now;
  const level = timerLevel(from, end);
  const Icon = level === "late" ? AlarmClock : level === "attention" ? TriangleAlert : Clock3;
  const colors =
    level === "late"
      ? "bg-brand text-white"
      : level === "attention"
        ? tone === "dark" ? "bg-warn-bright text-ink" : "bg-warn-soft text-warn"
        : tone === "dark" ? "bg-white/8 text-white" : "bg-ink/6 text-ink";

  return (
    <span className={`inline-flex items-center gap-2 rounded-xl ${size === "xl" ? "h-11 px-3" : "h-8 px-2.5"} ${colors}`}>
      <Icon size={size === "xl" ? 18 : 14} strokeWidth={2.5} aria-hidden="true" />
      <span className={`font-mono font-bold tabular-nums ${size === "xl" ? "text-[1.35rem]" : "text-[0.9rem]"}`}>{elapsed(from, end)}</span>
      {showLevel && level !== "normal" && (
        <span className="text-[0.68rem] font-bold uppercase tracking-[0.1em]">{timerLabel[level]}</span>
      )}
      <span className="sr-only">{timerLabel[level]}</span>
    </span>
  );
}
