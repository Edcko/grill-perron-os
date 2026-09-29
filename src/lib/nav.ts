import { navigate } from "astro:transitions/client";

export type WaiterRoute =
  | { screen: "map" }
  | { screen: "menu"; table: number }
  | { screen: "order"; table: number }
  | { screen: "tracking"; table: number }
  | { screen: "closing"; table: number };

export type Go = (route: WaiterRoute) => void;

export function hrefFor(route: WaiterRoute): string {
  switch (route.screen) {
    case "map":
      return "/mesero";
    case "menu":
      return `/mesero/${route.table}`;
    case "order":
      return `/mesero/${route.table}/comanda`;
    case "tracking":
      return `/mesero/${route.table}/seguimiento`;
    case "closing":
      return `/mesero/${route.table}/cierre`;
  }
}

/** Default navigation for real pages: Astro's client router with view transitions. */
export const goWithRouter: Go = (route) => {
  void navigate(hrefFor(route));
};
