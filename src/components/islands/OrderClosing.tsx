import { useStore } from "@nanostores/react";
import { ArrowRight, Check, CircleCheckBig, Plus, Receipt } from "lucide-react";
import { money } from "../../lib/money";
import { goWithRouter, type Go } from "../../lib/nav";
import { itemCount, lineDetails, lineTotal, productName, ticketNumber } from "../../lib/orders";
import { clock } from "../../lib/time";
import { releaseTable, requestCheck, startNewRound } from "../../stores/demo";
import { $orders } from "../../stores/orders";
import { $tables } from "../../stores/restaurant";

interface Props {
  table: number;
  go?: Go;
}

export default function OrderClosing({ table, go = goWithRouter }: Props) {
  const tables = useStore($tables);
  const orders = useStore($orders);
  const t = tables[table];
  if (!t) return null;

  const served = t.history.map((id) => orders[id]).filter(Boolean);
  const lines = served.flatMap((o) => o.lines);
  const total = served.reduce((sum, o) => sum + o.lines.reduce((s, l) => s + lineTotal(l), 0), 0);
  const isCheck = t.status === "check";

  if (served.length === 0) {
    return (
      <div className="rounded-[var(--radius-card)] border-2 border-dashed border-ink/12 py-16 px-6 text-center max-w-xl mx-auto mt-4">
        <Receipt className="mx-auto text-ink/30" size={44} aria-hidden="true" />
        <p className="mt-4 display text-[2.2rem]">Nada que cerrar</p>
        <p className="mt-1 text-muted">Esta mesa todavía no tiene pedidos entregados.</p>
        <button type="button" onClick={() => go({ screen: "map" })} className="press mt-6 h-14 px-6 rounded-2xl bg-ink text-white font-bold inline-flex items-center gap-2">
          Volver a mesas <ArrowRight size={20} aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div className="@container">
      <div className="grid gap-6 @4xl:grid-cols-[minmax(0,1fr)_24rem] items-start">
        <div className="flex flex-col gap-5">
          <section className="flex items-center gap-5 animate-rise">
            <span className={`grid place-items-center size-20 shrink-0 rounded-full ${isCheck ? "bg-brand" : "bg-ready"} text-white`}>
              {isCheck ? (
                <Receipt size={36} aria-hidden="true" />
              ) : (
                <svg viewBox="0 0 24 24" className="check-draw size-11" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              )}
            </span>
            <div>
              <h2 className="display text-[2.8rem] @xl:text-[3.4rem]">{isCheck ? "Cuenta solicitada" : "Pedido entregado"}</h2>
              <p className="text-muted font-medium text-[1.05rem]">
                {isCheck ? "Lleva la cuenta a la mesa y cobra al terminar." : "Todos los productos han sido servidos."}
              </p>
            </div>
          </section>

          <article className="ticket shadow-lift" aria-label="Resumen de consumo">
            <header className="px-6 pt-6 pb-4 flex flex-wrap justify-between gap-3">
              <div>
                <p className="eyebrow text-muted">Resumen · {t.guests} personas</p>
                <p className="mt-1 font-bold">{served.map((o) => ticketNumber(o.number)).join(" · ")}</p>
              </div>
              <p className="text-right text-muted text-[0.9rem]">
                Entregado {clock(served[served.length - 1].deliveredAt ?? Date.now())}
              </p>
            </header>
            <div className="perforation mx-6" />
            <ul className="px-6 py-3 divide-y divide-ink/8">
              {lines.map((l) => (
                <li key={`${l.id}`} className="py-3 flex items-start gap-3">
                  <span className="font-mono font-bold w-6 text-right">{l.qty}</span>
                  <span className="flex-1 min-w-0">
                    <span className="font-semibold">{productName(l)}</span>
                    {lineDetails(l).length > 0 && (
                      <span className="block text-muted text-[0.88rem]">{lineDetails(l).map((d) => d.text).join(" · ")}</span>
                    )}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-ready text-[0.78rem] font-bold uppercase tracking-[0.06em]">
                    <Check size={14} strokeWidth={3} aria-hidden="true" /> Servido
                  </span>
                  <span className="font-mono font-bold w-24 text-right">{money(lineTotal(l))}</span>
                </li>
              ))}
            </ul>
            <div className="perforation mx-6" />
            <footer className="px-6 pt-4 pb-6 flex items-baseline justify-between">
              <span className="display text-[2rem]">Total</span>
              <span className="font-mono font-bold text-[2rem]">{money(total)}</span>
            </footer>
          </article>
        </div>

        <aside className="@4xl:sticky @4xl:top-24 flex flex-col gap-3">
          <div className="rounded-[var(--radius-card)] bg-white shadow-card p-5">
            <p className="eyebrow text-muted">Mesa {String(table).padStart(2, "0")}</p>
            <p className="mt-2 flex items-center gap-2 font-bold text-[1.1rem]">
              <CircleCheckBig size={20} className="text-ready" aria-hidden="true" />
              {itemCount(lines)} productos servidos
            </p>
            <p className="mt-1 font-mono font-bold text-[2.2rem]">{money(total)}</p>
          </div>
          {isCheck ? (
            <button
              type="button"
              onClick={() => {
                releaseTable(table);
                go({ screen: "map" });
              }}
              className="press w-full min-h-[5rem] rounded-2xl bg-ink text-white display text-[1.8rem] tracking-[0.02em] inline-flex items-center justify-center gap-3"
            >
              Cobrar y liberar mesa
            </button>
          ) : (
            <>
              <button
                type="button"
                data-tour="request-check"
                onClick={() => {
                  requestCheck(table);
                  go({ screen: "map" });
                }}
                className="press w-full min-h-[5rem] rounded-2xl bg-brand hover:bg-brand-deep text-white shadow-lift display text-[2rem] tracking-[0.02em] inline-flex items-center justify-center gap-3"
              >
                Solicitar cuenta <ArrowRight size={28} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => {
                  startNewRound(table);
                  go({ screen: "menu", table });
                }}
                className="press w-full h-16 rounded-2xl bg-white ring-1 ring-inset ring-ink/15 hover:ring-ink/40 font-bold uppercase tracking-[0.06em] inline-flex items-center justify-center gap-2"
              >
                <Plus size={20} aria-hidden="true" /> Nuevo pedido
              </button>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
