export type TimerLevel = "normal" | "attention" | "late";

export const ATTENTION_AFTER = 5 * 60_000;
export const LATE_AFTER = 10 * 60_000;

export function elapsed(from: number, now: number): string {
  const total = Math.max(0, Math.floor((now - from) / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function minutesSince(from: number, now: number): number {
  return Math.max(0, Math.floor((now - from) / 60_000));
}

export function timerLevel(from: number, now: number): TimerLevel {
  const ms = now - from;
  if (ms >= LATE_AFTER) return "late";
  if (ms >= ATTENTION_AFTER) return "attention";
  return "normal";
}

export const timerLabel: Record<TimerLevel, string> = {
  normal: "A tiempo",
  attention: "Atención",
  late: "Retrasado",
};

export function clock(ts: number): string {
  return new Date(ts).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}
