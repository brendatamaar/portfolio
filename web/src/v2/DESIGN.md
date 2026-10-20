# v2 design notes

The v2 portfolio lives at `/v2` beside the current site. Nothing under `/`, `/blog` or `/id`
changes. All v2 code is in `src/v2/` and `src/pages/v2/`; fonts in `public/v2/fonts/`.

## Brief

- **Subject:** Brendatama Akbar Ramadan, web software developer at PLN Icon Plus (the IT arm
  of PLN, Indonesia's state electricity company), Jakarta. Front-end since 2019.
- **Audience:** hiring managers, tech leads, recruiters; Indonesian and international.
- **Job:** show the depth of real enterprise work, start a conversation (email, resume).
- **Assets:** resume data and posts from the existing API, four project screenshots plus a
  skenatify screenshot already in `public/images`, the resume PDF.
- **Constraints:** same Astro 5 SSR app, same API, no changes to the current pages.

## Concepts

|                     | Idea                                                                                                                                 | Anchor                                                                         | Signature                                                                                                                                          | O / F / Fe / P |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| A. Material / place | The site is a single-line diagram: one live line runs from a 220 V source to ground, and every project is a node the current reaches | six of his eleven projects run the business of Indonesia's electricity company | scrolling pushes current down the line; each node it reaches energizes (its name stretches from condensed to expanded, its screenshot gains color) | 4 / 4 / 4 / 2  |
| B. Process          | Everything is encoded: sections arrive as 8×8 DCT blocks and decode into sharp type and images                                       | he wrote a baseline JPEG encoder from scratch                                  | images quantize and resolve on scroll and hover (GL)                                                                                               | 3 / 3 / 3 / 3  |
| C. Interests        | A save file: career as a quest log, stack as stats, projects as inventory                                                            | he lists RPG games among his interests                                         | an inventory grid that equips projects                                                                                                             | 2 / 3 / 4 / 4  |

**Pick A.** It is built on the one fact nobody else on Awwwards shares (the work powers an
electricity company), it gives a full rule system (line, nodes, source, ground, open circuit),
and it needs no WebGL: SVG and variable-font axes carry it. Stolen from the runners-up: nothing
structural. The loader borrows the prepaid kWh meter every Indonesian household knows: it counts
to 220 V, the real mains voltage.

## Concept card

```
Idea:        The portfolio is a live single-line diagram: current runs from a 220 V source to
             ground, and each project is a node it energizes.
Metaphor:    an electrical single-line diagram (source, bus, feeders, nodes, earth)
Signature:   scroll drives the current front down the bus; every node it passes energizes
             (title stretches from Archivo width 62 to 125, the branch wire draws, the
             screenshot turns from monochrome to color). A pulse keeps travelling the live part
             of the line at rest. Recipe: driver module (patterns.md 1) + kinetic type axis
             (motion.md) + idle input (motion.md).
Emotion:     a switch thrown: quiet, then precise, then on.
Motion verb: energize. A wire draws first, then whatever it reaches lights up.
Screenshot:  the hero: a red line falling from "220 V" past a giant expanded BRENDATAMA.
```

Section and copy vocabulary follows the metaphor without puns in every heading: "On the grid"
(Icon Plus work), "Off grid" (side projects, their own small circuits), "Line history"
(career), "Notes" (writing), "Ground" (contact, where the line terminates). 404 is an open
circuit.

## System

### Palette

| Role    | Name      | Hex                    | Use                                                                                                                            |
| ------- | --------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| ground  | zinc      | `#E2E4DF`              | page ground: galvanized steel of substation gear                                                                               |
| ink     | cable     | `#111312`              | all text, dead wires, curtain                                                                                                  |
| muted   | insulator | `#545A55`              | secondary text (5.5:1 on zinc)                                                                                                 |
| line    | conduit   | `rgb(17 19 18 / 0.16)` | hairlines, grid rules                                                                                                          |
| accent  | live      | `#E8410C`              | current only: the live line, energized nodes, CTA fill. 3.2:1 on zinc, so only on large text and strokes; ink on live is 4.6:1 |
| curtain | cable     | `#111312`              | transitions, the ground (footer) band                                                                                          |

The accent never decorates; if something is red, current is in it.

### Type

- **Archivo** variable (wght 100 to 900, wdth 62 to 125), display and text. Display is
  uppercase, wght 800. Unpowered state is wdth 62 (condensed); energized is wdth 125.
  Tracking -0.02em at display size (the expanded cut already opens counters), leading 0.86.
- **Martian Mono** variable, only for data a diagram would print: voltages, years, stacks, node
  counts. 12 to 13 px, uppercase off, tracking 0.
- Scale: `--t-mega` fits the name to the column with container units; `--t-xl`, `--t-l`,
  `--t-m`, body 16 to 18 px with 1.55 leading.

### Grid and rhythm

- 12 columns, gutter = outer margin. Column 1 belongs to the bus: the line hangs on its center
  on every page. All content starts at column 2. On phones the bus sits 20 px from the edge and
  content is indented 48 px.
- Section rhythm: hero full viewport; grid list tight; off grid airy; line history tight;
  notes normal; ground full viewport.

### Shape

Radius 0 for everything except node dots and the source symbol (circles, as in a diagram).

### Motion language

- Eases: `expo.out` entrances, `expo.inOut` transitions, `power3.out` hovers. One custom name:
  none needed.
- Durations: hover 0.35 to 0.5 s; wire draw 0.5 s; title energize 0.9 s; transition 0.9 s each
  way.
- Treatments, one per role:
  - Project rows and covers (primary): their branch wire draws from the bus, the title
    stretches to full width axis and turns live, the arrow travels 6 px.
  - Nav: an underline wire draws left to right; current page keeps it.
  - CTA buttons: live fill floods from the left like a wire charging, label stays ink.
  - Utility links (social, colophon): underline at rest, color change only.
- Page transition: a live wire draws across the screen's middle, the cable panel opens from
  it to cover, then closes back onto the wire on the new page and the wire retracts.
- Loader: no curtain. The hero itself powers up: the counter at the source counts 000 to 220 V
  while the bus fills, then the name energizes. First load only.
- Idle: a short pulse travels down the live part of the bus forever (paused under reduced
  motion). Node dots on live nodes keep a faint glow.
- Reduced motion: no smooth scroll, every node energized, wire fully live, no pulse.

### Composition (desktop)

```
HERO (poster)
| o 220 V / 50 Hz  Jakarta                         Work  Off grid  Notes  Contact
|
| B R E N D A T A M A                     (mega, fills cols 2 to 12)
|                   A K B A R             (mega, starts col 6)
| statement (cols 2 to 5)      [Email me] [Resume]
* Energized 0 / 11

ON THE GRID (index list, rows branch off the bus)
|-- AP2T                 one line           Vue 3, TypeScript ...    ->
|-- AIR TAX              ...
|-- ...

OFF GRID (gallery wall, staggered covers on cols 2 to 12, two sizes)
|   [cover 7 cols]          [cover 4 cols, lower]
|        [cover 5 cols]   [cover 5 cols]

LINE HISTORY (data facts, horizontal rail of years)
| 2017 ---- 2019 ---- 2020 ---- 2022 ---- now
|  CCIT UI   Tebuireng   Cipta Kreasi  Icon Plus

NOTES (statement list: date in mono, title large, one per row, no previews)

GROUND (full viewport cable band, ends the bus in an earth symbol)
| Email me (mega link)
| GitHub  LinkedIn  Resume      colophon
⏚
```

Case page: breadcrumb node, mega title, summary at t-l, meta (company, stack, link), hero
screenshot (or the project's generated diagram), "What it is" / "What's inside" asymmetric
pair, stack list, next node as a mega link.

### Genericness test

A generic model asked for a developer portfolio lands on: dark ground, mono everywhere, green
terminal accent, a bento grid of project cards. Changed: light zinc ground, mono only for data,
one red that means current, an index list hung off a wire instead of cards, type that changes
width with state instead of fading in.

### Images

Real screenshots exist for AIR Tax, cheSKP, ESDS, jpeg-encoder and skenatify. They are shown
monochrome until their node is energized. Projects without a screenshot get a generated
single-line diagram seeded by their title (honest generative art, not a fake screenshot).

### Still or moving

Home and case pages are never still: a pulse with a spark at its head runs down the visible
live part of the bus. The 404 is still on purpose: it is an open circuit, so no current flows.

## QA notes

- Loader budget is measured from navigation start (1.0 s floor, 1.9 s cap), so a slow boot on a
  throttled phone still lands under 2.6 s.
- Row and cover hovers key off the link itself, not the list item, so the gutter never counts
  as hovering.
- `font-variation-settings` inherits as a computed value: `.display *` re-resolves `--wdth` on
  every child, otherwise per-line energize states are ignored.
