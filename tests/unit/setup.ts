/**
 * Vitest setup — mocks the browser environment that src/lib/persistence.ts,
 * src/lib/sync.ts, and src/stores/demo.ts touch. Tests run on Node 22+ so
 * globalThis.crypto.randomUUID is real; everything else is stubbed.
 */
import { vi } from "vitest";

const memStore = new Map<string, string>();

const localStorageMock: Storage = {
  get length() {
    return memStore.size;
  },
  clear: () => memStore.clear(),
  getItem: (k: string) => memStore.get(k) ?? null,
  key: (i: number) => Array.from(memStore.keys())[i] ?? null,
  removeItem: (k: string) => {
    memStore.delete(k);
  },
  setItem: (k: string, v: string) => {
    memStore.set(k, String(v));
  },
};

class BroadcastChannelMock {
  static instances: BroadcastChannelMock[] = [];
  onmessage: ((e: { data: unknown }) => void) | null = null;
  onmessageerror: ((e: unknown) => void) | null = null;
  constructor(public name: string) {
    BroadcastChannelMock.instances.push(this);
  }
  postMessage(_msg: unknown): void {}
  close(): void {}
  addEventListener(): void {}
  removeEventListener(): void {}
  dispatchEvent(): boolean {
    return true;
  }
}

const documentMock = {
  visibilityState: "visible" as "visible" | "hidden",
  addEventListener: () => {},
  removeEventListener: () => {},
};

const win = {
  addEventListener: () => {},
  removeEventListener: () => {},
  setTimeout: (...args: Parameters<typeof setTimeout>) => setTimeout(...args),
  clearTimeout: (...args: Parameters<typeof clearTimeout>) => clearTimeout(...args),
  matchMedia: () => ({
    matches: false,
    media: "",
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => true,
  }),
  localStorage: localStorageMock,
  BroadcastChannel: BroadcastChannelMock,
  crypto: globalThis.crypto,
  location: { href: "http://localhost/", reload: () => {} },
  document: documentMock,
};

vi.stubGlobal("window", win);
vi.stubGlobal("document", documentMock);
vi.stubGlobal("localStorage", localStorageMock);
vi.stubGlobal("BroadcastChannel", BroadcastChannelMock);

export const __resetTestMocks = () => {
  memStore.clear();
  BroadcastChannelMock.instances.length = 0;
};