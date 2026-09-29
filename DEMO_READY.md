# Grill Perrón OS — Demo Ready

Premium commercial demo of a birriería order + KDS system. Astro 7, React islands, Tailwind 4, nanostores, cross-device sync via `BroadcastChannel` + `localStorage` versioned envelope.

## Quickstart

```bash
npm install
npm run dev          # dev server at http://localhost:4321
npm run build        # production build → dist/
npm run preview      # preview production build at http://localhost:4321
```

Requirements: Node ≥ 22.12 (project enforces it via `engines`).

## Stack

- **Astro 7.3.5** with React 19 islands (`@astrojs/react`)
- **Tailwind 4.3.3** via `@tailwindcss/vite` plugin
- **nanostores 1.5.4** + `@nanostores/react` for client state
- **Astro Fonts API** loading Anton, Geist, Geist Mono
- **BroadcastChannel** `"grill-perron-demo"` + `localStorage` fallback for cross-tab sync
- **lucide-react** for icons
- No backend, no auth — pure client-side demo, deterministic seed

## Routes

| Route | Purpose |
|---|---|
| `/` | Landing / marketing |
| `/inicio` | Pick waiter (Misael / Juan / Pedro) |
| `/mesero` | Table map (12 mesas) |
| `/mesero/[table]` | Mesa home |
| `/mesero/[table]/comanda` | Composer |
| `/mesero/[table]/seguimiento` | Order tracking |
| `/mesero/[table]/cierre` | Check / pay |
| `/cocina` | Kitchen Display (stations: cocina / parrilla / barra) |
| `/presentacion` | Two-device auto-tour (~45 s per cycle) |

## Seeded state on every boot

12 mesas divided **Salón** (1–8) and **Terraza** (9–12). On `boot()`:

- **Mesa 03** — `preparing`, 4 guests, opened 22 min ago, order `o-041` (Misael)
- **Mesa 05** — `ready`, 3 guests, opened 31 min ago, order `o-039` (Misael)
- **Mesa 12** — `check`, 2 guests, history `o-038` (Juan)
- **Mesa 08** — `free`, reserved for live demo flow
- The remaining 8 — `free`

Three takeaway tickets already in flight on KDS:
- `o-040` *Para llevar · Laura* — `preparing` (Misael, sent 11 min ago)
- `o-042` *Para llevar · Don Ramiro* — `pending` (Pedro, sent ~2 min ago)
- `o-043` *Para llevar · Andrea* — `pending` (Juan, sent ~42 s ago)

Next order number is **44**.

## Acceptance criteria (manual smoke test)

Run **two tabs side by side** to prove the cross-device sync — one in `/mesero/8/comanda` and one in `/cocina`.

### 1. Build & serve

```bash
npm run build && npm run preview
```

- ✅ Build exits 0, generates 53 pages.
- ✅ Preview serves without console errors.

### 2. Boot determinism

- Open `http://localhost:4321/`, click into `/mesero`.
- ✅ Mapa shows 12 mesas with **03** highlighted as preparing, **05** as ready, **12** as check.
- ✅ The other 9 are free. Mesa **08** is free and empty.

### 4. Cross-tab sync (the headline test)

Tab A → `/mesero/8/comanda`, sign in as **Misael** at `/inicio` first if needed.
Tab B → `/cocina`.

1. Tab A: open Mesa 08, add 2× `Birria de res`, 1× `Consomé grande`, send.
2. Tab B: ticket `o-044` appears within ~100 ms under **Parrilla** and **Cocina** stations, status `pending`.
3. Tab A: navigate to `/mesero/8/seguimiento`.
4. ✅ Tab A shows the same ticket with stations ticking up.
5. Tab B: mark **Parrilla** ready → Tab A updates within ~100 ms.
6. ✅ Both tabs converge on the same state. Reload either tab and the state persists from `localStorage`.

If sync is silent: open DevTools console and check `$connection` is `live` (BroadcastChannel) not `fallback`. The connection badge is rendered in the header.

### 5. Presentation auto-tour

Open `/presentacion` in a fresh tab (or in Tab C while A and B run the sync test).

- ✅ Cycles through pantallas every ~45 s.
- ✅ Two device frames share the same store via the BroadcastChannel.

### 6. Reset

Call `resetDemo()` from DevTools (`import("/src/stores/demo.ts").then(m => m.resetDemo())`) or add a temporary button.

- ✅ All 12 mesas return to seed.
- ✅ Next order number is **44** again.
- ✅ Other tabs receive `DEMO_RESET` event and re-converge.

## Architecture cheat sheet

```
src/
├── stores/        # demo, orders, restaurant, session — single source of truth (nanostores)
├── lib/
│   ├── sync.ts          # BroadcastChannel + storage fallback (CHANNEL_NAME = "grill-perron-demo")
│   ├── persistence.ts   # localStorage envelope (STATE_VERSION = 3)
│   ├── nav.ts           # Go(WaiterRoute) abstraction
│   ├── images.ts        # getFoodImages() from getImage() manifest
│   └── time/, money/, paths/, orders/, reveal/, chrome/
├── components/
│   ├── astro/    # DeviceFrame, Header, Logo, PageShell, TableBand
│   ├── islands/  # 10 React islands (client:only="react" where stateful)
│   └── ui/       # Chip, FoodPhoto, Stepper, Timer, status
├── data/         # demo, products, types
├── pages/        # Astro routes
└── assets/food/  # 12 jpgs (Wikimedia Commons CC, optimized)
```

## Known gotchas

- `astro dev` runs as a daemon: `astro dev stop` / `astro dev status` from anywhere in the project.
- View-transition morph for the product photo: the `view-transition-name` MUST be set on the card element **before** `startViewTransition`, then moved into the sheet inside the update callback.
- All state lives in `localStorage`. SSR would cause hydration mismatch — that's why every stateful island uses `client:only="react"` with an Astro fallback skeleton.
- To wipe the demo state during testing: `localStorage.removeItem("grill-perron-demo:state")` in DevTools, then reload.