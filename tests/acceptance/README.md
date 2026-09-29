# Acceptance Tests

End-to-end tests for Grill Perrón OS. These run against a live preview server and verify the real cross-tab sync behavior, not mocks.

## Tests

| Script | Verifies |
|---|---|
| `sync_mesero_cocina.py` | 2-tab sync: mesero sends a comanda → cocina sees `#044` in `PENDIENTES`; cocina marks station ready → mesero `/seguimiento` reflects the update. Confirms `BroadcastChannel("grill-perron-demo")` and the versioned `localStorage` envelope. |

## Setup

```bash
pip install -r requirements.txt
playwright install chromium
```

## Run

In one terminal:

```bash
cd /home/ed/Documentos/grill_perron
npm run build
astro preview   # daemon — chooses a free port (check `astro preview status`)
```

The preview server runs as a daemon. After the first launch you'll see which port it's bound to (typically `http://127.0.0.1:4322`). Edit `URL` at the top of `sync_mesero_cocina.py` if your port differs.

In another terminal:

```bash
python tests/acceptance/sync_mesero_cocina.py
```

Exit code `0` = pass, `1` = at least one assertion failed. The script writes screenshots to `/tmp/grill-acceptance-*.png` for visual inspection.

## When to run

- Before any change that touches `src/stores/`, `src/lib/sync.ts`, or `src/lib/persistence.ts`.
- Before any change that touches the wizard navigation (`src/lib/nav.ts`, `OrderComposer.tsx`, `MenuCatalog.tsx`).
- After bumping `STATE_VERSION` in `src/lib/persistence.ts` (a version bump invalidates stored state — the test resets `localStorage` before running, so this is safe).

## When NOT to bother

- Visual-only tweaks (typography, spacing, color).
- New product additions to the catalog.
- New toast types or animations.