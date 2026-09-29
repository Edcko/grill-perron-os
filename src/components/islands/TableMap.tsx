import { useStore } from "@nanostores/react";
import { Clock3, Hash, Users, UtensilsCrossed } from "lucide-react";
import type { MouseEvent } from "react";
import type { Table, TableStatus } from "../../data/types";
import { goWithRouter, type Go, type WaiterRoute } from "../../lib/nav";
import { ticketNumber } from "../../lib/orders";
import { minutesSince, pad2 } from "../../lib/time";
import { openTable } from "../../stores/demo";
import { $orders } from "../../stores/orders";
import { $now, $tableFilter, $tables, filterMatches, type TableFilter } from "../../stores/restaurant";
import { Chip } from "../ui/Chip";
import { tableStatus } from "../ui/status";

interface Props {
  go?: Go;
}

const filters: { id: TableFilter; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "occupied", label: "Ocupadas" },
  { id: "free", label: "Libres" },
  { id: "preparing", label: "En preparación" },
  { id: "ready", label: "Listas" },
];

function routeFor(t: Table): WaiterRoute {
  switch (t.status) {
    case "free":
    case "ordering":
      return { screen: "menu", table: t.id };
    case "pending":
    case "preparing":
    case "ready":
      return { screen: "tracking", table: t.id };
    case "served":
    case "check":
      return { screen: "closing", table: t.id };
  }
}

const cardTone: Record<TableStatus, string> = {
  free: "bg-transparent border-2 border-dashed border-ink/15 text-ink hover:border-ink/35 hover:bg-white",
  ordering: "bg-white border-2 border-ink shadow-card",
  pending: "bg-white border-2 border-transparent shadow-card",
  preparing: "bg-white border-2 border-transparent shadow-card",
  ready: "bg-white border-2 border-ready shadow-card ring-4 ring-ready/15",
  served: "bg-white border-2 border-transparent shadow-card",
  check: "bg-brand border-2 border-brand text-white shadow-card",
};

export default function TableMap({ go = goWithRouter }: Props) {
  const tables = Object.values(useStore($tables)).sort((a, b) => a.id - b.id);
  const orders = useStore($orders);
  const filter = useStore($tableFilter);
  const now = useStore($now);

  const counts = Object.fromEntries(filters.map((f) => [f.id, tables.filter((t) => filterMatches[f.id](t.status)).length]));
  const visible = tables.filter((t) => filterMatches[filter](t.status));
  const zones = (["Salón", "Terraza"] as const)
    .map((zone) => ({ zone, tables: visible.filter((t) => t.zone === zone) }))
    .filter((z) => z.tables.length > 0);

  function select(t: Table, e: MouseEvent<HTMLButtonElement>) {
    // Give the tapped card a name so it morphs into the next screen's header.
    e.currentTarget.style.viewTransitionName = `table-${t.id}`;
    if (t.status === "free") openTable(t.id, 2);
    go(routeFor(t));
  }

  return (
    <div className="@container">
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1" role="toolbar" aria-label="Filtrar mesas">
        {filters.map((f) => {
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => $tableFilter.set(f.id)}
              aria-pressed={active}
              className={`press shrink-0 inline-flex items-center gap-2 h-12 pl-4 pr-3 rounded-full text-[0.95rem] font-semibold ${
                active ? "bg-ink text-white" : "bg-white text-ink ring-1 ring-inset ring-ink/10 hover:ring-ink/30"
              }`}
            >
              {f.label}
              <span className={`min-w-7 h-7 px-1.5 grid place-items-center rounded-full font-mono text-[0.78rem] ${active ? "bg-white/15" : "bg-ink/6"}`}>
                {counts[f.id]}
              </span>
            </button>
          );
        })}
      </div>

      {zones.length === 0 && (
        <div className="mt-6 rounded-[var(--radius-card)] border-2 border-dashed border-ink/12 py-16 px-6 text-center">
          <UtensilsCrossed className="mx-auto text-ink/30" size={40} aria-hidden="true" />
          <p className="mt-4 display text-[2rem]">Nada por aquí</p>
          <p className="mt-1 text-muted">Ninguna mesa coincide con este filtro.</p>
          <button type="button" onClick={() => $tableFilter.set("all")} className="press mt-5 h-12 px-5 rounded-xl bg-ink text-white font-semibold">
            Ver todas las mesas
          </button>
        </div>
      )}

      {zones.map(({ zone, tables: list }) => (
        <section key={zone} className="mt-6" aria-label={zone}>
          <h2 className="eyebrow text-muted mb-3 flex items-center gap-3">
            {zone}
            <span className="h-px flex-1 bg-ink/10" aria-hidden="true" />
          </h2>
          <ul className="grid grid-cols-2 @xl:grid-cols-3 @4xl:grid-cols-4 gap-3 @xl:gap-4">
            {list.map((t) => {
              const meta = tableStatus[t.status];
              const order = t.orderId ? orders[t.orderId] : undefined;
              const dark = t.status === "check";
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    data-tour={`table-${t.id}`}
                    onClick={(e) => select(t, e)}
                    className={`press group w-full text-left rounded-[var(--radius-card)] p-4 @xl:p-5 min-h-[10.5rem] flex flex-col ${cardTone[t.status]}`}
                    aria-label={`Mesa ${pad2(t.id)}, ${meta.label}${t.guests ? `, ${t.guests} personas` : ""}`}
                  >
                    <span className="flex items-start justify-between gap-2">
                      <span className="display text-[3.4rem] @xl:text-[3.9rem] leading-[0.8] tracking-tight">{pad2(t.id)}</span>
                      <span className={`inline-flex items-center gap-1 text-[0.78rem] font-semibold ${dark ? "text-white/80" : "text-muted"}`}>
                        <Users size={14} aria-hidden="true" />
                        {t.seats}
                      </span>
                    </span>

                    <span className={`mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.88rem] font-semibold ${dark ? "text-white/90" : "text-ink/80"}`}>
                      {t.status === "free" ? (
                        <span className="text-muted font-medium">{t.seats} lugares</span>
                      ) : (
                        <>
                          <span>{t.guests} {t.guests === 1 ? "persona" : "personas"}</span>
                          {t.openedAt && (
                            <span className="inline-flex items-center gap-1">
                              <Clock3 size={13} aria-hidden="true" />
                              {minutesSince(t.openedAt, now)} min
                            </span>
                          )}
                          {order && (
                            <span className="inline-flex items-center gap-0.5 font-mono text-[0.8rem]">
                              <Hash size={12} aria-hidden="true" />
                              {ticketNumber(order.number).slice(1)}
                            </span>
                          )}
                        </>
                      )}
                    </span>

                    <span className="mt-auto pt-4">
                      <Chip
                        icon={meta.icon}
                        label={meta.short}
                        size="sm"
                        pulse={t.status === "ready"}
                        className={dark ? "bg-white text-brand" : meta.chip}
                      />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
