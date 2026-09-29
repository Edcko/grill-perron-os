import { useStore } from "@nanostores/react";
import { Check, NotebookPen, Plus, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { extras, modifiers, productById } from "../../data/products";
import type { FoodImages } from "../../lib/images";
import { money, moneyShort } from "../../lib/money";
import { unitPrice } from "../../lib/orders";
import { addLine } from "../../stores/demo";
import { $composer, type ComposerState } from "../../stores/orders";
import { FoodPhoto } from "../ui/FoodPhoto";
import { Stepper } from "../ui/Stepper";

interface Props {
  table: number;
  images: FoodImages;
  contained?: boolean;
  onClose: () => void;
  onAdded: (qty: number) => void;
}

export function toggleModifier(state: ComposerState, id: string): string[] {
  if (id === "con-todo") return ["con-todo"];
  const without = state.modifiers.filter((m) => m !== "con-todo");
  const next = without.includes(id) ? without.filter((m) => m !== id) : [...without, id];
  return next.length ? next : ["con-todo"];
}

export function toggleExtra(state: ComposerState, id: string): string[] {
  return state.extras.includes(id) ? state.extras.filter((e) => e !== id) : [...state.extras, id];
}

export default function ProductCustomizer({ table, images, contained = false, onClose, onAdded }: Props) {
  const state = useStore($composer);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!state) return null;
  const product = productById[state.productId];
  if (!product) return null;

  const set = (patch: Partial<ComposerState>) => $composer.set({ ...state, ...patch });
  const total = unitPrice(state) * state.qty;

  function add() {
    if (!state) return;
    addLine(table, { productId: state.productId, qty: state.qty, modifiers: state.modifiers, extras: state.extras, note: state.note });
    onAdded(state.qty);
  }

  return (
    <div
      className={`fixed inset-0 z-40 flex items-end @4xl:items-center justify-center bg-ink/55 backdrop-blur-[2px]`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="customizer-title"
        className="relative w-full @4xl:w-[min(64rem,calc(100%-3rem))] max-h-[94%] overflow-y-auto bg-surface rounded-t-[1.75rem] @4xl:rounded-[1.75rem] shadow-lift grid @4xl:grid-cols-[0.9fr_1.1fr]"
      >
        <div className="relative bg-ink">
          <FoodPhoto
            image={images[product.id]}
            alt={product.name}
            eager
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="w-full h-[16rem] @xl:h-[19rem] @4xl:h-full @4xl:min-h-[34rem]"
            style={{ viewTransitionName: "product-photo" }}
          />
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="press absolute top-4 left-4 grid place-items-center size-12 rounded-full bg-white text-ink shadow-card"
            aria-label="Cerrar detalle"
          >
            <X size={22} aria-hidden="true" />
          </button>
        </div>

        <div className="p-5 @xl:p-7 flex flex-col gap-6">
          <div>
            <p className="eyebrow text-muted">{product.station === "barra" ? "Barra" : "Parrilla · Cocina"}</p>
            <h2 id="customizer-title" className="display text-[3.2rem] @xl:text-[4rem] mt-1" style={{ viewTransitionName: "product-title" }}>
              {product.name}
            </h2>
            <p className="font-mono font-bold text-[1.5rem] mt-1">{money(product.price)}</p>
            <p className="text-muted mt-2 text-[0.98rem] leading-snug max-w-[34ch]">{product.description}</p>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="eyebrow text-ink">Cantidad</span>
            <Stepper size="lg" label="Cantidad" value={state.qty} onChange={(qty) => set({ qty })} tour="qty-plus" />
          </div>

          {product.customizable && (
            <>
              <fieldset>
                <legend className="eyebrow text-ink mb-3">Modificaciones</legend>
                <div className="grid grid-cols-2 gap-2">
                  {modifiers.map((m) => {
                    const on = state.modifiers.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        data-tour={`mod-${m.id}`}
                        aria-pressed={on}
                        onClick={() => set({ modifiers: toggleModifier(state, m.id) })}
                        className={`press h-14 px-4 rounded-2xl flex items-center justify-between gap-2 text-left font-bold uppercase text-[0.9rem] tracking-[0.04em] ${
                          on ? "bg-ink text-white" : "bg-white ring-1 ring-inset ring-ink/12 hover:ring-ink/35"
                        }`}
                      >
                        {m.label}
                        <span className={`grid place-items-center size-6 rounded-full ${on ? "bg-white text-ink" : "ring-1 ring-ink/20"}`} aria-hidden="true">
                          {on && <Check size={15} strokeWidth={3} />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset>
                <legend className="eyebrow text-ink mb-3">Extras</legend>
                <div className="grid grid-cols-2 gap-2">
                  {extras.map((x) => {
                    const on = state.extras.includes(x.id);
                    return (
                      <button
                        key={x.id}
                        type="button"
                        data-tour={`extra-${x.id}`}
                        aria-pressed={on}
                        onClick={() => set({ extras: toggleExtra(state, x.id) })}
                        className={`press h-14 px-4 rounded-2xl flex items-center justify-between gap-2 font-bold uppercase text-[0.9rem] tracking-[0.04em] ${
                          on ? "bg-brand text-white" : "bg-white ring-1 ring-inset ring-ink/12 hover:ring-ink/35"
                        }`}
                      >
                        <span className="inline-flex items-center gap-2">
                          {on ? <Check size={17} strokeWidth={3} aria-hidden="true" /> : <Plus size={17} strokeWidth={3} aria-hidden="true" />}
                          {x.label}
                        </span>
                        <span className="font-mono">+{moneyShort(x.price)}</span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </>
          )}

          <label className="block">
            <span className="eyebrow text-ink mb-3 flex items-center gap-2">
              <NotebookPen size={15} aria-hidden="true" /> Nota para cocina
            </span>
            <textarea
              value={state.note}
              onChange={(e) => set({ note: e.target.value })}
              rows={2}
              placeholder="Ej. bien dorada, salsa aparte..."
              className="w-full rounded-2xl bg-white ring-1 ring-inset ring-ink/12 focus:ring-2 focus:ring-ink px-4 py-3 text-[1rem] resize-none outline-none placeholder:text-ink/35"
            />
          </label>

          <button
            type="button"
            data-tour="add-to-order"
            onClick={add}
            className="press mt-auto w-full min-h-[4.25rem] px-6 rounded-2xl bg-brand hover:bg-brand-deep text-white display text-[1.45rem] @xl:text-[1.7rem] tracking-[0.02em] whitespace-nowrap flex items-center justify-center gap-3 shadow-card"
          >
            Agregar {state.qty} al pedido
            <span className="opacity-60" aria-hidden="true">—</span>
            <span>{moneyShort(total)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
