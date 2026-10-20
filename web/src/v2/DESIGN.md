# v2 design notes

The v2 portfolio lives at `/v2` beside the current site. Nothing under `/`, `/blog` or `/id`
changes. v2 code is in `src/v2/` and `src/pages/v2/`; screenshot variants in `public/v2/img/`.

## Direction

Pure Sewagi. The design system in `src/globals.css` (Poppins, teal / peach / navy with butter,
lilac and apricot, 2px corners, pills, chips, tags, cards, the hive hexagons, the dot field,
warm and cool banner gradients, light and dark themes) is the base and is imported as is.
v2 adds only what a portfolio needs that a product guide lacks, in `src/v2/v2.css`:

- **A display tier** above Sewagi's 40px h1 (`type-display`, up to 68px) and a section tier
  (`type-section`, up to 48px). Same family, weight and tracking logic.
- **The honeycomb** (`Hive.astro`): Sewagi's hexagons tessellated instead of scattered. The
  hero hive holds two real product screens (cheSKP, AIR Tax) among pastel cells; the connect
  band and the 404 have their own.
- **Hover motion**, one treatment per role (below).
- **A page transition** in the Sewagi shape: a navy hexagon opens from the click point.

## Brief

- **Subject:** Brendatama Akbar Ramadan, web software developer at PLN Icon Plus (the IT arm
  of PLN, Indonesia's state electricity company), Jakarta. Front-end since 2019.
- **Audience:** hiring managers, tech leads, recruiters.
- **Job:** show real enterprise work and side projects, start a conversation.
- **Content:** resume, projects and posts from the API; copy and project notes in
  `src/v2/data/content.ts`.

## System additions

| Thing          | Rule                                                                                                           |
| -------------- | -------------------------------------------------------------------------------------------------------------- |
| Container      | `container-wide`, 1280px max (Sewagi's page is 1140) so grids breathe                                          |
| Section rhythm | 96 to 128px blocks; Work sits on the `bg-sunken` band, Connect on navy                                         |
| Section label  | Sewagi pattern kept: hex-bullet eyebrow, peach number, title, one lead line                                    |
| Motion verb    | settle into the hive: things rise and settle with a soft overshoot (`back.out`) for hexes, `expo.out` for text |
| Durations      | hover 0.3 to 0.5s, reveals 1 to 1.3s, transition 0.85s in and 0.75s out                                        |

### Contrast (WCAG AA)

The guide's own pairs fail AA in a few places: white on light teal (2:1), `#8A8989` small
text on white (3.5:1), peach text and white-on-peach tags (1.8:1). v2 keeps every hue and only
moves the text: navy on teal buttons, muted `#6B6A6A` in light mode, a deeper peach
(`.ink-peach`, `#B05F33`) for peach text on light grounds, navy on peach tags, `#9A5229` for
outline tags. Dark mode keeps Sewagi's values, which already pass.

### Hover and focus, one treatment per role

- **Buttons, chips, pills:** the uppercase label rolls to an identical copy; arrows travel;
  the primary button floods navy.
- **Cards (projects, posts, next project):** lift 6px, raised shadow, media eases to 1.04,
  the corner hexagon slides, the title turns link teal.
- **Nav:** Sewagi's 3px teal underline draws in; the current section or page keeps it.
- **Theme switch:** a teal halo and the knob swells.
- **Inline links:** underline at rest, thicker on hover.

Every hover state is also on `:focus-visible`. Under reduced motion nothing moves; colour and
underline states remain.

### Idle state

The honeycombs are the only things that move at rest: each cell drifts on a slow sine and
leans toward the pointer by its depth (scroll velocity on touch). They stop off screen and
never move under reduced motion. The tech-stack marquee drifts too and reacts to scroll.

### No loader

A product-flavoured portfolio does not earn one. The hero headline is visible at first paint
(it is the LCP) and settles into place; the honeycomb pops in cell by cell.

## Pages

- `/v2`: hero, 01 Projects (side projects, the first one wide), 02 Work (every job; the
  current one shows its products as cards), tech stack marquee, 03 Writing, 04 Connect.
- `/v2/work/<slug>`: case page for every project, work and side: banner tag, display title,
  facts panel, screenshot or pastel cover, what it does, how it is built, next project.
- 404 (any unknown `/v2/...`): "This cell is empty", a hive with one outline cell.

## QA notes

- Back/forward lands the page finished at its restored scroll position (no replayed intro).
- `font-variation-settings` is not used; Poppins is static.
- Links leaving v2 (blog, classic site, resume) carry `data-astro-reload` so the v2 motion
  engine never runs on a classic page.
