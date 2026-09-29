import { useStore } from "@nanostores/react";
import { atom } from "nanostores";
import { ChevronLeft, Pause, Play, RotateCcw, Wifi } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { DEMO_TABLE } from "../../data/demo";
import type { FoodImages } from "../../lib/images";
import type { Go, WaiterRoute } from "../../lib/nav";
import { clock, pad2 } from "../../lib/time";
import { revealInScroller } from "../../lib/reveal";
import { resetDemo } from "../../stores/demo";
import { $composer, $counters } from "../../stores/orders";
import { $now } from "../../stores/restaurant";
import { $lastEvent } from "../../stores/session";
import KitchenBoard from "./KitchenBoard";
import MenuCatalog from "./MenuCatalog";
import OrderClosing from "./OrderClosing";
import OrderComposer from "./OrderComposer";
import OrderTracking from "./OrderTracking";
import TableMap from "./TableMap";
import Toaster from "./Toaster";

interface Props {
  images: FoodImages;
}

/* ------------------------------------------------------------------ */
/* Stage UI state                                                      */
/* ------------------------------------------------------------------ */

const $screen = atom<WaiterRoute>({ screen: "map" });
const $started = atom(false);

function withTransition(update: () => void) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  if (!doc.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return update();
  doc.startViewTransition(() => flushSync(update));
}

const stageGo: Go = (route) => {
  withTransition(() => $screen.set(route));
  document.querySelector("[data-waiter-scroll]")?.scrollTo({ top: 0 });
};

/* ------------------------------------------------------------------ */
/* Device: renders at a real logical size, scaled to fit               */
/* ------------------------------------------------------------------ */

function Device({ width, height, kind, label, children }: { width: number; height: number; kind: "tablet" | "monitor"; label: string; children: ReactNode }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const bezel = kind === "tablet" ? 18 : 10;

  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const fit = () => {
      const w = box.clientWidth - bezel * 2;
      const h = box.clientHeight - bezel * 2 - (kind === "monitor" ? 28 : 0);
      setScale(Math.max(0.2, Math.min(w / width, h / height)));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    return () => ro.disconnect();
  }, [width, height, bezel, kind]);

  return (
    <div ref={boxRef} className="relative min-w-0 min-h-0 h-full flex flex-col items-center justify-center">
      <figure className="m-0 flex flex-col items-center" aria-label={label}>
        <div
          className="bg-[#0b0b0b] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.09),0_50px_90px_-35px_rgb(0_0_0/0.95)]"
          style={{ padding: bezel, borderRadius: kind === "tablet" ? 34 : 14 }}
        >
          <div className="relative overflow-hidden" style={{ width: width * scale, height: height * scale, borderRadius: kind === "tablet" ? 18 : 6 }}>
            {/* transform makes this the containing block for fixed overlays inside the device */}
            <div className="absolute top-0 left-0 origin-top-left" style={{ width, height, transform: `scale(${scale})` }}>
              {children}
            </div>
          </div>
        </div>
        {kind === "monitor" && (
          <div aria-hidden="true" className="w-[18%] h-7 bg-gradient-to-b from-[#1c1c1c] to-[#0c0c0c] [clip-path:polygon(20%_0,80%_0,100%_100%,0_100%)]" />
        )}
        <figcaption className="mt-3 eyebrow text-white/55">{label}</figcaption>
      </figure>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Waiter tablet                                                       */
/* ------------------------------------------------------------------ */

const titles: Record<WaiterRoute["screen"], string> = {
  map: "Mesas",
  menu: "Nueva comanda",
  order: "Revisa antes de enviar",
  tracking: "Seguimiento del pedido",
  closing: "Cierre de mesa",
};

function WaiterTablet({ images }: Props) {
  const screen = useStore($screen);
  const now = useStore($now);
  const table = screen.screen === "map" ? null : screen.table;
  const back: WaiterRoute | null =
    screen.screen === "map" ? null : screen.screen === "order" ? { screen: "menu", table: screen.table } : { screen: "map" };

  return (
    <div className="h-full bg-surface text-ink flex flex-col">
      <header className="h-16 shrink-0 px-5 flex items-center gap-3 border-b border-line bg-surface">
        {back ? (
          <button type="button" onClick={() => stageGo(back)} className="press -ml-2 h-12 pl-1 pr-3 rounded-xl font-semibold inline-flex items-center gap-1 hover:bg-ink/5">
            <ChevronLeft size={22} aria-hidden="true" /> {back.screen === "menu" ? "Menú" : "Mesas"}
          </button>
        ) : (
          <span className="display text-[1.4rem] leading-none">
            <span className="bg-brand text-white px-1.5 rounded-sm inline-block -rotate-2">Grill</span> Perrón
          </span>
        )}
        <div className="ml-auto flex items-center gap-3">
          <span className="font-mono font-bold">{clock(now)}</span>
          <span className="flex items-center gap-2 h-10 pl-1 pr-3 rounded-full bg-white border border-line">
            <span className="grid place-items-center size-8 rounded-full bg-ink text-white text-[0.7rem] font-bold">MI</span>
            <span className="text-[0.85rem] font-bold">Misael</span>
          </span>
        </div>
      </header>

      <div data-waiter-scroll className="flex-1 min-h-0 overflow-y-auto px-5 pb-8">
        <div className="pt-5 pb-4">
          <p className="eyebrow text-brand">{table ? titles[screen.screen] : "Servicio en curso"}</p>
          <h2 className="display text-[3.4rem] mt-1 inline-block" style={table ? { viewTransitionName: `table-${table}` } : undefined}>
            {table ? `Mesa ${pad2(table)}` : "Mesas"}
          </h2>
          {!table && <p className="text-muted font-medium">Vista general del restaurante</p>}
        </div>
        {screen.screen === "map" && <TableMap go={stageGo} />}
        {screen.screen === "menu" && (
          <div className="pb-20">
            <MenuCatalog table={screen.table} images={images} go={stageGo} contained />
          </div>
        )}
        {screen.screen === "order" && <OrderComposer table={screen.table} go={stageGo} />}
        {screen.screen === "tracking" && <OrderTracking table={screen.table} go={stageGo} />}
        {screen.screen === "closing" && <OrderClosing table={screen.table} go={stageGo} />}
      </div>
      <Toaster scope="waiter" contained />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Kitchen display                                                     */
/* ------------------------------------------------------------------ */

function KitchenScreen() {
  const now = useStore($now);
  return (
    <div className="h-full bg-ink text-white flex flex-col px-5 pb-5 on-dark">
      <header className="h-[4.5rem] shrink-0 flex items-center gap-4">
        <span className="display text-[1.5rem] leading-none">
          <span className="bg-brand text-white px-1.5 rounded-sm inline-block -rotate-2">Grill</span> Perrón
        </span>
        <span className="h-7 w-px bg-white/15" aria-hidden="true" />
        <span className="display text-[1.8rem] tracking-[0.04em]">Cocina</span>
        <span className="ml-auto inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-white/8 text-[0.8rem] font-semibold">
          <span className="size-2 rounded-full bg-ready-bright" /> <Wifi size={14} aria-hidden="true" /> En vivo
        </span>
        <span className="font-mono font-bold text-[1.5rem]">{clock(now)}</span>
      </header>
      <div className="flex-1 min-h-0">
        <KitchenBoard />
      </div>
      <Toaster scope="kitchen" contained />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sync wire between devices                                           */
/* ------------------------------------------------------------------ */

const toKitchen = new Set(["ORDER_CREATED"]);
const toWaiter = new Set(["ORDER_STARTED", "STATION_READY", "ORDER_READY"]);
const wireLabels: Record<string, string> = {
  ORDER_CREATED: "Comanda enviada",
  ORDER_STARTED: "En preparación",
  STATION_READY: "Estación lista",
  ORDER_READY: "Pedido listo",
};

function SyncWire() {
  const last = useStore($lastEvent);
  const visible = last && (toKitchen.has(last.type) || toWaiter.has(last.type));
  const dir = last && toKitchen.has(last.type) ? "right" : "left";
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center gap-3" aria-hidden="true">
      <div className="relative w-full h-[3px] rounded-full bg-white/10 overflow-hidden">
        {visible && <span key={last.seq} className={`absolute inset-y-0 w-1/3 rounded-full bg-brand wire-${dir}`} />}
      </div>
      <span key={last?.seq ?? 0} className={`text-[0.72rem] font-bold uppercase tracking-[0.12em] text-center ${visible ? "text-white animate-rise" : "text-white/35"}`}>
        {visible ? `${wireLabels[last.type]} ${dir === "right" ? "→" : "←"}` : "Sincronizado"}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Automatic tour (~45 s). Taps real controls; never blocks the user.  */
/* ------------------------------------------------------------------ */

type Step = { at: number; run: () => void };

function tap(selector: string): boolean {
  const el = document.querySelector<HTMLElement>(`[data-stage] [data-tour="${selector}"]`);
  if (!el) return false;
  revealInScroller(el);
  el.setAttribute("data-tapping", "");
  window.setTimeout(() => {
    el.click();
    el.removeAttribute("data-tapping");
  }, 380);
  return true;
}

function buildTour(): Step[] {
  const orderId = () => `o-${String($counters.get().nextOrderNumber - 1).padStart(3, "0")}`;
  const t = DEMO_TABLE;
  return [
    { at: 1800, run: () => tap(`table-${t}`) },
    { at: 4200, run: () => tap("cat-quesabirrias") },
    { at: 5600, run: () => tap("product-quesabirria") },
    { at: 7400, run: () => tap("qty-plus") },
    { at: 8200, run: () => tap("qty-plus") },
    { at: 9300, run: () => tap("extra-queso") },
    { at: 10900, run: () => tap("add-to-order") },
    { at: 12600, run: () => tap("cat-tacos") },
    { at: 13800, run: () => tap("product-taco-de-birria") },
    { at: 15300, run: () => tap("qty-plus") },
    { at: 16200, run: () => tap("mod-sin-cebolla") },
    { at: 17000, run: () => { const c = $composer.get(); if (c) $composer.set({ ...c, note: "Salsa aparte" }); } },
    { at: 18200, run: () => tap("add-to-order") },
    { at: 19800, run: () => tap("quick-consome") },
    { at: 21000, run: () => tap("quick-agua-horchata") },
    { at: 22600, run: () => tap("review-order") },
    { at: 25200, run: () => tap("send-order") },
    { at: 29000, run: () => tap(`start-${orderId()}`) },
    { at: 32800, run: () => tap(`station-${orderId()}-cocina`) },
    { at: 36200, run: () => tap(`ready-${orderId()}`) },
    { at: 40000, run: () => tap("deliver") },
    { at: 43200, run: () => tap("request-check") },
  ];
}

const TOUR_LENGTH = 45_000;

/* ------------------------------------------------------------------ */

export default function PresentationStage({ images }: Props) {
  const started = useStore($started);
  const last = useStore($lastEvent);
  const [tourAt, setTourAt] = useState<number | null>(null);
  const timers = useRef<number[]>([]);

  // Any real activity retires the hero.
  useEffect(() => {
    if (last && last.type !== "DEMO_RESET") $started.set(true);
  }, [last]);

  function stopTour() {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    setTourAt(null);
  }

  function reset() {
    stopTour();
    resetDemo();
    $composer.set(null);
    $screen.set({ screen: "map" });
    $started.set(false);
  }

  function startTour() {
    reset();
    $started.set(true);
    const t0 = Date.now();
    setTourAt(0);
    for (const step of buildTour()) timers.current.push(window.setTimeout(step.run, step.at));
    const tick = window.setInterval(() => {
      const elapsed = Date.now() - t0;
      if (elapsed >= TOUR_LENGTH) {
        window.clearInterval(tick);
        setTourAt(null);
        return;
      }
      setTourAt(elapsed);
    }, 250);
    timers.current.push(tick);
  }

  useEffect(() => () => stopTour(), []);

  const running = tourAt !== null;

  return (
    <div className="h-dvh flex flex-col bg-ink text-white on-dark overflow-hidden">
      <header className="h-16 shrink-0 px-6 flex items-center gap-4 border-b border-white/8">
        <p className="display text-[1.35rem] tracking-[0.06em]">
          Grill Perrón <span className="text-brand">·</span> Demo interactiva
        </p>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={running ? stopTour : startTour}
            className={`press relative overflow-hidden h-11 pl-3.5 pr-4 rounded-xl font-bold text-[0.9rem] inline-flex items-center gap-2 ${
              running ? "bg-white text-ink" : "bg-brand hover:bg-brand-deep text-white"
            }`}
          >
            {running ? <Pause size={17} aria-hidden="true" /> : <Play size={17} fill="currentColor" aria-hidden="true" />}
            {running ? "Detener recorrido" : "Ver recorrido automático"}
            {running && (
              <span className="absolute left-0 bottom-0 h-[3px] bg-brand transition-[width] duration-200" style={{ width: `${(tourAt / TOUR_LENGTH) * 100}%` }} />
            )}
          </button>
          <button
            type="button"
            onClick={reset}
            className="press h-11 px-3.5 rounded-xl text-white/60 hover:text-white hover:bg-white/8 font-semibold text-[0.85rem] inline-flex items-center gap-2"
          >
            <RotateCcw size={16} aria-hidden="true" /> Reiniciar demo
          </button>
        </div>
      </header>

      <div
        className={`shrink-0 overflow-hidden text-center transition-[max-height,opacity,padding] duration-500 ease-out ${
          started ? "max-h-0 opacity-0 py-0" : "max-h-[16rem] opacity-100 pt-7 pb-2"
        }`}
        aria-hidden={started}
      >
        <p className="display text-[clamp(2.6rem,5.2vw,4.8rem)] leading-[0.92]">
          Un pedido. Dos áreas.
          <br />
          <span className="text-brand">Cero llamadas a cocina.</span>
        </p>
        <p className="mt-3 text-white/55 font-medium">Toca una mesa en la tablet o inicia el recorrido automático.</p>
      </div>

      <main data-stage className="flex-1 min-h-0 grid grid-cols-[minmax(0,0.78fr)_7rem_minmax(0,1.22fr)] items-center px-6 pt-4 pb-4 gap-2">
        <Device width={768} height={1024} kind="tablet" label="Tablet · Mesero">
          <WaiterTablet images={images} />
        </Device>
        <SyncWire />
        <Device width={1280} height={800} kind="monitor" label="Pantalla · Cocina">
          <KitchenScreen />
        </Device>
      </main>
    </div>
  );
}
