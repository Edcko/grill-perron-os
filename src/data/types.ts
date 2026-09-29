export type CategoryId = "birria" | "tacos" | "quesabirrias" | "consomes" | "bebidas" | "extras";

/** Where each product is prepared. Drives routing on the kitchen display. */
export type StationId = "parrilla" | "cocina" | "barra";

export interface Product {
  id: string;
  name: string;
  short: string;
  category: CategoryId;
  price: number;
  station: StationId;
  description: string;
  /** Food items accept "sin cebolla", extras, etc. Drinks do not. */
  customizable: boolean;
}

export interface Modifier {
  id: string;
  label: string;
}

export interface Extra {
  id: string;
  label: string;
  price: number;
}

export type TableStatus =
  | "free"
  | "ordering"
  | "pending"
  | "preparing"
  | "ready"
  | "served"
  | "check";

export interface Table {
  id: number;
  zone: "Salón" | "Terraza";
  seats: number;
  guests: number;
  status: TableStatus;
  openedAt: number | null;
  orderId: string | null;
  /** Orders already delivered to this table during the current visit. */
  history: string[];
}

export type OrderStatus = "pending" | "preparing" | "ready" | "delivered";
export type StationStatus = "pending" | "preparing" | "ready";

export interface OrderLine {
  id: string;
  productId: string;
  qty: number;
  modifiers: string[];
  extras: string[];
  note: string;
}

export interface Order {
  id: string;
  number: number;
  /** Table number, or null for take-away tickets. */
  table: number | null;
  label: string;
  guests: number;
  waiter: string;
  lines: OrderLine[];
  status: OrderStatus;
  stations: Partial<Record<StationId, StationStatus>>;
  sentAt: number;
  startedAt: number | null;
  readyAt: number | null;
  deliveredAt: number | null;
}

export interface DemoUser {
  id: string;
  name: string;
  role: string;
  initials: string;
}

export interface DemoState {
  tables: Record<number, Table>;
  orders: Record<string, Order>;
  /** Lines being composed per table, not yet sent to the kitchen. */
  drafts: Record<number, OrderLine[]>;
  nextOrderNumber: number;
  nextLineId: number;
  user: DemoUser | null;
}
