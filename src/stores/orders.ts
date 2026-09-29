import { atom, computed, map } from "nanostores";
import type { Order, OrderLine } from "../data/types";

export const $orders = map<Record<string, Order>>({});

/** Lines being composed per table (not yet sent). */
export const $drafts = map<Record<number, OrderLine[]>>({});

export const $counters = atom({ nextOrderNumber: 1, nextLineId: 1 });

/** Orders that just arrived in the kitchen, highlighted for a moment. */
export const $freshOrders = atom<string[]>([]);

export const $kitchenLanes = computed($orders, (orders) => {
  const active = Object.values(orders).sort((a, b) => a.sentAt - b.sentAt);
  return {
    pending: active.filter((o) => o.status === "pending"),
    preparing: active.filter((o) => o.status === "preparing"),
    ready: active.filter((o) => o.status === "ready"),
  };
});

/** Product being customized on this device (the detail sheet). */
export interface ComposerState {
  productId: string;
  qty: number;
  modifiers: string[];
  extras: string[];
  note: string;
}
export const $composer = atom<ComposerState | null>(null);

/** Menu category shown on this device. */
export const $category = atom<import("../data/types").CategoryId>("birria");
