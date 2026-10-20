# v2: design notes

Preview of the redesign, served at `/v2` beside the live homepage (`noindex` until it replaces
it). Built with the awwwards skill; the full working notes (three concepts, QA passes, critic
scores) live in the `brendatamaar/portofolio` repo's `DESIGN.md`.

## Idea

The site measures itself. Network tools color requests by type, and so does this site: every
card color is the legend of a live waterfall that lists the real requests the visitor's browser
made to load the page (Resource Timing API, nothing invented). The hero tag, the stat cards and
the footer colophon read the same numbers; one row, "you", stays open and keeps counting while
the visitor stays.

## System

- **Palette:** navy `#0e1a2b`, white ground, raised `#f3f4f8`, muted `#5b6577` (5.9:1) and
  `#a9b3c7` on navy (8.3:1). Type colors: orange `#ff8a1e` (document), lavender `#9c8cff`
  (stylesheet), lime `#d7ec4a` (script), coral `#ff5b3a` (font), green `#21b47d` (image).
  Text on every colored card is navy (5.7 to 13.3:1).
- **Type:** Archivo variable (width 62%, weight 850, uppercase) for display, Archivo for text,
  JetBrains Mono only for machine values. Self-hosted in `public/v2/fonts`.
- **Shape:** 1.5rem cards with a bitten top-right corner (`.bite`) holding a round arrow; pills;
  tilted tags with a 2px navy outline; stickers (squiggle, stars, a turning badge).
- **Motion:** stickers pop with a spring; cards lift and tilt on hover while the arrow turns;
  navigation inside `/v2` is four type-colored bands streaming in like waterfall rows, then the
  real status and fetch time. One clock (GSAP ticker drives Lenis and everything else); reduced
  motion gets native scroll and no reveals.

## Data

Everything personal comes from the API (`loadResume`, `loadPosts` in `data/content.ts`), so admin
edits show up here too. `data/content.ts` holds only the section copy, fallbacks for when the API
is down, and `details`: English translations of the longer Indonesian project descriptions.

## Files

- `layouts/V2.astro`: head, SEO, curtain, ClientRouter, engine start
- `components/`: Header, Footer, Logo, Sticker, Waterfall, NotFound
- `engine/`: GSAP + Lenis page lifecycle (reveals, transitions, scroll)
- `motion/`: the waterfall driver, the visit clock, transitions and page effects
- `styles/`: tokens, engine base, site styles (plain CSS, no Tailwind)
- pages: `src/pages/v2/index.astro`, `v2/work/[slug].astro`, `v2/[...rest].astro` (404)

Links that leave `/v2` (the blog, the resume PDF) use `data-astro-reload` so the live site's
router and this one never swap into each other.
