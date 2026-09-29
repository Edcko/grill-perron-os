import type { DemoState } from "../data/types";

/**
 * Bump when the shape of DemoState changes. Any stored snapshot with a
 * different version is discarded and the demo starts clean.
 */
export const STATE_VERSION = 3;
export const STATE_KEY = "grill-perron-demo:state";

interface Envelope {
  version: number;
  savedAt: number;
  state: DemoState;
}

function storage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function loadState(): DemoState | null {
  const store = storage();
  if (!store) return null;
  try {
    const raw = store.getItem(STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Envelope;
    if (parsed?.version !== STATE_VERSION || !parsed.state?.tables) {
      store.removeItem(STATE_KEY);
      return null;
    }
    return parsed.state;
  } catch {
    store.removeItem(STATE_KEY);
    return null;
  }
}

export function saveState(state: DemoState): void {
  const store = storage();
  if (!store) return;
  try {
    const envelope: Envelope = { version: STATE_VERSION, savedAt: Date.now(), state };
    store.setItem(STATE_KEY, JSON.stringify(envelope));
  } catch {
    // Storage full or blocked (private mode): the demo keeps working in memory.
  }
}

export function parseEnvelope(raw: string | null): DemoState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Envelope;
    return parsed?.version === STATE_VERSION ? parsed.state : null;
  } catch {
    return null;
  }
}
