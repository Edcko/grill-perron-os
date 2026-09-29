import type { DemoState, DemoUser, Order, OrderLine, Table, TableStatus } from "./types";

export const users: DemoUser[] = [
  { id: "misael", name: "Misael", role: "Mesero · Salón", initials: "MI" },
  { id: "juan", name: "Juan", role: "Mesero · Terraza", initials: "JU" },
  { id: "pedro", name: "Pedro", role: "Capitán de meseros", initials: "PE" },
];

export const DEMO_TABLE = 8;

const MIN = 60_000;
const SEC = 1_000;

interface TableSeed {
  id: number;
  seats: number;
  status?: TableStatus;
  guests?: number;
  openedAgo?: number;
  orderId?: string;
  history?: string[];
}

const tableSeeds: TableSeed[] = [
  { id: 1, seats: 2 },
  { id: 2, seats: 4 },
  { id: 3, seats: 4, status: "preparing", guests: 4, openedAgo: 22 * MIN, orderId: "o-041" },
  { id: 4, seats: 2 },
  { id: 5, seats: 6, status: "ready", guests: 3, openedAgo: 31 * MIN, orderId: "o-039" },
  { id: 6, seats: 4 },
  { id: 7, seats: 2 },
  { id: 8, seats: 4 },
  { id: 9, seats: 4 },
  { id: 10, seats: 6 },
  { id: 11, seats: 2 },
  { id: 12, seats: 4, status: "check", guests: 2, openedAgo: 48 * MIN, history: ["o-038"] },
];

function line(id: number, productId: string, qty: number, modifiers: string[] = [], extras: string[] = [], note = ""): OrderLine {
  return { id: `l-${id}`, productId, qty, modifiers, extras, note };
}

/**
 * Builds the exact same restaurant every time. Timestamps are offsets from
 * `now`, so timers always start from the same values on every reset.
 */
export function createInitialState(now: number): DemoState {
  const tables: Record<number, Table> = {};
  for (const seed of tableSeeds) {
    tables[seed.id] = {
      id: seed.id,
      zone: seed.id <= 8 ? "Salón" : "Terraza",
      seats: seed.seats,
      guests: seed.guests ?? 0,
      status: seed.status ?? "free",
      openedAt: seed.openedAgo ? now - seed.openedAgo : null,
      orderId: seed.orderId ?? null,
      history: seed.history ?? [],
    };
  }

  const orders: Order[] = [
    {
      id: "o-038", number: 38, table: 12, label: "Mesa 12", guests: 2, waiter: "Juan",
      lines: [line(1, "birria-de-res", 2), line(2, "agua-jamaica", 2)],
      status: "delivered", stations: { cocina: "ready", barra: "ready" },
      sentAt: now - 41 * MIN, startedAt: now - 40 * MIN, readyAt: now - 29 * MIN, deliveredAt: now - 28 * MIN,
    },
    {
      id: "o-039", number: 39, table: 5, label: "Mesa 05", guests: 3, waiter: "Misael",
      lines: [line(3, "quesabirria", 3, ["con-todo"]), line(4, "consome-grande", 1), line(5, "refresco", 3)],
      status: "ready", stations: { parrilla: "ready", cocina: "ready", barra: "ready" },
      sentAt: now - 9 * MIN - 5 * SEC, startedAt: now - 8 * MIN, readyAt: now - 1 * MIN - 20 * SEC, deliveredAt: null,
    },
    {
      id: "o-040", number: 40, table: null, label: "Para llevar · Laura", guests: 0, waiter: "Pedro",
      lines: [line(6, "taco-de-birria", 6, ["con-todo"]), line(7, "consome", 2), line(8, "tortillas", 1)],
      status: "preparing", stations: { parrilla: "preparing", cocina: "ready" },
      sentAt: now - 11 * MIN - 24 * SEC, startedAt: now - 9 * MIN, readyAt: null, deliveredAt: null,
    },
    {
      id: "o-041", number: 41, table: 3, label: "Mesa 03", guests: 4, waiter: "Misael",
      lines: [
        line(9, "birria-de-res", 2, ["con-todo"]),
        line(10, "taco-dorado", 4, ["sin-cebolla"]),
        line(11, "agua-horchata", 2),
        line(12, "agua-jamaica", 2),
      ],
      status: "preparing", stations: { cocina: "preparing", parrilla: "preparing", barra: "ready" },
      sentAt: now - 4 * MIN - 12 * SEC, startedAt: now - 3 * MIN, readyAt: null, deliveredAt: null,
    },
    {
      id: "o-042", number: 42, table: null, label: "Para llevar · Don Ramiro", guests: 0, waiter: "Pedro",
      lines: [line(13, "vampiro", 2, ["sin-salsa"]), line(14, "media-orden", 1, [], [], "Consomé en vaso aparte")],
      status: "pending", stations: { parrilla: "pending", cocina: "pending" },
      sentAt: now - 1 * MIN - 58 * SEC, startedAt: null, readyAt: null, deliveredAt: null,
    },
    {
      id: "o-043", number: 43, table: null, label: "Para llevar · Andrea", guests: 0, waiter: "Juan",
      lines: [line(15, "quesabirria", 2, ["con-todo"], ["queso"]), line(16, "agua-horchata", 1)],
      status: "pending", stations: { parrilla: "pending", barra: "pending" },
      sentAt: now - 42 * SEC, startedAt: null, readyAt: null, deliveredAt: null,
    },
  ];

  return {
    tables,
    orders: Object.fromEntries(orders.map((o) => [o.id, o])),
    drafts: {},
    nextOrderNumber: 44,
    nextLineId: 100,
    user: null,
  };
}
