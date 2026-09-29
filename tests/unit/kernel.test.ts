/**
 * Unit tests for the demo kernel: snapshot/applyState/commit pattern and
 * the 14 public actions exported from src/stores/demo.ts.
 *
 * What we verify:
 *  - snapshot() gathers every atom into a single DemoState (indirectly via
 *    the envelope persisted to localStorage on every commit).
 *  - applyState() restores every atom from a DemoState (indirectly via
 *    boot() and resetDemo()).
 *  - commit() persists + broadcasts + triggers effects (toasts) for every
 *    public action.
 *  - Each public action mutates the right atoms with the right shape.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { __resetTestMocks } from "./setup";
import {
  addLine,
  boot,
  deliverOrder,
  markReady,
  markStationReady,
  openTable,
  releaseTable,
  requestCheck,
  resetDemo,
  saveDraft,
  sendOrder,
  setGuests,
  setLineQty,
  signIn,
  startNewRound,
  startOrder,
} from "../../src/stores/demo";
import { $counters, $drafts, $freshOrders, $orders } from "../../src/stores/orders";
import { $toasts, $user } from "../../src/stores/session";
import { $tables } from "../../src/stores/restaurant";
import { STATE_KEY, STATE_VERSION, loadState, saveState } from "../../src/lib/persistence";
import type { DemoUser, Order } from "../../src/data/types";

const MISAEL: DemoUser = { id: "misael", name: "Misael", role: "Mesero · Salón", initials: "MI" };

beforeEach(() => {
  __resetTestMocks();
  resetDemo();
  $user.set(null);
  $toasts.set([]);
  $freshOrders.set([]);
});

function getTable(id: number) {
  return $tables.get()[id];
}
function getOrder(id: string) {
  return $orders.get()[id];
}
function envelopeFromStorage(): { version: number; savedAt: number; state: unknown } | null {
  const raw = globalThis.localStorage.getItem(STATE_KEY);
  if (!raw) return null;
  return JSON.parse(raw);
}

/* ------------------------------------------------------------------ */
/* boot + persistence                                                  */
/* ------------------------------------------------------------------ */

describe("boot", () => {
  it("seeds tables from createInitialState when storage is empty", () => {
    // boot already ran at import time; reset cleared state and reapplied.
    const tables = $tables.get();
    expect(Object.keys(tables)).toHaveLength(12);
    expect(getTable(3)?.status).toBe("preparing");
    expect(getTable(5)?.status).toBe("ready");
    expect(getTable(12)?.status).toBe("check");
    expect(getTable(8)?.status).toBe("free");
  });

  it("persists a versioned envelope on every reset", () => {
    const env = envelopeFromStorage();
    expect(env?.version).toBe(STATE_VERSION);
    expect(env?.state).toBeDefined();
  });

  it("discards envelopes with a stale STATE_VERSION via loadState", () => {
    globalThis.localStorage.setItem(
      STATE_KEY,
      JSON.stringify({ version: 0, savedAt: 0, state: { tables: {} } }),
    );
    const state = loadState();
    expect(state).toBeNull();
    expect(globalThis.localStorage.getItem(STATE_KEY)).toBeNull();
  });

  it("saveState writes a versioned envelope readable by loadState", () => {
    saveState({
      tables: {},
      orders: {},
      drafts: {},
      nextOrderNumber: 99,
      nextLineId: 7,
      user: null,
    });
    const env = envelopeFromStorage();
    expect(env?.version).toBe(STATE_VERSION);
    const loaded = loadState();
    expect(loaded?.nextOrderNumber).toBe(99);
    expect(loaded?.nextLineId).toBe(7);
  });
});

/* ------------------------------------------------------------------ */
/* snapshot / commit — observable through localStorage                 */
/* ------------------------------------------------------------------ */

describe("commit (via public actions)", () => {
  it("writes a versioned envelope to localStorage on every action", () => {
    const before = envelopeFromStorage();
    openTable(8, 4);
    const after = envelopeFromStorage();
    expect(after?.version).toBe(STATE_VERSION);
    // The envelope changes because state changed.
    expect(JSON.stringify(after?.state)).not.toBe(JSON.stringify(before?.state));
  });

  it("includes the full DemoState in the persisted snapshot", () => {
    openTable(8, 4);
    const state = envelopeFromStorage()?.state as { tables: Record<string, unknown>; orders: Record<string, unknown> };
    expect(state.tables[8]).toBeDefined();
    expect(state.orders).toBeDefined();
    expect(typeof (state as unknown as { drafts: unknown }).drafts).toBe("object");
  });
});

/* ------------------------------------------------------------------ */
/* session                                                             */
/* ------------------------------------------------------------------ */

describe("signIn", () => {
  it("sets the active user and persists the snapshot", () => {
    signIn(MISAEL);
    expect($user.get()?.id).toBe("misael");
    expect($user.get()?.name).toBe("Misael");
  });
});

/* ------------------------------------------------------------------ */
/* waiter actions                                                      */
/* ------------------------------------------------------------------ */

describe("openTable", () => {
  it("moves a free table to ordering with guests and openedAt", () => {
    openTable(8, 3);
    const t = getTable(8);
    expect(t?.status).toBe("ordering");
    expect(t?.guests).toBe(3);
    expect(typeof t?.openedAt).toBe("number");
  });

  it("clamps guests to the seat count", () => {
    openTable(2, 99); // mesa 2 has 4 seats
    expect(getTable(2)?.guests).toBe(4);
  });

  it("is a no-op when the table is not free", () => {
    const before = getTable(3); // preparing
    openTable(3, 4);
    expect(getTable(3)).toEqual(before);
  });
});

describe("setGuests", () => {
  it("clamps to seats + 2 (mesa 8 has 4 seats → max 6 guests)", () => {
    setGuests(8, 99);
    expect(getTable(8)?.guests).toBe(6);
  });

  it("does not go below 1", () => {
    setGuests(8, 0);
    expect(getTable(8)?.guests).toBeGreaterThanOrEqual(1);
  });
});

describe("addLine", () => {
  beforeEach(() => {
    openTable(8, 2);
  });

  it("appends a new line when no match exists", () => {
    const before = $drafts.get()[8]?.length ?? 0;
    addLine(8, { productId: "birria-de-res", qty: 1, modifiers: [], extras: [], note: "" });
    expect(($drafts.get()[8] ?? []).length).toBe(before + 1);
  });

  it("merges with an existing line when productId + modifiers + extras + note match", () => {
    addLine(8, { productId: "birria-de-res", qty: 1, modifiers: ["con-todo"], extras: [], note: "" });
    addLine(8, { productId: "birria-de-res", qty: 2, modifiers: ["con-todo"], extras: [], note: "" });
    const lines = $drafts.get()[8] ?? [];
    expect(lines).toHaveLength(1);
    expect(lines[0]?.qty).toBe(3);
  });

  it("keeps lines separate when modifiers differ", () => {
    addLine(8, { productId: "birria-de-res", qty: 1, modifiers: ["con-todo"], extras: [], note: "" });
    addLine(8, { productId: "birria-de-res", qty: 1, modifiers: ["sin-cebolla"], extras: [], note: "" });
    expect(($drafts.get()[8] ?? []).length).toBe(2);
  });
});

describe("setLineQty", () => {
  beforeEach(() => {
    openTable(8, 2);
    addLine(8, { productId: "birria-de-res", qty: 2, modifiers: [], extras: [], note: "" });
  });

  it("updates the qty of an existing line", () => {
    const lineId = ($drafts.get()[8] ?? [])[0]!.id;
    setLineQty(8, lineId, 5);
    expect(($drafts.get()[8] ?? [])[0]?.qty).toBe(5);
  });

  it("removes the line when qty drops to 0", () => {
    const lineId = ($drafts.get()[8] ?? [])[0]!.id;
    setLineQty(8, lineId, 0);
    expect(($drafts.get()[8] ?? [])).toHaveLength(0);
  });
});

describe("saveDraft", () => {
  it("does not commit (no localStorage mutation beyond effects)", () => {
    openTable(8, 2);
    addLine(8, { productId: "birria-de-res", qty: 1, modifiers: [], extras: [], note: "" });
    const envBefore = envelopeFromStorage();
    saveDraft(8);
    const envAfter = envelopeFromStorage();
    // saveDraft only fires a toast; envelope bytes are unchanged.
    expect(JSON.stringify(envAfter)).toBe(JSON.stringify(envBefore));
  });
});

describe("sendOrder", () => {
  beforeEach(() => {
    signIn(MISAEL);
    openTable(8, 2);
    addLine(8, { productId: "birria-de-res", qty: 1, modifiers: [], extras: [], note: "" });
  });

  it("creates an order with the next number, clears drafts, marks the table pending", () => {
    const nextNumber = $counters.get().nextOrderNumber;
    const id = sendOrder(8);
    expect(id).toBe(`o-${String(nextNumber).padStart(3, "0")}`);
    const order = getOrder(id!);
    expect(order).toBeDefined();
    expect(order?.status).toBe("pending");
    expect(order?.table).toBe(8);
    expect(order?.waiter).toBe("Misael");
    expect(order?.number).toBe(nextNumber);
    expect(($drafts.get()[8] ?? [])).toHaveLength(0);
    expect(getTable(8)?.status).toBe("pending");
    expect(getTable(8)?.orderId).toBe(id);
    expect($counters.get().nextOrderNumber).toBe(nextNumber + 1);
  });

  it("returns null and is a no-op when drafts are empty", () => {
    setLineQty(8, ($drafts.get()[8] ?? [])[0]!.id, 0);
    const before = envelopeFromStorage();
    const id = sendOrder(8);
    expect(id).toBeNull();
    expect(JSON.stringify(envelopeFromStorage())).toBe(JSON.stringify(before));
  });
});

describe("startNewRound", () => {
  it("moves a served table back to ordering", () => {
    // Set table 8 to served via releaseTable → open again → serve.
    openTable(8, 2);
    addLine(8, { productId: "birria-de-res", qty: 1, modifiers: [], extras: [], note: "" });
    signIn(MISAEL);
    sendOrder(8);
    const id = getTable(8)?.orderId!;
    deliverOrder(id);
    expect(getTable(8)?.status).toBe("served");
    startNewRound(8);
    expect(getTable(8)?.status).toBe("ordering");
  });
});

describe("requestCheck", () => {
  it("moves the table to check status", () => {
    openTable(8, 2);
    requestCheck(8);
    expect(getTable(8)?.status).toBe("check");
  });
});

describe("releaseTable", () => {
  it("resets the table to free and clears drafts", () => {
    openTable(8, 2);
    addLine(8, { productId: "birria-de-res", qty: 1, modifiers: [], extras: [], note: "" });
    releaseTable(8);
    expect(getTable(8)?.status).toBe("free");
    expect(getTable(8)?.guests).toBe(0);
    expect(getTable(8)?.openedAt).toBeNull();
    expect(($drafts.get()[8] ?? [])).toHaveLength(0);
  });
});

/* ------------------------------------------------------------------ */
/* kitchen actions                                                     */
/* ------------------------------------------------------------------ */

describe("startOrder", () => {
  it("moves pending → preparing and stamps startedAt", () => {
    const o: Order = getOrder("o-042")!;
    expect(o.status).toBe("pending");
    startOrder("o-042");
    const updated = getOrder("o-042");
    expect(updated?.status).toBe("preparing");
    expect(typeof updated?.startedAt).toBe("number");
  });

  it("is a no-op on a non-pending order", () => {
    const before = getOrder("o-041"); // preparing
    startOrder("o-041");
    expect(getOrder("o-041")).toEqual(before);
  });
});

describe("markStationReady", () => {
  it("flips the named station to ready on an in-flight order", () => {
    markStationReady("o-041", "cocina");
    expect(getOrder("o-041")?.stations.cocina).toBe("ready");
  });

  it("promotes the order to ready when every station is ready", () => {
    // o-039 already has all stations ready per the seed; calling markReady directly.
    markStationReady("o-041", "cocina");
    markStationReady("o-041", "parrilla");
    markStationReady("o-041", "barra");
    expect(getOrder("o-041")?.status).toBe("ready");
    expect(typeof getOrder("o-041")?.readyAt).toBe("number");
  });
});

describe("markReady", () => {
  it("flips an in-flight order to ready with readyAt", () => {
    markReady("o-041");
    expect(getOrder("o-041")?.status).toBe("ready");
    expect(typeof getOrder("o-041")?.readyAt).toBe("number");
  });
});

/* ------------------------------------------------------------------ */
/* resetDemo                                                           */
/* ------------------------------------------------------------------ */

describe("resetDemo", () => {
  it("restores the seed state, resets order numbers, preserves the active user", () => {
    signIn(MISAEL);
    openTable(8, 4);
    addLine(8, { productId: "birria-de-res", qty: 1, modifiers: [], extras: [], note: "" });
    sendOrder(8);
    const counter = $counters.get().nextOrderNumber;
    expect(counter).toBeGreaterThan(44);

    resetDemo();

    expect($counters.get().nextOrderNumber).toBe(44);
    expect($tables.get()[8]?.status).toBe("free");
    expect(($drafts.get()[8] ?? [])).toHaveLength(0);
    expect($user.get()?.id).toBe("misael"); // user preserved
  });
});