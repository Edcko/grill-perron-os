const formatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** $1,234.00 — always two decimals, as printed on a ticket. */
export function money(value: number): string {
  return formatter.format(value).replace("MX", "").trim();
}

/** $165 — compact form for buttons and cards. */
export function moneyShort(value: number): string {
  return `$${value.toLocaleString("es-MX")}`;
}
