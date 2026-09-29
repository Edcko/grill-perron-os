import { ArrowRight, Delete, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { users } from "../../data/demo";
import type { DemoUser } from "../../data/types";
import { navigate } from "astro:transitions/client";
import { signIn } from "../../stores/demo";

const guest: DemoUser = { id: "otro", name: "Invitado", role: "Usuario temporal", initials: "IN" };
const PIN_LENGTH = 4;

export default function UserSelector() {
  const [selected, setSelected] = useState<DemoUser | null>(null);
  const [pin, setPin] = useState("");

  // Demo PIN fills itself in so the presenter never has to type it.
  useEffect(() => {
    if (!selected) return;
    setPin("");
    let n = 0;
    const id = window.setInterval(() => {
      n += 1;
      setPin("0".repeat(n));
      if (n >= PIN_LENGTH) window.clearInterval(id);
    }, 90);
    return () => window.clearInterval(id);
  }, [selected]);

  const ready = Boolean(selected) && pin.length === PIN_LENGTH;

  function press(key: string) {
    if (key === "del") return setPin((p) => p.slice(0, -1));
    setPin((p) => (p.length < PIN_LENGTH ? p + key : p));
  }

  function start() {
    if (!selected || !ready) return;
    signIn(selected);
    void navigate("/mesero");
  }

  const options = [...users, guest];

  return (
    <div className="flex flex-col gap-6">
      <fieldset>
        <legend className="sr-only">Usuarios</legend>
        <div className="grid grid-cols-2 gap-3">
          {options.map((u) => {
            const active = selected?.id === u.id;
            return (
              <button
                key={u.id}
                type="button"
                aria-pressed={active}
                onClick={() => setSelected(u)}
                className={`press min-h-[5.5rem] rounded-[var(--radius-card)] p-3.5 flex items-center gap-3.5 text-left ${
                  active ? "bg-ink text-white shadow-lift" : "bg-white ring-1 ring-inset ring-ink/10 hover:ring-ink/30"
                }`}
              >
                <span
                  className={`grid place-items-center size-14 shrink-0 rounded-full font-bold text-[1.05rem] ${
                    active ? "bg-brand text-white" : u.id === "otro" ? "bg-ink/6 text-ink" : "bg-ink text-white"
                  }`}
                >
                  {u.id === "otro" ? <UserRound size={24} aria-hidden="true" /> : u.initials}
                </span>
                <span className="min-w-0">
                  <span className="block font-bold text-[1.2rem] leading-tight">{u.id === "otro" ? "Otro usuario" : u.name}</span>
                  <span className={`block text-[0.85rem] mt-0.5 ${active ? "text-white/70" : "text-muted"}`}>{u.role}</span>
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className={`transition-opacity duration-200 ${selected ? "opacity-100" : "opacity-40"}`}>
        <div className="flex items-center justify-between mb-2">
          <p className="eyebrow text-muted" id="pin-label">PIN</p>
          {selected && <p className="text-[0.8rem] text-muted">PIN de demostración cargado</p>}
        </div>
        <div className="flex items-center justify-center gap-5 h-8" role="img" aria-labelledby="pin-label" aria-label={`${pin.length} de ${PIN_LENGTH} dígitos`}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <span
              key={i}
              className={`size-5 rounded-full transition-all duration-150 ${i < pin.length ? "bg-ink scale-100" : "bg-transparent ring-2 ring-ink/20 scale-90"}`}
            />
          ))}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 max-w-[20rem] mx-auto">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"].map((k) =>
            k === "" ? (
              <span key="blank" aria-hidden="true" />
            ) : (
              <button
                key={k}
                type="button"
                disabled={!selected}
                onClick={() => press(k)}
                className="press h-[3.25rem] rounded-2xl bg-white ring-1 ring-inset ring-ink/8 hover:ring-ink/25 font-mono font-bold text-[1.35rem] grid place-items-center disabled:cursor-not-allowed"
                aria-label={k === "del" ? "Borrar dígito" : k}
              >
                {k === "del" ? <Delete size={22} aria-hidden="true" /> : k}
              </button>
            ),
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={start}
        disabled={!ready}
        className="press w-full min-h-[5rem] rounded-2xl bg-brand hover:bg-brand-deep text-white disabled:bg-ink/10 disabled:text-ink/35 display text-[2rem] tracking-[0.03em] inline-flex items-center justify-center gap-3 shadow-lift disabled:shadow-none"
      >
        Iniciar turno <ArrowRight size={30} aria-hidden="true" />
      </button>
    </div>
  );
}
