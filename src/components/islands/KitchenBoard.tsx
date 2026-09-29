import { useStore } from "@nanostores/react";
import { BellRing, Check, ChefHat, Clock3, CupSoda, Flame, Play, ShoppingBag, TriangleAlert, Users, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { revealInScroller } from "../../lib/reveal";
import { stations as stationMeta } from "../../data/products";
import type { Order, OrderStatus, StationId } from "../../data/types";
import { lineDetails, linesByStation, productName, ticketNumber } from "../../lib/orders";
import { deliverOrder, markReady, markStationReady, startOrder } from "../../stores/demo";
import { $freshOrders, $kitchenLanes } from "../../stores/orders";
import { Timer } from "../ui/Timer";

type Lane = Exclude<OrderStatus, "delivered">;

const lanes: { id: Lane; label: string; icon: LucideIcon; empty: string }[] = [
  { id: "pending", label: "Pendientes", icon: Clock3, empty: "Sin comandas nuevas. Las que envíen los meseros aparecerán aquí." },
  { id: "preparing", label: "En preparación", icon: Flame, empty: "Nada en el fuego por ahora." },
  { id: "ready", label: "Listos", icon: BellRing, empty: "Aún no hay pedidos esperando entrega." },
];

const stationIcons: Record<StationId, LucideIcon> = { parrilla: Flame, cocina: ChefHat, barra: CupSoda };

const statusChip: Record<Lane, { label: string; className: string; icon: LucideIcon }> = {
  pending: { label: "Pendiente", className: "bg-ink text-white", icon: Clock3 },
  preparing: { label: "En preparación", className: "bg-warn-bright text-ink", icon: Flame },
  ready: { label: "Listo", className: "bg-ready text-white", icon: Check },
};

function Ticket({ order, fresh }: { order: Order; fresh: boolean }) {
  const status = order.status as Lane;
  const chip = statusChip[status];
  const ref = useRef<HTMLElement>(null);
  const seen = useRef(order.status);

  // Bring a ticket into view when it arrives or moves to another lane.
  useEffect(() => {
    if (fresh || seen.current !== order.status) {
      seen.current = order.status;
      const id = window.setTimeout(() => ref.current && revealInScroller(ref.current, "nearest"), 60);
      return () => window.clearTimeout(id);
    }
  }, [fresh, order.status]);

  const notes = order.lines.filter((l) => l.note).map((l) => ({ id: l.id, product: productName(l), text: l.note }));

  return (
    <article
      ref={ref}
      data-tour={`kds-${order.id}`}
      className={`ticket text-ink shadow-[0_18px_40px_-20px_rgb(0_0_0/0.8)] ${fresh ? "animate-arrive" : ""}`}
      aria-label={`${order.label}, ${chip.label}`}
    >
      <header className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 eyebrow text-muted">
              {ticketNumber(order.number)} · {order.waiter}
              {fresh && <span className="h-6 px-2 rounded-md bg-brand text-white tracking-[0.1em] inline-flex items-center">Nueva</span>}
            </p>
            <h3 className="display text-[2.35rem] leading-[0.9] mt-1.5 truncate">
              {order.table ? `Mesa ${String(order.table).padStart(2, "0")}` : order.label.replace("Para llevar · ", "")}
            </h3>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Timer from={status === "ready" && order.readyAt ? order.readyAt : order.sentAt} size="xl" showLevel={status !== "ready"} />
            {status === "ready" && <span className="text-[0.7rem] font-bold uppercase tracking-[0.08em] text-muted">Esperando entrega</span>}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.92rem] font-semibold">
          {order.table ? (
            <span className="inline-flex items-center gap-1.5">
              <Users size={16} aria-hidden="true" /> {order.guests} personas
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <ShoppingBag size={16} aria-hidden="true" /> Para llevar
            </span>
          )}
          <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[0.72rem] font-bold uppercase tracking-[0.08em] ${chip.className}`}>
            <chip.icon size={13} strokeWidth={2.75} aria-hidden="true" /> {chip.label}
          </span>
        </div>
      </header>

      <div className="perforation mx-5" />

      <div className="px-5 py-3 flex flex-col divide-y divide-ink/8">
        {linesByStation(order.lines).map(({ station, lines }) => {
          const sStatus = order.stations[station];
          const Icon = stationIcons[station];
          const done = sStatus === "ready";
          return (
            <section key={station} className="py-3" aria-label={stationMeta[station].label}>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className={`eyebrow inline-flex items-center gap-1.5 ${done ? "text-ready" : "text-muted"}`}>
                  <Icon size={14} aria-hidden="true" /> {stationMeta[station].label}
                  {done && (
                    <span className="inline-flex items-center gap-1 text-ready">
                      <Check size={13} strokeWidth={3} aria-hidden="true" /> Lista
                    </span>
                  )}
                </span>
                {status === "preparing" && !done && (
                  <button
                    type="button"
                    data-tour={`station-${order.id}-${station}`}
                    onClick={() => markStationReady(order.id, station)}
                    className="press h-10 px-3 rounded-lg ring-1 ring-inset ring-ink/15 hover:bg-ready-soft hover:ring-ready/40 text-[0.78rem] font-bold uppercase tracking-[0.06em] inline-flex items-center gap-1.5"
                    aria-label={`Marcar ${stationMeta[station].label} lista`}
                  >
                    <Check size={15} strokeWidth={3} aria-hidden="true" /> Lista
                  </button>
                )}
              </div>
              <ul className={`flex flex-col gap-2.5 ${done ? "opacity-45" : ""}`}>
                {lines.map((l) => {
                  const details = lineDetails(l).filter((d) => d.kind !== "note");
                  return (
                    <li key={l.id} className="grid grid-cols-[2.25rem_1fr] gap-2">
                      <span className="font-mono font-bold text-[1.35rem] leading-none pt-0.5 text-right">{l.qty}</span>
                      <div>
                        <p className={`font-bold text-[1.2rem] leading-tight ${done ? "line-through decoration-2" : ""}`}>
                          {productName(l)}
                        </p>
                        {details.length > 0 && (
                          <p className="mt-0.5 text-[0.98rem] text-ink/75 font-medium">
                            {details.map((d, i) => (
                              <span key={d.text}>
                                {i > 0 && <span className="text-ink/30"> · </span>}
                                <span className={d.kind === "extra" ? "font-bold text-ink" : ""}>{d.kind === "extra" ? `+ ${d.text}` : d.text}</span>
                              </span>
                            ))}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      {notes.length > 0 && (
        <div className="mx-5 mb-4 rounded-xl bg-warn-soft ring-1 ring-inset ring-warn/30 px-3.5 py-3 text-warn">
          <p className="eyebrow flex items-center gap-1.5">
            <TriangleAlert size={14} aria-hidden="true" /> Nota
          </p>
          {notes.map((n) => (
            <p key={n.id} className="mt-1 font-bold text-[1rem] text-ink">
              {n.text} <span className="font-medium text-ink/60">· {n.product}</span>
            </p>
          ))}
        </div>
      )}

      <div className="px-5 pb-4">
        {status === "pending" && (
          <button
            type="button"
            data-tour={`start-${order.id}`}
            onClick={() => startOrder(order.id)}
            className="press w-full min-h-16 rounded-xl bg-ink hover:bg-ink-3 text-white display text-[1.55rem] tracking-[0.03em] inline-flex items-center justify-center gap-3"
          >
            <Play size={22} fill="currentColor" aria-hidden="true" /> Iniciar preparación
          </button>
        )}
        {status === "preparing" && (
          <button
            type="button"
            data-tour={`ready-${order.id}`}
            onClick={() => markReady(order.id)}
            className="press w-full min-h-16 rounded-xl bg-ready hover:bg-[#12662f] text-white display text-[1.55rem] tracking-[0.03em] inline-flex items-center justify-center gap-3"
          >
            <Check size={26} strokeWidth={3} aria-hidden="true" /> Marcar listo
          </button>
        )}
        {status === "ready" &&
          (order.table ? (
            <p className="min-h-14 rounded-xl bg-ready-soft text-ready font-bold inline-flex w-full items-center justify-center gap-2 text-[0.98rem]">
              <BellRing size={18} aria-hidden="true" /> {order.waiter} ya fue avisado
            </p>
          ) : (
            <button
              type="button"
              onClick={() => deliverOrder(order.id)}
              className="press w-full min-h-14 rounded-xl ring-2 ring-inset ring-ink/15 hover:bg-ink hover:text-white font-bold uppercase tracking-[0.06em] inline-flex items-center justify-center gap-2"
            >
              <ShoppingBag size={18} aria-hidden="true" /> Entregado al cliente
            </button>
          ))}
      </div>
    </article>
  );
}

export default function KitchenBoard() {
  const board = useStore($kitchenLanes);
  const fresh = useStore($freshOrders);
  const [tab, setTab] = useState<Lane>("pending");

  return (
    <div className="@container on-dark text-white h-full flex flex-col">
      <div role="tablist" aria-label="Estados de comandas" className="flex gap-2 overflow-x-auto no-scrollbar pb-4 @6xl:hidden">
        {lanes.map((lane) => {
          const active = tab === lane.id;
          return (
            <button
              key={lane.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`lane-${lane.id}`}
              onClick={() => setTab(lane.id)}
              className={`press shrink-0 h-14 px-5 rounded-2xl inline-flex items-center gap-2.5 font-bold uppercase tracking-[0.06em] text-[0.95rem] ${
                active ? "bg-white text-ink" : "bg-white/8 text-white hover:bg-white/14"
              }`}
            >
              <lane.icon size={18} aria-hidden="true" />
              {lane.label}
              <span className="font-mono">({board[lane.id].length})</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 min-h-0 grid @6xl:grid-cols-3 gap-5">
        {lanes.map((lane) => {
          const list = board[lane.id];
          return (
            <section
              key={lane.id}
              id={`lane-${lane.id}`}
              role="tabpanel"
              aria-label={`${lane.label} (${list.length})`}
              className={`${tab === lane.id ? "flex" : "hidden"} @6xl:flex flex-col min-h-0 rounded-[1.5rem] bg-ink-2 ring-1 ring-white/6`}
            >
              <header className="hidden @6xl:flex items-center justify-between gap-3 px-5 h-16 border-b border-white/8">
                <h2 className="flex items-center gap-2.5 font-bold uppercase tracking-[0.08em] text-[1rem]">
                  <lane.icon size={19} aria-hidden="true" className={lane.id === "ready" ? "text-ready-bright" : lane.id === "preparing" ? "text-warn-bright" : "text-white"} />
                  {lane.label}
                  <span className="font-mono text-white/60">({list.length})</span>
                </h2>
              </header>
              <div className="flex-1 min-h-0 overflow-y-auto p-4 grid content-start gap-5 @3xl:grid-cols-2 @6xl:grid-cols-1">
                {list.length === 0 ? (
                  <div className="col-span-full rounded-2xl border-2 border-dashed border-white/10 px-6 py-12 text-center text-white/55">
                    <lane.icon size={30} className="mx-auto mb-3 opacity-60" aria-hidden="true" />
                    <p className="font-semibold">{lane.empty}</p>
                  </div>
                ) : (
                  list.map((o) => <Ticket key={o.id} order={o} fresh={fresh.includes(o.id)} />)
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

