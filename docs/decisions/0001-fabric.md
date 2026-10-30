# 0001. Tapestry Fabric: display modes and page lists

- Status: Accepted (the user, 2026-10-23); built in 0.1.0 (below)
- Date: 2026-10-23

## Context

`@nascencestudio/tapestry-fabric` creates content types "by proxy": a page's categories and tags say what kind of
page it is, its template says how it looks, and display modes (Tapestry ADR 0046) say how it's shown. Fabric adds
the Display Modes page and a component that lists other pages, like a small Drupal view.

The user's example: a **News Item** template whose content area is shown in Full and Teaser; ten pages in the
**News Item** category using that template, each with an article (Full tab) and a summary (Teaser tab); and a
**News** page with a list of the 5 newest News Items as teasers.

## Decision

### 1. Display Modes page (dashboard)
- Laid out like Template Management's Templates list (same dashboard layout, table, dialogs). Editors view, admins
  change.
- Installing Fabric gives **Full** (default) and **Teaser**. Neither can be renamed or deleted (the user's
  choice). Admins add modes up to **16** in all; added modes can be renamed (their key stays) and deleted.
- Each row shows where the mode is used: "7 components in 2 templates", counted from template bodies' `modes`.
- Deleting a mode in use asks for its name, like deleting a template in use. Components whose only mode it was go
  back to Full; pages' content for it is kept but no longer shown (ADR 0046).
- Stored in Tapestry plugin data like templates (Kysely, known issue #25), validated on every read.

### 2. Page list component ("Page list" in the library)
Settings:

| Setting | Type | Default |
| --- | --- | --- |
| Categories | multi-select (the site's categories) | none = any |
| Tags | multi-select (the site's tags) | none = any |
| Template | select (Template Management's templates) | none = any |
| Display mode | select (the modes) | Teaser |
| Number of pages | number, 1–50 | 5 |
| Sort by | Newest first, Oldest first, Title A–Z | Newest first |
| Link each item to its page | boolean | on |
| When a page's teaser is empty: trim its Full text to | number of characters, 0 = off | 200 |
| Show page links | boolean (then Number of pages is the page size) | off |

Matching:
- A page matches when it has **any** selected category (subcategories count as their parent) **and any**
  selected tag **and** uses the selected template; an empty setting doesn't filter.
- Only what a visitor may see: published, not a StudioCMS draft, in the list page's language (translations).
- **Never the page the list is on**, or its translations.
- **Lists don't nest:** a list inside a listed page's content renders nothing (in the editor: a short note). This
  stops every loop (A lists B, B's teaser lists A) and bounds the work.
- Dates for sorting: the page's published date.

Rendering each item:
- The page in the chosen mode (`pageInMode()`, Tapestry ADR 0046), published version, through the same pipeline
  as any page.
- **Simple card** when that gives nothing (no template, or nothing in that mode): the page's title, plus the
  trimmed text when trimming is on.
- **Trim:** plain text only (like Drupal summaries): the text of the page's Full content, rich text and
  multi-line text fields in page order, cut at the last word boundary before the limit, then "…". No markup can be
  cut because none is kept; styling is the site's job.
- **Link:** the item's title (simple card) or a "Read more" link after the item, to the page's current address.
- Nothing matches: visitors get nothing; the editor shows "No pages match these settings."
- Classes on everything for styling: `fabric-list`, `fabric-list--<mode>`, `fabric-item`, `fabric-item--<mode>`,
  `fabric-card`, `fabric-title`, `fabric-summary` (trimmed text), `fabric-link`, `fabric-empty`.

In the editor:
- The settings panel shows what matches: "Matches 12 pages: Launch day, Q3 results, …" and warns when some have
  nothing in the chosen mode.
- Items are foreign content on the canvas (not selectable).

### 3. Package
- A StudioCMS plugin like tapestry-menus: a `COMPANIONS` entry in Tapestry (the modes source), its components
  registered with `tapestry({ components: [...fabricComponents()] })`, the Display Modes dashboard page, and
  editors-only endpoints for the list's options and the match preview (same-origin, like Tapestry's).
- No new dependencies. Peers: Tapestry ≥ 0.7.0, StudioCMS `^0.6.0 || ^0.7.0`. Requires Tapestry's shipped
  StudioCMS and SDK patches (tags and categories: known issues #42, #43).

## Consequences

- Built after Tapestry 0.7.0's display modes. Unit tests (matching, trimming, limits), an e2e suite in the
  playground (the user's News example end to end), a11y states (Display Modes page, list settings).
- Later, if wanted: pagination, a "Preview as" switch in the template editor, template ↔ category suggestions.

## Built (2026-10-23)

As decided, except:

- **The "Matches N pages" note is on the canvas**, at the top of the list (editors only), not in the settings
  panel: Tapestry's settings panel has no place for a companion's widgets inside a component's settings.
- **Display modes are stored by Tapestry** (`@nascencestudio/tapestry/modes`), not in Fabric's own plugin data:
  Tapestry's editor, validator and renderer read them without loading Fabric.
- **Read more** links are named "Read more: <title>" for screen readers; cards' titles are `h3` links.
- **Page links** (added 2026-10-30, the user's request): with "Show page links", Number of pages is the page
  size and Previous / "Page 2 of 4" / Next links follow the list (`fabric-pager`, `fabric-pager__previous`,
  `__status`, `__next`). Each list has its own URL parameter, its node id (`?<id>=2`; Tapestry's `withNodeId`),
  so several lists on one page page on their own and other parameters are kept. Page 1 is the plain address;
  nonsense or out-of-range numbers show page 1. In the editor's canvas the links go nowhere.
- **Classes follow the mode's name** (2026-10-30, the user's bug report): `fabric-list--<name>` and
  `fabric-item--<name>` use the mode's current name (Tapestry's `modeClassName()`), so renaming a mode renames
  them; the Display Modes page shows the classes, not the key.
