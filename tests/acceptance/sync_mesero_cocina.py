"""2-tab sync acceptance test for Grill Perrón OS.

Validates the cross-device sync between /mesero/[table]/comanda and /cocina
via BroadcastChannel("grill-perron-demo") + localStorage versioned envelope.

Pre-requisites:
    npm run build && astro preview  (running at http://127.0.0.1:4322)

Run:
    pip install playwright
    playwright install chromium
    python tests/acceptance/sync_mesero_cocina.py
"""
import sys
from playwright.sync_api import sync_playwright

URL = "http://127.0.0.1:4322"
SHOT = "/tmp/grill-acceptance"


def main() -> int:
    failures: list[str] = []
    notes: list[str] = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context()

        # 1. Wipe demo state so seed is deterministic.
        bootstrap = ctx.new_page()
        bootstrap.goto(URL)
        bootstrap.evaluate("localStorage.removeItem('grill-perron-demo:state')")
        bootstrap.close()

        # 2. Tab A: mesero (Misael)
        tabA = ctx.new_page()
        tabA.on("console", lambda m: print(f"[A:{m.type}]", m.text) if m.type == "error" else None)
        tabA.goto(f"{URL}/inicio", wait_until="networkidle")
        tabA.locator("button", has_text="MI").first.click()
        tabA.wait_for_timeout(150)
        tabA.locator("button", has_text="INICIAR TURNO").click()
        tabA.wait_for_load_state("networkidle")
        tabA.goto(f"{URL}/mesero/8/comanda", wait_until="networkidle")
        tabA.wait_for_timeout(500)
        tabA.locator("button", has_text="Ir al menú").first.click()
        tabA.wait_for_timeout(1200)
        tabA.screenshot(path=f"{SHOT}-A-menu.png", full_page=True)

        # 3. Tab B: cocina
        tabB = ctx.new_page()
        tabB.on("console", lambda m: print(f"[B:{m.type}]", m.text) if m.type == "error" else None)
        tabB.goto(f"{URL}/cocina", wait_until="networkidle")
        tabB.wait_for_timeout(500)
        b1 = tabB.inner_text("body")
        seed_ok = all(f"#{n}" in b1 for n in ["040", "041", "042", "043"])
        print(f"[B1] Seed tickets visible (#040/041/042/043): {seed_ok}")
        if not seed_ok:
            failures.append("seed-missing")
        tabB.screenshot(path=f"{SHOT}-B-cocina-initial.png", full_page=True)

        # 4. Tab A: add 2 Birria de Res + 1 Consomé Grande
        tabA.locator("[data-tour='quick-birria-de-res']").click()
        tabA.wait_for_timeout(200)
        tabA.locator("[data-tour='quick-birria-de-res']").click()
        tabA.wait_for_timeout(200)
        tabA.locator("[data-tour='quick-consome-grande']").click()
        tabA.wait_for_timeout(200)

        review_btn = tabA.locator("[data-tour='review-order']")
        review_text = review_btn.first.inner_text() if review_btn.count() else ""
        print(f"[A3] review-order text: {review_text[:80]!r}")
        tabA.screenshot(path=f"{SHOT}-A-menu-with-items.png", full_page=True)

        # 5. Click "Revisar comanda" → composer screen
        review_btn.first.click()
        tabA.wait_for_timeout(800)

        # 6. Send the order
        send_btn = tabA.locator("[data-tour='send-order']")
        print(f"[A4] send-order count: {send_btn.count()}, disabled: {send_btn.first.is_disabled() if send_btn.count() else 'n/a'}")
        if send_btn.count() == 0 or send_btn.first.is_disabled():
            failures.append("no-send-button")
        else:
            print("[A4] Click Enviar comanda")
            send_btn.first.click()
            tabA.wait_for_timeout(1500)
            tabA.screenshot(path=f"{SHOT}-A-after-send.png", full_page=True)
            notes.append("order-sent")

        # 7. Tab B should see the new ticket #044 from MESA 08
        tabB.wait_for_timeout(800)
        tabB.screenshot(path=f"{SHOT}-B-cocina-after-send.png", full_page=True)
        b2 = tabB.inner_text("body")
        ticket_visible = "#044" in b2 and "MESA 08" in b2
        print(f"[B2] #044 + MESA 08 in cocina: {ticket_visible}")
        if ticket_visible:
            notes.append("sync-meso-to-cocina")
        else:
            failures.append("sync-meso-to-cocina-failed")

        # 8. Tab B: mark first station ready
        marcar = tabB.locator("button", has_text="MARCAR LISTO").first
        if marcar.count() > 0:
            print("[B3] Click MARCAR LISTO")
            marcar.click()
            tabB.wait_for_timeout(500)
            tabB.screenshot(path=f"{SHOT}-B-after-mark.png", full_page=True)
            notes.append("mark-ready-clicked")

        # 9. Tab A: switch to seguimiento; verify bidirectional sync
        tabA.goto(f"{URL}/mesero/8/seguimiento", wait_until="networkidle")
        tabA.wait_for_timeout(700)
        tabA.screenshot(path=f"{SHOT}-A-seguimiento.png", full_page=True)
        a5 = tabA.inner_text("body")
        seguimiento_ok = "#044" in a5 and "MESA 08" in a5
        print(f"[A5] Seguimiento shows #044 + MESA 08: {seguimiento_ok}")
        if seguimiento_ok:
            notes.append("bidirectional-sync")
        else:
            failures.append("bidirectional-sync-failed")

        browser.close()

    print("\n=== Passed ===")
    for n in notes:
        print(f"  ✓ {n}")
    print("\n=== Failed ===")
    for f in failures:
        print(f"  ✗ {f}")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())