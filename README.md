# @nascencestudio/tapestry-fabric

**Content types by proxy for [Tapestry](https://github.com/nascencestudio/tapestry) sites on
[StudioCMS](https://studiocms.dev):** say what kind of page something is with categories and tags, how it
looks with a template, and show it anywhere as a teaser, card or anything else, with a Page list.

- **Dashboard → Display Modes:** the ways a page can be shown. **Full** (the page itself) and **Teaser**
  come built in; admins add their own, up to 16. Each mode shows where it's used. Editors can look.
- **Templates decide what each mode shows:** in Template Management, every component of a template gets
  a **Shown in** setting (Full by default). A content area shown in several modes gets a **tab per mode**
  on its pages: authors write the article in the Full tab and the summary in the Teaser tab.
- **The Page list component:** pages by category (subcategories count too), tag and template, newest
  first (or oldest, or by title), up to 50, each shown in the display mode you choose and linked to the
  page. A page with nothing in that mode becomes a simple card: its title and, if you like, the start of
  its text (plain text, trimmed at a word).
- **Safe by design:** only pages visitors may see, in the page's language. A list never shows the page
  it's on, and lists inside listed pages don't render (no loops).
- **Unstyled, with classes on everything:** `fabric-list fabric-list--teaser`, `fabric-item
  fabric-item--teaser`, `fabric-card`, `fabric-title`, `fabric-summary`, `fabric-link`. No JavaScript
  reaches your visitors.

## Requirements

- Node ≥ 22.12, Astro 7, StudioCMS 0.6 or 0.7, Tapestry ≥ 0.7
- Tapestry's StudioCMS and SDK patches (Tapestry's README): without them, StudioCMS can't create tags or
  categories, and a page with one fails to load.

## Install

```sh
pnpm add @nascencestudio/tapestry-fabric
```

```js
// studiocms.config.mjs
import tapestry, { tapestryComponentRegistry } from '@nascencestudio/tapestry';
import tapestryFabric from '@nascencestudio/tapestry-fabric';
import { fabricComponents } from '@nascencestudio/tapestry-fabric/components';
import { defineStudioCMSConfig } from 'studiocms/config';
import { components } from './src/tapestry.config.mjs';

export default defineStudioCMSConfig({
  componentRegistry: { ...tapestryComponentRegistry() },
  plugins: [
    // The Page list joins your components in the editor's library.
    tapestry({ components: [...components, ...fabricComponents()] }),
    // After Tapestry: Display Modes then follows Template Management in the sidebar.
    tapestryFabric(),
  ],
});
```

Installing Fabric turns on Tapestry's display modes. Page routes must load pages with Tapestry's
`getPage()`, so lists know which page they're on and its language.

## Use: a News page

1. **Taxonomy:** create a category, e.g. **News item**.
2. **Template Management → Templates:** create a **News item** template. Add what every article shares (a
   banner, a back link) and a **Content area**. In the content area's settings, **Shown in**: add
   **Teaser** next to Full.
3. **Pages:** create articles in the News item category using the News item template. On each one the
   content area has two tabs: the article goes in **Full**, a short summary (heading, sentence, image)
   in **Teaser**.
4. **The News page:** add a **Page list**: Categories = News item, Template = News item, Display mode =
   Teaser, Number of pages = 5. In the editor it says what matched.
5. **Style it,** e.g. teasers in a grid:

```css
.fabric-list--teaser { display: grid; grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr)); gap: 1.5rem; }
.fabric-item--teaser .fabric-link { font-weight: 600; }
```

## How it's built

Tapestry Fabric is developed with an AI coding assistant (Anthropic's Claude), directed by its
maintainer at Nascence Studio, who sets the requirements, makes the decisions and checks the results.
Commits written with its help say so (`Co-Authored-By`).

- **Decisions are written down** in [docs/decisions](docs/decisions/), and each working session in the
  [devlog](docs/devlog.md).
- **Behaviour is tested.** Unit tests cover the settings, matching (subcategories, loops in category data,
  the list's own page and its translations), sorting, the plain-text trim and nested lists. Browser tests
  in [tapestry-playground](https://github.com/nascencestudio/tapestry-playground) build the News example
  end to end, including an accessibility audit.
- **Everything is checked on the server:** only admins change display modes, only editors read the
  choices, and lists show only what visitors may see.
- **No dependencies** of its own beyond Tapestry, Astro and StudioCMS.

Found a problem? Please [open an issue](https://github.com/nascencestudio/tapestry-fabric/issues).

## License

MIT © Nascence Studio
