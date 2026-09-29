import { atom } from "nanostores";
import type { DemoUser } from "../data/types";

export const $user = atom<DemoUser | null>(null);

/** False until the persisted state has been loaded on this device. */
export const $ready = atom(false);

export type ToastScope = "waiter" | "kitchen" | "all";
export type ToastIcon = "send" | "check" | "flame" | "bell" | "receipt" | "reset" | "save" | "plus";
export type ToastTone = "ink" | "brand" | "ready";

export interface Toast {
  id: number;
  scope: ToastScope;
  title: string;
  detail?: string;
  icon: ToastIcon;
  tone: ToastTone;
  /** Toasts sharing a group replace each other (e.g. status updates of one order). */
  group?: string;
}

export const $toasts = atom<Toast[]>([]);
let toastSeq = 0;

export function pushToast(toast: Omit<Toast, "id">, ttl = 3800): void {
  const id = ++toastSeq;
  const rest = $toasts.get().filter((t) => !toast.group || t.group !== toast.group || t.scope !== toast.scope);
  $toasts.set([...rest.slice(-1), { ...toast, id }]);
  if (typeof window !== "undefined") window.setTimeout(() => dismissToast(id), ttl);
}

export function dismissToast(id: number): void {
  $toasts.set($toasts.get().filter((t) => t.id !== id));
}

/** Last sync event seen on this device, for visual cues (e.g. the presentation wire). */
export interface LastEvent {
  seq: number;
  type: string;
  orderId?: string;
  table?: number;
}
export const $lastEvent = atom<LastEvent | null>(null);
let eventSeq = 0;
export function noteEvent(e: Omit<LastEvent, "seq">): void {
  $lastEvent.set({ ...e, seq: ++eventSeq });
}
