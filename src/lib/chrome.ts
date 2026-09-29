import { $connection } from "./sync";
import { $user } from "../stores/session";
import "../stores/demo";
import { clock } from "./time";

const labels = { connecting: "Conectando", live: "En vivo", fallback: "Sincronización local" } as const;
let timer: number | undefined;

/** Wires the static Astro headers (clock, connection, user badge) to the stores. */
export function bindChrome(): void {
  const clocks = document.querySelectorAll<HTMLElement>("[data-clock]");
  const tick = () => clocks.forEach((el) => (el.textContent = clock(Date.now())));
  tick();
  window.clearInterval(timer);
  timer = window.setInterval(tick, 5_000);

  const offConn = $connection.subscribe((c) => {
    document.querySelectorAll("[data-connection-label]").forEach((el) => (el.textContent = labels[c]));
    document.querySelectorAll("[data-connection-dot]").forEach((dot) => {
      dot.classList.toggle("bg-warn-bright", c !== "live");
      dot.classList.toggle("bg-ready-bright", c === "live");
    });
  });

  const offUser = $user.subscribe((u) => {
    document.querySelectorAll("[data-user-initials]").forEach((el) => (el.textContent = u?.initials ?? "MI"));
    document.querySelectorAll("[data-user-name]").forEach((el) => (el.textContent = u?.name ?? "Misael"));
  });

  document.addEventListener("astro:before-swap", () => { offConn(); offUser(); }, { once: true });
}
