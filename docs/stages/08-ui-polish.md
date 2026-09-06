# Stage 8 — UI Polish

**Goal:** make the whole demo feel like one product: cream white and black, editorial, calm.

## Checklist

- Landing page `/` with a hero, three feature blocks (Recruit · Evaluate · Build), and links to demo personas.
- Consistent page headers (eyebrow · title · description · actions) via `PageHeader`.
- Tables: hairline rules, uppercase small caps headers, hover row tint.
- Cards: 1px black border, cream surface, no shadow; hover lifts border to 2px or fills black with cream text for primary CTAs.
- Badges for statuses with a fixed color map (`src/lib/status.ts`).
- Empty states with a short serif sentence and one action.
- Loading states (`loading.tsx`) for board, project, applications.
- Responsive: nav collapses, board scrolls horizontally, flow canvas scrolls.
- Dark mode explicitly disabled (the palette is the brand).
- Walk every route in the browser, fix anything broken, screenshot for the README.
