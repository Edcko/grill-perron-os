import { useStore } from "@nanostores/react";
import { ArrowRight, Beef, CupSoda, Flame, Plus, Salad, Sandwich, Soup, Users, type LucideIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { categories, productById, products } from "../../data/products";
import type { CategoryId, Product } from "../../data/types";
import type { FoodImages } from "../../lib/images";
import { money, moneyShort } from "../../lib/money";
import { revealInScroller } from "../../lib/reveal";
import { goWithRouter, type Go } from "../../lib/nav";
import { itemCount, linesTotal } from "../../lib/orders";
import { addLine, openTable, setGuests } from "../../stores/demo";
import { $category, $composer, $drafts } from "../../stores/orders";
import { $tables } from "../../stores/restaurant";
import { FoodPhoto } from "../ui/FoodPhoto";
import { Stepper } from "../ui/Stepper";
import ProductCustomizer from "./ProductCustomizer";

interface Props {
  table: number;
  images: FoodImages;
  go?: Go;
  contained?: boolean;
}

const categoryIcons: Record<CategoryId, LucideIcon> = {
  birria: Beef,
  tacos: Sandwich,
  quesabirrias: Flame,
  consomes: Soup,
  bebidas: CupSoda,
  extras: Salad,
};

/** Runs a DOM update inside a view transition when the browser supports it. */
function withTransition(update: () => void) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!doc.startViewTransition || reduce) return update();
  doc.startViewTransition(() => flushSync(update));
}

export default function MenuCatalog({ table, images, go = goWithRouter, contained = false }: Props) {
  const tables = useStore($tables);
  const drafts = useStore($drafts);
  const category = useStore($category);
  const composer = useStore($composer);
  const [bump, setBump] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const lockSpy = useRef(0);

  const t = tables[table];
  const lines = drafts[table] ?? [];
  const count = itemCount(lines);
  const total = linesTotal(lines);
  const inCart = (id: string) => lines.filter((l) => l.productId === id).reduce((n, l) => n + l.qty, 0);
  const inCategory = (c: CategoryId) => lines.filter((l) => productById[l.productId]?.category === c).reduce((n, l) => n + l.qty, 0);

  // Opening a table straight from a link still starts the visit.
  useEffect(() => {
    if (t?.status === "free") openTable(table, 2);
  }, [t?.status, table]);

  const openProduct = useCallback((p: Product, photo: HTMLElement | null) => {
    if (photo) photo.style.viewTransitionName = "product-photo";
    withTransition(() => {
      if (photo) photo.style.viewTransitionName = "";
      $composer.set({ productId: p.id, qty: 1, modifiers: p.customizable ? ["con-todo"] : [], extras: [], note: "" });
    });
  }, []);

  const closeProduct = useCallback(() => {
    const id = $composer.get()?.productId;
    withTransition(() => {
      $composer.set(null);
      const photo = id ? document.querySelector<HTMLElement>(`[data-photo="${id}"]`) : null;
      if (photo) photo.style.viewTransitionName = "product-photo";
    });
    // Drop the name once the transition has captured it.
    window.setTimeout(() => {
      document.querySelectorAll<HTMLElement>("[data-photo]").forEach((el) => (el.style.viewTransitionName = ""));
    }, 400);
  }, []);

  const added = useCallback((qty: number) => {
    closeProduct();
    setBump((b) => b + qty);
  }, [closeProduct]);

  function jumpTo(id: CategoryId) {
    $category.set(id);
    lockSpy.current = Date.now() + 700;
    const section = rootRef.current?.querySelector<HTMLElement>(`#cat-${id}`);
    if (section) revealInScroller(section, "start", 88);
  }

  // Scroll-spy: highlight the category currently in view.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (Date.now() < lockSpy.current) return;
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        const id = visible?.target.getAttribute("data-category") as CategoryId | null;
        if (id) $category.set(id);
      },
      { rootMargin: "-25% 0px -60% 0px" },
    );
    root.querySelectorAll("[data-category]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  function quickAdd(p: Product) {
    addLine(table, { productId: p.id, qty: 1, modifiers: [], extras: [], note: "" });
    setBump((b) => b + 1);
  }


  if (!t) return null;

  return (
    <div className="@container relative" ref={rootRef}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <p className="text-muted font-medium">
          {t.zone} · Toca un platillo para personalizarlo
        </p>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 eyebrow text-ink">
            <Users size={16} aria-hidden="true" /> Personas
          </span>
          <Stepper label="Personas en la mesa" value={t.guests || 1} max={t.seats + 2} onChange={(n) => setGuests(table, n)} />
        </div>
      </div>

      <div className="grid grid-cols-[8.5rem_1fr] @3xl:grid-cols-[12rem_1fr] gap-4 @3xl:gap-6 items-start">
        <nav aria-label="Categorías" className="sticky top-[5.5rem] flex flex-col gap-2 pt-12">
          {categories.map((c) => {
            const Icon = categoryIcons[c.id];
            const active = c.id === category;
            const n = inCategory(c.id);
            return (
              <button
                key={c.id}
                type="button"
                data-tour={`cat-${c.id}`}
                onClick={() => jumpTo(c.id)}
                aria-current={active ? "true" : undefined}
                className={`press relative flex flex-col @3xl:flex-row items-start @3xl:items-center gap-1.5 @3xl:gap-3 min-h-[4.5rem] @3xl:min-h-16 px-3.5 py-3 rounded-2xl text-left font-bold text-[0.95rem] ${
                  active ? "bg-ink text-white" : "bg-white text-ink ring-1 ring-inset ring-ink/8 hover:ring-ink/25"
                }`}
              >
                <Icon size={20} aria-hidden="true" className={active ? "text-white" : "text-brand"} />
                <span className="leading-tight">{c.label}</span>
                {n > 0 && (
                  <span className={`absolute top-2 right-2 @3xl:static @3xl:ml-auto min-w-6 h-6 px-1.5 grid place-items-center rounded-full text-[0.72rem] font-mono ${active ? "bg-brand text-white" : "bg-brand text-white"}`}>
                    {n}
                    <span className="sr-only"> en la comanda</span>
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="min-w-0 flex flex-col gap-8">
          {categories.map((c) => (
            <section key={c.id} id={`cat-${c.id}`} data-category={c.id} aria-labelledby={`cat-h-${c.id}`} className="scroll-mt-24">
              <h2 id={`cat-h-${c.id}`} className="display text-[2rem] mb-3 flex items-baseline gap-3">
                {c.label}
                <span className="font-sans text-[0.8rem] font-semibold text-muted tracking-normal normal-case">
                  {products.filter((p) => p.category === c.id).length} opciones
                </span>
              </h2>
              <ul className="grid grid-cols-1 @xl:grid-cols-2 @5xl:grid-cols-3 gap-3 @3xl:gap-4">
                {products.filter((p) => p.category === c.id).map((p, i) => {
                  const n = inCart(p.id);
                  const hasPhoto = Boolean(images[p.id]);
                  return (
                    <li key={p.id} className="animate-rise" style={{ animationDelay: `${i * 40}ms` }}>
                      <article className="h-full rounded-[var(--radius-card)] bg-white shadow-card overflow-hidden flex flex-col">
                        <button
                          type="button"
                          data-tour={`product-${p.id}`}
                          onClick={(e) => openProduct(p, e.currentTarget.querySelector("[data-photo]"))}
                          className="press text-left group flex-1 flex flex-col"
                          aria-label={`${p.name}, ${money(p.price)}. Personalizar`}
                        >
                          {hasPhoto ? (
                            <span data-photo={p.id} className="relative block aspect-[4/3] overflow-hidden bg-ink">
                              <FoodPhoto image={images[p.id]} alt="" className="size-full transition-transform duration-500 group-hover:scale-[1.03]" />
                              {n > 0 && (
                                <span key={n} className="animate-pop absolute top-3 right-3 h-8 px-3 rounded-full bg-brand text-white text-[0.78rem] font-bold inline-flex items-center">
                                  {n} en comanda
                                </span>
                              )}
                            </span>
                          ) : (
                            <span data-photo={p.id} className="relative flex items-center justify-between px-4 pt-4">
                              <span className="grid place-items-center size-12 rounded-xl bg-brand-soft text-brand">
                                <Plus size={22} aria-hidden="true" />
                              </span>
                              {n > 0 && (
                                <span key={n} className="animate-pop h-8 px-3 rounded-full bg-brand text-white text-[0.78rem] font-bold inline-flex items-center">
                                  {n} en comanda
                                </span>
                              )}
                            </span>
                          )}
                          <span className="block px-4 pt-3.5">
                            <span className="block font-bold text-[1.15rem] leading-tight">{p.name}</span>
                            <span className="block text-muted text-[0.85rem] mt-1 leading-snug line-clamp-2">{p.description}</span>
                          </span>
                        </button>
                        <div className="flex items-center justify-between gap-3 px-4 pb-4 pt-3">
                          <span className="font-mono font-bold text-[1.2rem]">{money(p.price)}</span>
                          <button
                            type="button"
                            data-tour={`quick-${p.id}`}
                            onClick={() => quickAdd(p)}
                            className="press h-12 pl-3 pr-4 rounded-xl bg-ink hover:bg-brand text-white font-bold text-[0.85rem] tracking-[0.06em] uppercase inline-flex items-center gap-1.5"
                            aria-label={`Agregar ${p.name}`}
                          >
                            <Plus size={18} strokeWidth={3} aria-hidden="true" /> Agregar
                          </button>
                        </div>
                      </article>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>

      <div className={`fixed z-30 bottom-0 inset-x-0 px-4 pb-4 pt-6 bg-gradient-to-t from-surface via-surface/95 to-transparent pointer-events-none`}>
        <div className="mx-auto max-w-[1400px] pointer-events-auto">
          <button
            type="button"
            data-tour="review-order"
            disabled={count === 0}
            onClick={() => go({ screen: "order", table })}
            className="press w-full min-h-[4.5rem] rounded-2xl bg-ink text-white disabled:bg-white disabled:text-muted disabled:ring-1 disabled:ring-ink/10 disabled:shadow-card flex items-center gap-4 pl-4 pr-5 shadow-lift"
          >
            <span key={bump} className={`grid place-items-center min-w-12 h-12 px-2 rounded-xl font-mono font-bold text-[1.2rem] ${count ? "bg-brand animate-pop" : "bg-ink/10"}`}>
              {count}
            </span>
            <span className="text-left leading-tight">
              <span className="block font-bold text-[1.05rem]">{count ? "Revisar comanda" : "Comanda vacía"}</span>
              <span className="block text-[0.85rem] opacity-70">
                {count ? `${count} ${count === 1 ? "producto" : "productos"} · ${t.guests} personas` : "Agrega platillos para empezar"}
              </span>
            </span>
            <span className="ml-auto font-mono font-bold text-[1.3rem]">{count ? moneyShort(total) : ""}</span>
            {count > 0 && <ArrowRight size={24} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {composer && (
        <ProductCustomizer table={table} images={images} contained={contained} onClose={closeProduct} onAdded={added} />
      )}
    </div>
  );
}
