# CLAUDE.md: @nascencestudio/tapestry-fabric

The source of truth for anyone (human or AI) working in this repo. Read it at the start of every
session and keep it current.

## What it is

Content types by proxy for Tapestry sites on StudioCMS ([ADR 0001](docs/decisions/0001-fabric.md)): the
Display Modes dashboard page and the Page list component. The display-mode machinery itself ("Shown in",
area tabs, rendering in a mode, mode storage) is in Tapestry (its ADR 0046); installing Fabric turns it on.
Requires the Tapestry plugin (≥ 0.7.0). Nascence Studio, MIT.

Sibling checkouts in `/Volumes/T7/www/`: `tapestry/`, `tapestry-menus/` (the closest relative),
`tapestry-playground/` (dev site and browser tests: `e2e/fabric.e2e.mjs`, Fabric states in
`e2e/a11y.e2e.mjs`), and this repo. The devlog of record for the whole project is the playground's;
this repo has its own short one.

## Status

- **0.1.0 released 2026-10-31** (GitHub `nascencestudio/tapestry-fabric`, npm with provenance), on Tapestry
  ≥ 0.7.0 (dev dependency from npm; 0.7.1 makes empty multiple-choice fields show their box). Releases: bump
  `version`, PR, merge, GitHub release `v<version>`, approve the staged version on npmjs.com (trusted
  publishing only; no tokens).

## Rules

1. **Security first.** pnpm only (never npm/npx/yarn; `pnpm view`). Hardening in `pnpm-workspace.yaml`
   with written reasons. Pin exact versions. No runtime dependencies; a new one needs a reviewed ADR.
   `pnpm audit` must pass. No Meta libraries.
2. **Untrusted input:** settings come through Tapestry's validator, then `parseSettings()`; lists show only
   `listPagesForLists()` pages (visible to visitors), never the host page, never nested lists. Excerpts are
   plain text (Astro escapes them). The modes endpoint: same-origin POSTs, size-limited, admins only;
   options: editors only.
3. **Document everything:** devlog entry each session; decisions as ADRs (`docs/decisions`, 0001+).
4. **Tests with every change**; keep the playground's `fabric` and `a11y` suites passing.

## Layout

```
src/
├── index.ts          ← plugin: routes, the Display Modes dashboard page (after Template Management)
├── components.ts     ← fabricComponents(): the Page list definition (`fabric-page-list`)
├── list.ts           ← pure: settings, matching, subcategories, sorting, excerpt(), withoutLists(), category labels
├── modes-errors.ts   ← Display Modes error codes → messages
├── routes.ts         ← /_fabric/options/[kind], /_fabric/modes
├── thumbnails/       ← library thumbnail
└── runtime/          ← PageList.astro, DisplayModes.astro, options-endpoint.ts, modes-endpoint.ts, terms.ts, http.ts
test/list.test.ts
```

## Gotchas

- StudioCMS names the dashboard page `nascencestudio_tapestry_fabric/display_modes` (every
  non-alphanumeric character of the identifier and route becomes `_`).
- Template Management's styles are scoped to its component; the Display Modes page has a copy under
  `fabric-modes__*` (keep them alike).
- Tapestry's settings panel has no place for a companion's widgets inside a component's settings, so the
  "Matches N pages" note is on the canvas (`inEditorCanvas()`), never for visitors.
- `select` with `optionsUrl` hides its chips box while the choices load: wait for it in e2e.
