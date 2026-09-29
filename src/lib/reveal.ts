/**
 * Scrolls the nearest scrollable ancestor so `el` is visible, without touching
 * any other ancestor (scrollIntoView would also shift overflow:hidden device frames).
 * Works inside CSS-scaled containers.
 */
export function revealInScroller(el: HTMLElement, align: "center" | "nearest" | "start" = "center", offset = 0): void {
  let scroller = el.parentElement;
  while (scroller) {
    const oy = getComputedStyle(scroller).overflowY;
    if ((oy === "auto" || oy === "scroll") && scroller.scrollHeight > scroller.clientHeight) break;
    scroller = scroller.parentElement;
  }
  if (!scroller) {
    // The page itself scrolls.
    const top = el.getBoundingClientRect().top;
    if (align === "start") window.scrollBy({ top: top - offset, behavior: "smooth" });
    else el.scrollIntoView({ block: align, behavior: "smooth" });
    return;
  }
  const sRect = scroller.getBoundingClientRect();
  const eRect = el.getBoundingClientRect();
  const scale = sRect.height / scroller.offsetHeight || 1;
  const top = (eRect.top - sRect.top) / scale;
  const height = eRect.height / scale;
  let delta = 0;
  if (align === "start") delta = top - offset;
  else if (align === "center") delta = top - (scroller.clientHeight - height) / 2;
  else if (top < 0) delta = top - 12;
  else if (top + height > scroller.clientHeight) delta = top + height - scroller.clientHeight + 12;
  if (delta) scroller.scrollBy({ top: delta, behavior: "smooth" });
}
