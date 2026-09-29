import { useStore } from "@nanostores/react";
import { ArrowRight, NotebookPen, Plus, Save, Send, ShoppingBasket, Trash2 } from "lucide-react";
import { useState } from "react";
import { productById } from "../../data/products";
import { money } from "../../lib/money";
import { goWithRouter, type Go } from "../../lib/nav";
import { itemCount, lineDetails, lineTotal, linesTotal, productName, ticketNumber } from "../../lib/orders";
import { saveDraft, sendOrder, setLineQty } from "../../stores/demo";
import { $counters, $drafts } from "../../stores/orders";
import { $tables } from "../../stores/restaurant";
import { $user } from "../../stores/session";
import { Stepper } from "../ui/Stepper";

interface Props {
  table: number;
  go?: Go;
}

export default function OrderComposer({ table, go = goWithRouter }: Props) {
  const tables = useStore($tables);
  const drafts = useStore($drafts);
  const counters = useStore($counters);
  const user = useStore($user);
  const [sending, setSending] = useState(false);

  const t = tables[table];
  const lines = drafts[table] ?? [];
  const total = linesTotal(lines);
  const count = itemCount(lines);

  if (!t) return null;

  if (lines.length === 0 && !sending) {
    const sent = t.status === "pending" || t.status === "preparing" || t.status === "ready";
    return (
      <div className="rounded-[var(--radius-card)] border-2 border-dashed border-ink/12 py-16 px-6 text-center max-w-xl mx-auto mt-4">
        <ShoppingBasket className="mx-auto text-ink/30" size={44} aria-hidden="true" />
        <p className="mt-4 display text-[2.2rem]">{sent ? "Comanda ya enviada" : "Comanda vacía"}</p>
        <p className="mt-1 text-muted">
          {sent ? "Esta mesa ya tiene un pedido en cocina." : "Agrega platillos desde el menú para armar la comanda."}
        </p>
        <button
          type="button"
          onClick={() => go(sent ? { screen: "tracking", table } : { screen: "menu", table })}
          className="press mt-6 h-14 px-6 rounded-2xl bg-ink text-white font-bold inline-flex items-center gap-2"
        >
          {sent ? "Ver seguimiento" : "Ir al menú"} <ArrowRight size={20} aria-hidden="true" />
        </button>
      </div>
    );
  }

  function send() {
    setSending(true);
    const id = sendOrder(table);
    if (!id) return setSending(false);
    // Let the send icon finish its flight before moving on.
    window.setTimeout(() => go({ screen: "tracking", table }), 320);
  }

  function save() {
    saveDraft(table);
    go({ screen: "map" });
  }

  return (
    <div className="@container">
      <div className="grid gap-5 @4xl:grid-cols-[minmax(0,1fr)_22rem] @4xl:gap-8 items-start">
        <article className="ticket shadow-lift" aria-label="Comanda">
          <header className="px-5 @xl:px-7 pt-6 pb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="eyebrow text-muted">Comanda {ticketNumber(counters.nextOrderNumber)}</p>
              <p className="mt-1 font-bold text-[1.15rem]">
                {t.guests} {t.guests === 1 ? "persona" : "personas"} · {t.zone}
              </p>
            </div>
            <div className="text-right">
              <p className="eyebrow text-muted">Mesero</p>
              <p className="mt-1 font-bold text-[1.15rem]">{user?.name ?? "Misael"}</p>
            </div>
          </header>
          <div className="perforation mx-5 @xl:mx-7" />

          <ul className="px-5 @xl:px-7 divide-y divide-ink/8">
            {lines.map((l) => {
              const details = lineDetails(l);
              const product = productById[l.productId];
              return (
                <li key={l.id} className="py-5 grid grid-cols-[auto_1fr_auto] gap-x-4 gap-y-3 items-start">
                  <span className="display text-[2.4rem] leading-[0.85] w-10 text-right tabular-nums" aria-hidden="true">{l.qty}</span>
                  <div className="min-w-0">
                    <p className="font-bold text-[1.2rem] leading-tight">
                      <span className="sr-only">{l.qty} </span>
                      {productName(l)}
                    </p>
                    {details.length > 0 && (
                      <ul className="mt-1.5 flex flex-col gap-0.5">
                        {details.map((d) => (
                          <li key={d.text} className={`flex items-center gap-2 text-[0.95rem] ${d.kind === "note" ? "text-brand font-semibold" : "text-ink/75"}`}>
                            {d.kind === "note" ? <NotebookPen size={14} aria-hidden="true" /> : <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />}
                            {d.kind === "extra" ? `+ ${d.text}` : d.text}
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="mt-1.5 text-[0.8rem] text-muted font-mono">{money(lineTotal(l) / l.qty)} c/u</p>
                  </div>
                  <span className="font-mono font-bold text-[1.1rem] tabular-nums">{money(lineTotal(l))}</span>
                  <div className="col-start-2 col-span-2 flex items-center justify-between gap-3">
                    <Stepper label={`Cantidad de ${product?.name ?? ""}`} value={l.qty} min={1} onChange={(q) => setLineQty(table, l.id, q)} />
                    <button
                      type="button"
                      onClick={() => setLineQty(table, l.id, 0)}
                      className="press h-12 px-4 rounded-xl text-muted hover:text-brand hover:bg-brand-soft inline-flex items-center gap-2 font-semibold text-[0.9rem]"
                      aria-label={`Quitar ${product?.name ?? "producto"}`}
                    >
                      <Trash2 size={18} aria-hidden="true" /> Quitar
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="px-5 @xl:px-7 pt-2">
            <button
              type="button"
              onClick={() => go({ screen: "menu", table })}
              className="press w-full h-14 rounded-2xl border-2 border-dashed border-ink/15 hover:border-ink/40 font-bold inline-flex items-center justify-center gap-2"
            >
              <Plus size={20} aria-hidden="true" /> Agregar más productos
            </button>
          </div>

          <div className="perforation mx-5 @xl:mx-7 mt-6" />
          <footer className="px-5 @xl:px-7 pt-5 pb-6">
            <div className="flex items-baseline justify-between text-muted">
              <span>{count} {count === 1 ? "producto" : "productos"}</span>
              <span className="font-mono">Subtotal {money(total)}</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="display text-[2rem]">Total</span>
              <span className="font-mono font-bold text-[2rem] tabular-nums">{money(total)}</span>
            </div>
          </footer>
        </article>

        <aside className="sticky bottom-0 z-20 -mx-1 px-1 pt-8 pb-4 bg-gradient-to-t from-surface via-surface to-transparent grid grid-cols-[auto_1fr] gap-3 @4xl:top-24 @4xl:bottom-auto @4xl:bg-none @4xl:pt-0 @4xl:grid-cols-1">
          <p className="hidden @4xl:block text-muted leading-snug @4xl:order-0">
            Al enviar, cocina recibe la comanda al instante y podrás seguir su preparación desde aquí.
          </p>
          <button
            type="button"
            data-tour="send-order"
            onClick={send}
            disabled={sending}
            className="press group order-2 @4xl:order-1 w-full min-h-[5.25rem] rounded-2xl bg-brand hover:bg-brand-deep text-white shadow-lift flex items-center justify-center gap-4 disabled:opacity-100"
          >
            <span className="grid place-items-center size-12 rounded-xl bg-white/15">
              <Send size={24} strokeWidth={2.5} aria-hidden="true" className={sending ? "animate-fly" : ""} />
            </span>
            <span className="display text-[2.1rem] tracking-[0.02em] whitespace-nowrap">{sending ? "Enviando…" : "Enviar comanda"}</span>
          </button>
          <button
            type="button"
            onClick={save}
            disabled={sending}
            className="press order-1 @4xl:order-2 w-full min-h-[5.25rem] @4xl:min-h-16 px-5 rounded-2xl bg-white ring-1 ring-inset ring-ink/15 hover:ring-ink/40 font-bold uppercase tracking-[0.06em] text-[0.95rem] inline-flex items-center justify-center gap-2"
          >
            <Save size={19} aria-hidden="true" /> <span className="hidden @xl:inline">Guardar sin enviar</span><span className="@xl:hidden">Guardar</span>
          </button>
        </aside>
      </div>
    </div>
  );
}
