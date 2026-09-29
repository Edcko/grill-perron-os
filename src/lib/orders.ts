import { extraById, modifierById, productById, stationOrder } from "../data/products";
import type { Order, OrderLine, StationId, StationStatus } from "../data/types";

export function unitPrice(line: Pick<OrderLine, "productId" | "extras">): number {
  const base = productById[line.productId]?.price ?? 0;
  return base + line.extras.reduce((sum, id) => sum + (extraById[id]?.price ?? 0), 0);
}

export function lineTotal(line: OrderLine): number {
  return unitPrice(line) * line.qty;
}

export function linesTotal(lines: OrderLine[]): number {
  return lines.reduce((sum, l) => sum + lineTotal(l), 0);
}

export function itemCount(lines: OrderLine[]): number {
  return lines.reduce((sum, l) => sum + l.qty, 0);
}

/** Human-readable details for a line: modifiers, extras and the free-text note. */
export function lineDetails(line: OrderLine): { text: string; kind: "mod" | "extra" | "note" }[] {
  return [
    ...line.modifiers.map((id) => ({ text: modifierById[id]?.label ?? id, kind: "mod" as const })),
    ...line.extras.map((id) => ({ text: extraById[id]?.label ?? id, kind: "extra" as const })),
    ...(line.note ? [{ text: line.note, kind: "note" as const }] : []),
  ];
}

export function productName(line: OrderLine, plural = true): string {
  const p = productById[line.productId];
  if (!p) return line.productId;
  if (!plural || line.qty === 1) return p.name;
  return pluralize(p.name);
}

const irregular: Record<string, string> = { "Media Orden": "Medias Órdenes", "Taco Dorado": "Tacos Dorados", "Queso Extra": "Quesos Extra" };

function pluralize(name: string): string {
  if (irregular[name]) return irregular[name];
  const [first, ...rest] = name.split(" ");
  const tail = rest.length ? ` ${rest.join(" ")}` : "";
  if (/s$/i.test(first)) return name;
  if (/[aeiouáéó]$/i.test(first)) return `${first}s${tail}`;
  return `${first}es${tail}`;
}

export function linesByStation(lines: OrderLine[]): { station: StationId; lines: OrderLine[] }[] {
  return stationOrder
    .map((station) => ({ station, lines: lines.filter((l) => productById[l.productId]?.station === station) }))
    .filter((g) => g.lines.length > 0);
}

export function stationsFor(lines: OrderLine[], status: StationStatus): Partial<Record<StationId, StationStatus>> {
  return Object.fromEntries(linesByStation(lines).map((g) => [g.station, status]));
}

export function orderIsFullyReady(order: Order): boolean {
  return Object.values(order.stations).every((s) => s === "ready");
}

export function ticketNumber(n: number): string {
  return `#${String(n).padStart(3, "0")}`;
}

export function tableLabel(n: number): string {
  return `Mesa ${String(n).padStart(2, "0")}`;
}
