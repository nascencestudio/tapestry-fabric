# Devlog

Short notes for this repo; the full record is in tapestry-playground's devlog.

## 2026-10-23: 0.1.0 built

- Design with the user (playground sessions 49–50): display modes on templates, a tab per mode on content
  areas, the Page list (categories, tags, template, mode, number, sort, link, trim). ADR 0001.
- Built on Tapestry 0.7.0 (ADR 0046). 11 unit tests; the playground's `fabric` suite (7 steps, the News
  example) and Fabric's a11y states.

## 2026-10-30: page links

- "Show page links" on the Page list: Number of pages becomes the page size; Previous / Page n of m / Next,
  each list with its own parameter (its node id, Tapestry's `withNodeId`). 15 unit tests.

## 2026-10-30: classes follow names

- Renaming a mode didn't change its CSS classes (they used the key): now they come from the name; names with
  the same class are refused. The Display Modes page shows the classes instead of the key.

## 2026-11-24: 0.1.1, dependency refresh

- Dev dependencies: Tapestry 0.7.2, astro 7.4.13 (clears GHSA-mh32-jxcr-mh9f and GHSA-r3h5-4585-7x3w),
  biome 2.6.8 (Markdown/YAML formatting kept off), vitest 5.1.1, @types/node 22.20.5; `.nvmrc` 22.23.4
  (astro ≥ 7.4.7 needs it); actions/setup-node 7.1.0.
- minimatch GHSA-g3hv-75wg-m249 fixed (`@ts-morph/common` 0.29.1 → minimatch 11.0.9), ignore removed;
  braces still unpatched, re-check 2026-12-24. Dependabot ignores `@types/node` majors.
- Held: TypeScript 7.
