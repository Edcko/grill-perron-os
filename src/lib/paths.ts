/** Static routes for the 12 tables of the demo restaurant. */
export function tablePaths() {
  return Array.from({ length: 12 }, (_, i) => ({ params: { table: String(i + 1) } }));
}
