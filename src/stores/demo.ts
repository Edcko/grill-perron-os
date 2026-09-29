import { createInitialState } from "../data/demo";
import type { DemoState, DemoUser, Order, OrderLine, StationId, Table } from "../data/types";
import { orderIsFullyReady, stationsFor, tableLabel, ticketNumber } from "../lib/orders";
import { loadState, saveState } from "../lib/persistence";
import { onExternalState, onSyncEvent, publish, startSync, type SyncEvent, type SyncEventType } from "../lib/sync";
import { $tables } from "./restaurant";
import { $counters, $drafts, $freshOrders, $orders } from "./orders";
import { $ready, $user, noteEvent, pushToast } from "./session";

/* ------------------------------------------------------------------ */
/* Snapshot <-> stores                                                 */
/* ------------------------------------------------------------------ */

function snapshot(): DemoState {
  const counters = $counters.get();
  return {
    tables: $tables.get(),
    orders: $orders.get(),
    drafts: $drafts.get(),
    nextOrderNumber: counters.nextOrderNumber,
    nextLineId: counters.nextLineId,
    user: $user.get(),
  };
}

function applyState(state: DemoState, { keepUser = false } = {}): void {
  $tables.set(state.tables);
  $orders.set(state.orders);
  $drafts.set(state.drafts);
  $counters.set({ nextOrderNumber: state.nextOrderNumber, nextLineId: state.nextLineId });
  if (!keepUser) $user.set(state.user);
}

/** Persist, broadcast and run local side effects for one change. */
function commit(type: SyncEventType, meta: Pick<SyncEvent, "orderId" | "table" | "station"> = {}): void {
  const state = snapshot();
  saveState(state);
  const event = { type, ...meta, state, at: Date.now(), origin: "local" } satisfies SyncEvent;
  publish({ type, ...meta, state });
  effects(event, true);
}

/* ------------------------------------------------------------------ */
/* Side effects: toasts and highlights, identical in every tab         */
/* ------------------------------------------------------------------ */

function effects(event: SyncEvent, local: boolean): void {
  const order = event.orderId ? event.state.orders[event.orderId] : undefined;
  noteEvent({ type: event.type, orderId: event.orderId, table: event.table });
  const group = event.orderId ?? (event.table ? `t-${event.table}` : undefined);
  const who = order ? (order.table ? tableLabel(order.table) : order.label) : event.table ? tableLabel(event.table) : "";

  switch (event.type) {
    case "ORDER_CREATED": {
      if (local) pushToast({ group, scope: "waiter", icon: "send", tone: "ink", title: "Comanda enviada a cocina", detail: `${who} · ${order ? ticketNumber(order.number) : ""}` });
      pushToast({ group, scope: "kitchen", icon: "bell", tone: "brand", title: `Nueva comanda · ${who}`, detail: order ? `${ticketNumber(order.number)} · ${order.waiter}` : undefined });
      if (event.orderId) flagFresh(event.orderId);
      break;
    }
    case "ORDER_STARTED":
      if (order?.table) pushToast({ group, scope: "waiter", icon: "flame", tone: "ink", title: `${who} en preparación`, detail: "Cocina comenzó tu comanda" });
      break;
    case "STATION_READY":
      if (order?.table && event.station) pushToast({ group, scope: "waiter", icon: "check", tone: "ink", title: `${who} · ${stationName(event.station)} lista`, detail: "El resto sigue en preparación" });
      break;
    case "ORDER_READY":
      if (order?.table) pushToast({ group, scope: "waiter", icon: "bell", tone: "ready", title: `${who} está lista`, detail: "Pasa a recoger a la barra" }, 6000);
      break;
    case "CHECK_REQUESTED":
      if (local) pushToast({ group, scope: "waiter", icon: "receipt", tone: "ink", title: "Cuenta solicitada", detail: who });
      break;
    case "DEMO_RESET":
      pushToast({ group, scope: "all", icon: "reset", tone: "ink", title: "Demo reiniciada", detail: "Todo volvió al estado inicial" });
      break;
    default:
      break;
  }
}

function stationName(id: StationId): string {
  return { parrilla: "Parrilla", cocina: "Cocina", barra: "Barra" }[id];
}

function flagFresh(orderId: string): void {
  $freshOrders.set([...$freshOrders.get(), orderId]);
  window.setTimeout(() => $freshOrders.set($freshOrders.get().filter((id) => id !== orderId)), 4000);
}

/* ------------------------------------------------------------------ */
/* Boot                                                                */
/* ------------------------------------------------------------------ */

let booted = false;

export function boot(): void {
  if (booted || typeof window === "undefined") return;
  booted = true;

  const stored = loadState();
  const state = stored ?? createInitialState(Date.now());
  if (!stored) saveState(state);
  applyState(state);

  startSync();
  onSyncEvent((event) => {
    applyState(event.state, { keepUser: true });
    effects(event, false);
  });
  onExternalState((next) => applyState(next, { keepUser: true }));

  // A background tab may have been frozen by the browser: re-read on focus.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    const latest = loadState();
    if (latest) applyState(latest, { keepUser: true });
  });

  $ready.set(true);
}

if (typeof window !== "undefined") boot();

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function patchTable(id: number, patch: Partial<Table>): void {
  const current = $tables.get()[id];
  if (!current) return;
  $tables.setKey(id, { ...current, ...patch });
}

function patchOrder(id: string, patch: Partial<Order>): Order | null {
  const current = $orders.get()[id];
  if (!current) return null;
  const next = { ...current, ...patch };
  $orders.setKey(id, next);
  return next;
}

function nextLineId(): string {
  const c = $counters.get();
  $counters.set({ ...c, nextLineId: c.nextLineId + 1 });
  return `l-${c.nextLineId}`;
}

function sameLine(a: Omit<OrderLine, "id" | "qty">, b: Omit<OrderLine, "id" | "qty">): boolean {
  return (
    a.productId === b.productId &&
    a.note.trim() === b.note.trim() &&
    [...a.modifiers].sort().join() === [...b.modifiers].sort().join() &&
    [...a.extras].sort().join() === [...b.extras].sort().join()
  );
}

/* ------------------------------------------------------------------ */
/* Session                                                             */
/* ------------------------------------------------------------------ */

export function signIn(user: DemoUser): void {
  $user.set(user);
  saveState(snapshot());
}

/* ------------------------------------------------------------------ */
/* Waiter actions                                                      */
/* ------------------------------------------------------------------ */

export function openTable(id: number, guests = 2): void {
  const table = $tables.get()[id];
  if (!table || table.status !== "free") return;
  patchTable(id, { status: "ordering", guests: Math.min(guests, table.seats), openedAt: Date.now() });
  commit("TABLE_UPDATED", { table: id });
}

export function setGuests(id: number, guests: number): void {
  const table = $tables.get()[id];
  if (!table) return;
  patchTable(id, { guests: Math.max(1, Math.min(guests, table.seats + 2)) });
  commit("TABLE_UPDATED", { table: id });
}

export function addLine(table: number, line: Omit<OrderLine, "id">): void {
  const t = $tables.get()[table];
  if (!t) return;
  if (t.status === "free") patchTable(table, { status: "ordering", guests: Math.min(2, t.seats), openedAt: Date.now() });
  if (t.status === "served") patchTable(table, { status: "ordering" });

  const lines = $drafts.get()[table] ?? [];
  const match = lines.find((l) => sameLine(l, line));
  const next = match
    ? lines.map((l) => (l === match ? { ...l, qty: l.qty + line.qty } : l))
    : [...lines, { ...line, note: line.note.trim(), id: nextLineId() }];
  $drafts.setKey(table, next);
  commit("TABLE_UPDATED", { table });
}

export function setLineQty(table: number, lineId: string, qty: number): void {
  const lines = $drafts.get()[table] ?? [];
  const next = qty <= 0 ? lines.filter((l) => l.id !== lineId) : lines.map((l) => (l.id === lineId ? { ...l, qty } : l));
  $drafts.setKey(table, next);
  commit("TABLE_UPDATED", { table });
}

export function saveDraft(table: number): void {
  const lines = $drafts.get()[table] ?? [];
  pushToast({ scope: "waiter", icon: "save", tone: "ink", title: "Pedido guardado", detail: `${tableLabel(table)} · ${lines.length} ${lines.length === 1 ? "producto" : "productos"} sin enviar` });
}

/** Sends the draft to the kitchen. Returns the new order id. */
export function sendOrder(table: number): string | null {
  const t = $tables.get()[table];
  const lines = $drafts.get()[table] ?? [];
  if (!t || lines.length === 0) return null;

  const counters = $counters.get();
  const number = counters.nextOrderNumber;
  const id = `o-${String(number).padStart(3, "0")}`;
  const order: Order = {
    id,
    number,
    table,
    label: tableLabel(table),
    guests: t.guests,
    waiter: $user.get()?.name ?? "Misael",
    lines,
    status: "pending",
    stations: stationsFor(lines, "pending"),
    sentAt: Date.now(),
    startedAt: null,
    readyAt: null,
    deliveredAt: null,
  };

  $counters.set({ ...counters, nextOrderNumber: number + 1 });
  $orders.setKey(id, order);
  $drafts.setKey(table, []);
  patchTable(table, {
    status: "pending",
    orderId: id,
    history: t.orderId && t.orderId !== id ? [...t.history, t.orderId] : t.history,
  });
  commit("ORDER_CREATED", { orderId: id, table });
  return id;
}

export function deliverOrder(orderId: string): void {
  const order = patchOrder(orderId, { status: "delivered", deliveredAt: Date.now() });
  if (!order) return;
  if (order.table) {
    const t = $tables.get()[order.table];
    if (t && t.orderId === orderId) patchTable(order.table, { status: "served", orderId: null, history: [...t.history, orderId] });
  }
  commit("ORDER_DELIVERED", { orderId, table: order.table ?? undefined });
}

export function startNewRound(table: number): void {
  const t = $tables.get()[table];
  if (!t) return;
  patchTable(table, { status: "ordering" });
  commit("TABLE_UPDATED", { table });
}

export function requestCheck(table: number): void {
  const t = $tables.get()[table];
  if (!t) return;
  patchTable(table, { status: "check" });
  commit("CHECK_REQUESTED", { table });
}

export function releaseTable(table: number): void {
  const t = $tables.get()[table];
  if (!t) return;
  patchTable(table, { status: "free", guests: 0, openedAt: null, orderId: null, history: [] });
  $drafts.setKey(table, []);
  commit("TABLE_UPDATED", { table });
}

/* ------------------------------------------------------------------ */
/* Kitchen actions                                                     */
/* ------------------------------------------------------------------ */

function syncTableWith(order: Order): void {
  if (!order.table) return;
  const t = $tables.get()[order.table];
  if (!t || t.orderId !== order.id) return;
  const status = order.status === "ready" ? "ready" : order.status === "preparing" ? "preparing" : t.status;
  patchTable(order.table, { status });
}

export function startOrder(orderId: string): void {
  const current = $orders.get()[orderId];
  if (!current || current.status !== "pending") return;
  const stations = Object.fromEntries(
    Object.entries(current.stations).map(([k, v]) => [k, v === "ready" ? "ready" : "preparing"]),
  );
  const order = patchOrder(orderId, { status: "preparing", startedAt: Date.now(), stations });
  if (!order) return;
  syncTableWith(order);
  commit("ORDER_STARTED", { orderId, table: order.table ?? undefined });
}

export function markStationReady(orderId: string, station: StationId): void {
  const current = $orders.get()[orderId];
  if (!current || current.status === "ready" || current.status === "delivered") return;
  const stations = { ...current.stations, [station]: "ready" as const };
  const draft = { ...current, stations };
  if (orderIsFullyReady(draft)) {
    patchOrder(orderId, { stations });
    markReady(orderId);
    return;
  }
  const order = patchOrder(orderId, {
    stations,
    status: "preparing",
    startedAt: current.startedAt ?? Date.now(),
  });
  if (!order) return;
  syncTableWith(order);
  commit("STATION_READY", { orderId, station, table: order.table ?? undefined });
}

export function markReady(orderId: string): void {
  const current = $orders.get()[orderId];
  if (!current || current.status === "ready" || current.status === "delivered") return;
  const stations = Object.fromEntries(Object.keys(current.stations).map((k) => [k, "ready"]));
  const order = patchOrder(orderId, {
    status: "ready",
    stations,
    startedAt: current.startedAt ?? Date.now(),
    readyAt: Date.now(),
  });
  if (!order) return;
  syncTableWith(order);
  commit("ORDER_READY", { orderId, table: order.table ?? undefined });
}

/* ------------------------------------------------------------------ */
/* Demo                                                                */
/* ------------------------------------------------------------------ */

export function resetDemo(): void {
  const user = $user.get();
  const fresh = createInitialState(Date.now());
  applyState({ ...fresh, user });
  $freshOrders.set([]);
  commit("DEMO_RESET");
}
