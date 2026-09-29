import { useStore } from "@nanostores/react";
import { BellRing, Flame, Plus, Receipt, RotateCcw, Save, Send, X } from "lucide-react";
import { $toasts, dismissToast, type Toast, type ToastIcon, type ToastScope } from "../../stores/session";
import "../../stores/demo";

interface Props {
  scope: Exclude<ToastScope, "all">;
  /** Inside a device frame on the presentation stage. */
  contained?: boolean;
}

const icons: Record<Exclude<ToastIcon, "check">, typeof Send> = {
  send: Send,
  flame: Flame,
  bell: BellRing,
  receipt: Receipt,
  reset: RotateCcw,
  save: Save,
  plus: Plus,
};

const tones = {
  ink: "bg-ink text-white",
  brand: "bg-brand text-white",
  ready: "bg-ready text-white",
};

function ToastIconView({ icon }: { icon: ToastIcon }) {
  if (icon === "check") {
    return (
      <svg viewBox="0 0 24 24" className="check-draw size-6" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
    );
  }
  const Icon = icons[icon];
  const motion = icon === "send" ? "animate-fly" : "animate-pop";
  return <Icon size={22} strokeWidth={2.5} className={motion} aria-hidden="true" />;
}

export default function Toaster({ scope, contained = false }: Props) {
  const toasts = useStore($toasts).filter((t: Toast) => t.scope === scope || t.scope === "all");

  return (
    <div
      className={`fixed z-50 top-[4.75rem] left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 w-[min(28rem,calc(100%-2rem))] pointer-events-none`}
      role="status"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto animate-toast-in w-full flex items-center gap-3 rounded-2xl pl-3 pr-2 py-2.5 shadow-lift ${tones[t.tone]}`}
        >
          <span className="grid place-items-center size-11 shrink-0 rounded-xl bg-white/14">
            <ToastIconView icon={t.icon} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block font-bold text-[1rem] leading-tight">{t.title}</span>
            {t.detail && <span className="block text-[0.82rem] opacity-80 truncate">{t.detail}</span>}
          </span>
          <button
            type="button"
            onClick={() => dismissToast(t.id)}
            className="press grid place-items-center size-11 shrink-0 rounded-xl hover:bg-white/10"
            aria-label="Cerrar aviso"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}
