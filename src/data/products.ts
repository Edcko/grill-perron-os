import type { CategoryId, Extra, Modifier, Product, StationId } from "./types";

export const categories: { id: CategoryId; label: string }[] = [
  { id: "birria", label: "Birria" },
  { id: "tacos", label: "Tacos" },
  { id: "quesabirrias", label: "Quesabirrias" },
  { id: "consomes", label: "Consomés" },
  { id: "bebidas", label: "Bebidas" },
  { id: "extras", label: "Extras" },
];

export const stations: Record<StationId, { label: string; hint: string }> = {
  parrilla: { label: "Parrilla", hint: "Tacos y quesabirrias" },
  cocina: { label: "Cocina", hint: "Birria y consomés" },
  barra: { label: "Barra", hint: "Aguas y refrescos" },
};

export const stationOrder: StationId[] = ["parrilla", "cocina", "barra"];

export const products: Product[] = [
  { id: "birria-de-res", name: "Birria de Res", short: "Birria de Res", category: "birria", price: 140, station: "cocina", customizable: true, description: "Orden completa en su consomé, con cebolla, cilantro y limón." },
  { id: "media-orden", name: "Media Orden", short: "Media Orden", category: "birria", price: 90, station: "cocina", customizable: true, description: "La misma birria, porción para uno." },
  { id: "taco-de-birria", name: "Taco de Birria", short: "Taco de Birria", category: "tacos", price: 35, station: "parrilla", customizable: true, description: "Tortilla bañada en grasa de birria, a la plancha." },
  { id: "taco-dorado", name: "Taco Dorado", short: "Taco Dorado", category: "tacos", price: 38, station: "parrilla", customizable: true, description: "Doradito y crujiente, relleno de birria." },
  { id: "quesabirria", name: "Quesabirria", short: "Quesabirria", category: "quesabirrias", price: 55, station: "parrilla", customizable: true, description: "Queso fundido y birria en tortilla dorada. Para dipear en consomé." },
  { id: "vampiro", name: "Vampiro", short: "Vampiro", category: "quesabirrias", price: 45, station: "parrilla", customizable: true, description: "Tortilla tostada al punto, queso gratinado y birria." },
  { id: "consome", name: "Consomé", short: "Consomé", category: "consomes", price: 30, station: "cocina", customizable: true, description: "Caldo de birria con cebolla y cilantro." },
  { id: "consome-grande", name: "Consomé Grande", short: "Consomé Gde.", category: "consomes", price: 45, station: "cocina", customizable: true, description: "Tazón grande, ideal para compartir." },
  { id: "agua-horchata", name: "Agua de Horchata", short: "Horchata", category: "bebidas", price: 35, station: "barra", customizable: false, description: "Vaso de medio litro, con canela." },
  { id: "agua-jamaica", name: "Agua de Jamaica", short: "Jamaica", category: "bebidas", price: 35, station: "barra", customizable: false, description: "Vaso de medio litro, bien fría." },
  { id: "refresco", name: "Refresco", short: "Refresco", category: "bebidas", price: 35, station: "barra", customizable: false, description: "Botella de vidrio, 355 ml." },
  { id: "queso-extra", name: "Queso Extra", short: "Queso", category: "extras", price: 15, station: "parrilla", customizable: false, description: "Porción de queso fundido." },
  { id: "tortillas", name: "Tortillas a Mano", short: "Tortillas", category: "extras", price: 20, station: "cocina", customizable: false, description: "Cinco tortillas de maíz hechas al momento." },
];

export const productById: Record<string, Product> = Object.fromEntries(products.map((p) => [p.id, p]));

export const modifiers: Modifier[] = [
  { id: "con-todo", label: "Con todo" },
  { id: "sin-cebolla", label: "Sin cebolla" },
  { id: "sin-cilantro", label: "Sin cilantro" },
  { id: "sin-salsa", label: "Sin salsa" },
];

export const extras: Extra[] = [
  { id: "queso", label: "Queso", price: 15 },
  { id: "consome", label: "Consomé", price: 20 },
];

export const modifierById: Record<string, Modifier> = Object.fromEntries(modifiers.map((m) => [m.id, m]));
export const extraById: Record<string, Extra> = Object.fromEntries(extras.map((e) => [e.id, e]));
