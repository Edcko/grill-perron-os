import { useStore } from "@nanostores/react";
import { ArrowRight, BellRing, Check, ChefHat, Clock3, CupSoda, Flame, Send, UtensilsCrossed, type LucideIcon } from "lucide-react";
import { stations as stationMeta } from "../../data/products";
import type { Order, StationId, StationStatus } from "../../data/types";
import { goWithRouter, type Go } from "../../lib/nav";
import { itemCount, lineDetails, linesByStation, productName, ticketNumber } from "../../lib/orders";
import { clock } from "../../lib/time";
import { deliverOrder } from "../../stores/demo";
import { $orders } from "../../stores/orders";
import { $tables } from "../../stores/restaurant";
import { Chip } from "../ui/Chip";
import { Timer } from "../ui/Timer";

interface Props {
  table: number;
  go?: Go;
}

const stationIcons: Record<StationId, LucideIcon> = { parrilla: Flame, cocina: ChefHat, barra: CupSoda };

const stationState: Record<StationStatus, { label: string; icon: LucideIcon; chip: string; card: string }> = {
  pending: { label: "Pendiente", icon: Clock3, chip: "bg-ink/6 text-ink ring-1 ring-inset ring-ink/15", card: "bg-white" },
  preparing: { label: "En preparación", icon: Flame, chip: "bg-warn-soft text-warn ring-1 ring-inset ring-warn/25", card: "bg-white" },
  ready: { label: "Listo", icon: Check, chip: "bg-ready text-white", card: "bg-ready-soft" },
};

function Steps({ order }: { order: Order }) {
  const steps = [
    { label: "Enviada", at: order.sentAt, icon: Send },
    { label: "En preparación", at: order.startedAt, icon: Flame },
    { label: "Lista", at: order.readyAt, icon: BellRing },
    { label: "Entregada", at: order.deliveredAt, icon: UtensilsCrossed },
  ];
  const current = steps.findIndex((s) => !s.at);
  return (
    <ol className="grid grid-cols-4 gap-2" aria-label="Progreso del pedido">
      {steps.map((s, i) => {
        const done = Boolean(s.at);
        const active = i === current;
        return (
          <li key={s.label} className="flex flex-col gap-2" aria-current={active ? "step" : undefined}>
            <span className={`h-1.5 rounded-full ${done ? "bg-ink" : active ? "bg-ink/25 overflow-hidden relative" : "bg-ink/10"}`}>
              {active && <span className="absolute inset-y-0 left-0 w-1/2 bg-ink/60 rounded-full animate-pulse" />}
            </span>
            <span className={`flex items-center gap-1.5 text-[0.8rem] font-bold uppercase tracking-[0.06em] ${done ? "text-ink" : "text-muted"}`}>
              <s.icon size={14} aria-hidden="true" />
              <span className="truncate">{s.label}</span>
            </span>
            <span className="font-mono text-[0.8rem] text-muted">{s.at ? clock(s.at) : "—"}</span>
          </li>
        );
      })}
    </ol>
  );
}

export default function OrderTracking({ table, go = goWithRouter }: Props) {
  const tables = useStore($tables);
  const orders = useStore($orders);
  const t = tables[table];
  const order = t?.orderId ? orders[t.orderId] : undefined;

  if (!t) return null;

  if (!order) {
    return (
      <div className="rounded-[var(--radius-card)] border-2 border-dashed border-ink/12 py-16 px-6 text-center max-w-xl mx-auto mt-4">
        <UtensilsCrossed className="mx-auto text-ink/30" size={44} aria-hidden="true" />
        <p className="mt-4 display text-[2.2rem]">Sin pedido en cocina</p>
        <p className="mt-1 text-muted">Esta mesa no tiene una comanda activa.</p>
        <button
          type="button"
          onClick={() => go(t.status === "served" || t.status === "check" ? { screen: "closing", table } : { screen: "menu", table })}
          className="press mt-6 h-14 px-6 rounded-2xl bg-ink text-white font-bold inline-flex items-center gap-2"
        >
          {t.status === "served" || t.status === "check" ? "Ver cierre" : "Tomar pedido"} <ArrowRight size={20} aria-hidden="true" />
        </button>
      </div>
    );
  }

  const ready = order.status === "ready";
  const groups = linesByStation(order.lines);

  function deliver() {
    if (!order) return;
    deliverOrder(order.id);
    go({ screen: "closing", table });
  }

  return (
    <div className="@container flex flex-col gap-5">
      {ready ? (
        <section className="rounded-[1.75rem] bg-ready text-white p-6 @xl:p-8 shadow-lift animate-rise" aria-live="assertive">
          <div className="flex flex-col @2xl:flex-row @2xl:items-center gap-6">
            <span className="grid place-items-center size-20 shrink-0 rounded-full bg-white text-ready animate-pop">
              <svg viewBox="0 0 24 24" className="check-draw size-11" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            </span>
            <div className="flex-1">
              <p className="eyebrow text-white/75">Pasa a la barra · {ticketNumber(order.number)}</p>
              <h2 className="display text-[2.6rem] @xl:text-[3.3rem] mt-1">Pedido listo para entregar</h2>
            </div>
          </div>
          <button
            type="button"
            data-tour="deliver"
            onClick={deliver}
            className="press mt-6 w-full min-h-[4.75rem] rounded-2xl bg-white text-ink hover:bg-ready-soft display text-[1.9rem] tracking-[0.02em] inline-flex items-center justify-center gap-3"
          >
            <UtensilsCrossed size={26} aria-hidden="true" /> Marcar como entregado
          </button>
        </section>
      ) : (
        <section className="rounded-[1.75rem] bg-white shadow-card p-5 @xl:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <p className="eyebrow text-muted">Comanda {ticketNumber(order.number)}</p>
              <p className="mt-1 font-bold text-[1.2rem]">
                {order.status === "pending" ? "Esperando a cocina" : "Cocina está preparando tu pedido"}
              </p>
            </div>
            <Timer from={order.sentAt} size="xl" />
          </div>
          <Steps order={order} />
        </section>
      )}

      <section aria-label="Estaciones" className="grid gap-3 @2xl:grid-cols-2 @5xl:grid-cols-3">
        {groups.map(({ station, lines }) => {
          const status = order.stations[station] ?? "pending";
          const meta = stationState[status];
          const Icon = stationIcons[station];
          return (
            <article key={station} className={`rounded-[var(--radius-card)] p-5 shadow-card transition-colors duration-300 ${meta.card}`}>
              <header className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid place-items-center size-12 rounded-xl bg-ink text-white">
                    <Icon size={22} aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="display text-[1.9rem] leading-none">{stationMeta[station].label}</h3>
                    <p className="text-muted text-[0.9rem] font-semibold mt-1">
                      {itemCount(lines)} {itemCount(lines) === 1 ? "producto" : "productos"}
                    </p>
                  </div>
                </div>
                <Chip key={status} icon={meta.icon} label={meta.label} className={meta.chip} pulse />
              </header>
              <ul className="mt-4 flex flex-col gap-2 text-[0.98rem]">
                {lines.map((l) => (
                  <li key={l.id} className="flex gap-2">
                    <span className="font-mono font-bold w-6 text-right">{l.qty}</span>
                    <span>
                      <span className="font-semibold">{productName(l)}</span>
                      {lineDetails(l).length > 0 && (
                        <span className="text-muted"> · {lineDetails(l).map((d) => d.text).join(", ")}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </section>

      {!ready && (
        <p className="text-center text-muted text-[0.92rem] flex items-center justify-center gap-2">
          <span className="relative flex size-2.5">
            <span className="absolute inset-0 rounded-full bg-ready-bright animate-ping opacity-60" />
            <span className="relative rounded-full size-2.5 bg-ready-bright" />
          </span>
          Se actualiza solo cuando cocina cambia el estado
        </p>
      )}
    </div>
  );
}
