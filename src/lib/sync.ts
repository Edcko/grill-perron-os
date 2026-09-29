import { atom } from "nanostores";
import type { DemoState, StationId } from "../data/types";
import { STATE_KEY, parseEnvelope } from "./persistence";

/**
 * The single place that knows how tabs talk to each other.
 * Primary transport: BroadcastChannel. Fallback: `storage` events.
 */
export const CHANNEL_NAME = "grill-perron-demo";
const EVENT_KEY = "grill-perron-demo:event";

export type SyncEventType =
  | "ORDER_CREATED"
  | "ORDER_STARTED"
  | "STATION_READY"
  | "ORDER_READY"
  | "ORDER_DELIVERED"
  | "CHECK_REQUESTED"
  | "TABLE_UPDATED"
  | "DEMO_RESET";

export interface SyncEvent {
  type: SyncEventType;
  orderId?: string;
  table?: number;
  station?: StationId;
  at: number;
  origin: string;
  /** Full snapshot after the change, so every tab converges on the same state. */
  state: DemoState;
}

export type ConnectionState = "connecting" | "live" | "fallback";
export const $connection = atom<ConnectionState>("connecting");

type Listener = (event: SyncEvent) => void;
type StateListener = (state: DemoState) => void;

const origin = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now());

let channel: BroadcastChannel | null = null;
let started = false;
const listeners = new Set<Listener>();
const stateListeners = new Set<StateListener>();

function deliver(event: SyncEvent) {
  if (!event || event.origin === origin) return;
  listeners.forEach((fn) => fn(event));
}

export function startSync(): void {
  if (started || typeof window === "undefined") return;
  started = true;

  if ("BroadcastChannel" in window) {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (msg: MessageEvent<SyncEvent>) => deliver(msg.data);
    $connection.set("live");
  } else {
    $connection.set("fallback");
  }

  window.addEventListener("storage", (e) => {
    if (e.key === EVENT_KEY && !channel && e.newValue) {
      try {
        deliver(JSON.parse(e.newValue) as SyncEvent);
      } catch {
        /* ignore malformed payloads */
      }
    }
    // Safety net: any state written by another tab wins, even if a message was missed.
    if (e.key === STATE_KEY) {
      const state = parseEnvelope(e.newValue);
      if (state) stateListeners.forEach((fn) => fn(state));
    }
  });
}

export function publish(event: Omit<SyncEvent, "origin" | "at">): void {
  const full: SyncEvent = { ...event, origin, at: Date.now() };
  if (channel) {
    channel.postMessage(full);
    return;
  }
  try {
    window.localStorage.setItem(EVENT_KEY, JSON.stringify(full));
  } catch {
    /* storage unavailable: other tabs will not hear this one */
  }
}

export function onSyncEvent(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function onExternalState(fn: StateListener): () => void {
  stateListeners.add(fn);
  return () => stateListeners.delete(fn);
}
