import { atom, map, onMount } from "nanostores";
import type { Table, TableStatus } from "../data/types";

export const $tables = map<Record<number, Table>>({});

/** Table currently being served on this device. */
export const $activeTable = atom<number | null>(null);

export type TableFilter = "all" | "occupied" | "free" | "preparing" | "ready";
export const $tableFilter = atom<TableFilter>("all");

export const filterMatches: Record<TableFilter, (s: TableStatus) => boolean> = {
  all: () => true,
  occupied: (s) => s !== "free",
  free: (s) => s === "free",
  preparing: (s) => s === "pending" || s === "preparing",
  ready: (s) => s === "ready",
};

/** Shared one-second clock for every timer on screen. */
export const $now = atom<number>(Date.now());
onMount($now, () => {
  $now.set(Date.now());
  const id = window.setInterval(() => $now.set(Date.now()), 1000);
  return () => window.clearInterval(id);
});
