import { BellRing, CircleDashed, Flame, PenLine, Receipt, Send, UtensilsCrossed, type LucideIcon } from "lucide-react";
import type { TableStatus } from "../../data/types";

export interface StatusMeta {
  label: string;
  short: string;
  icon: LucideIcon;
  /** Chip classes: color is never the only signal, every chip has icon + text. */
  chip: string;
}

export const tableStatus: Record<TableStatus, StatusMeta> = {
  free: { label: "Libre", short: "Libre", icon: CircleDashed, chip: "bg-transparent text-muted ring-1 ring-inset ring-ink/15" },
  ordering: { label: "Tomando pedido", short: "Tomando pedido", icon: PenLine, chip: "bg-ink/6 text-ink ring-1 ring-inset ring-ink/15" },
  pending: { label: "Enviado a cocina", short: "En cocina", icon: Send, chip: "bg-ink text-white" },
  preparing: { label: "En preparación", short: "En preparación", icon: Flame, chip: "bg-warn-soft text-warn ring-1 ring-inset ring-warn/25" },
  ready: { label: "Listo para entregar", short: "Listo", icon: BellRing, chip: "bg-ready text-white" },
  served: { label: "Servido", short: "Servido", icon: UtensilsCrossed, chip: "bg-ready-soft text-ready ring-1 ring-inset ring-ready/25" },
  check: { label: "Cuenta solicitada", short: "Cuenta solicitada", icon: Receipt, chip: "bg-brand text-white" },
};
