# Blog System Rules

Reference for writing posts and understanding how the blog editor and viewer work.
Applies to both the author (writing reference) and Claude (AI context for this project).

---

## Architecture Overview

```
Admin editor (admin/)  →  Hono API (server/)  →  SQLite  →  Public site (web/)
                                  ↑
                         shared/markdown/  (isomorphic parser)
```

- **Editor**: `admin/src/lib/components/Editor.svelte` (SvelteKit) — split-pane markdown editor, with `Toolbar`, `EditorHeader`, `MetaSidebar`, `GlossaryPane`, `BibliographyPane` and `PostPreviewModal` beside it
- **Parser**: `shared/markdown/parser.ts` — `parse(md, ctx?) → { html, toc, sidenotes }`. The server runs it and returns rendered HTML; the editor runs the same code for its live preview.
- **Viewer**: `web/src/pages/blog/[slug].astro` (and `web/src/pages/id/blog/[slug].astro`) → `web/src/folio/components/PostView.astro`, data from `web/src/folio/data/post.ts`, behaviour in `web/src/folio/scripts/post.ts`, styles in `web/src/folio/styles/post.css`
- **Layout**: one 672px text column. From 1240px wide, margin notes sit to its left and the contents list to its right.

---

## Editor

### Layout

The editor is a full-screen split-pane app at `http://localhost:4322` (`pnpm -C admin dev`).

| Zone             | Description                                                                         |
| ---------------- | ----------------------------------------------------------------------------------- |
| **Header bar**   | Back link, language tabs (EN/ID), title input, status badge, Preview/Publish/Save   |
| **Tab bar**      | Content / Glossary / Bibliography tabs                                              |
| **Toolbar**      | Formatting buttons + view mode toggle                                               |
| **Editor pane**  | Raw markdown textarea (Content tab) or form/raw editor (Glossary/Bibliography tabs) |
| **Preview pane** | Live rendered HTML (uses the same parser as production)                             |
| **Meta sidebar** | Slug, date, description, cover image, tags, heading outline                         |
| **Footer**       | Word count + character count                                                        |

### View Modes

Three modes toggled from the toolbar (right side):

| Mode            | Icon        | Keyboard       |
| --------------- | ----------- | -------------- |
| Editor only     | `PanelLeft` | —              |
| Split (default) | `Columns2`  | —              |
| Preview only    | `Eye`       | `Ctrl+Shift+P` |

**Sync scroll**: In split mode, the chain-link button links editor and preview scroll positions proportionally.

### Content Tabs

Three tabs below the header bar organize post content:

| Tab              | Description                                                                            |
| ---------------- | -------------------------------------------------------------------------------------- |
| **Content**      | Main article markdown editor. Supports split-pane editing with live preview.           |
| **Glossary**     | Term definitions referenced via `[gloss:key]` in content. Dual-mode editor (Form/Raw). |
| **Bibliography** | Citations referenced via `[cite:key]` in content. Dual-mode editor (Form/Raw).         |

**Glossary & Bibliography Editor Features:**

- **Form mode**: Add, edit and remove entries one by one with form fields
- **Raw mode**: Edit all entries as plain text (see the Glossary and Bibliography sections below for the format), then **Apply & switch to Form**
- **Mode toggle**: Form/Raw buttons at the top of the tab. Raw mode resets when the language tab changes.

### Keyboard Shortcuts

| Shortcut       | Action                                  |
| -------------- | --------------------------------------- |
| `Ctrl+S`       | Save (keeps the current status)         |
| `Ctrl+B`       | Bold — wraps the selection in `**`      |
| `Ctrl+I`       | Italic — wraps the selection in `*`     |
| `Ctrl+K`       | Link — wraps the selection in `[](url)` |
| `Ctrl+Shift+P` | Toggle preview / split mode             |
| `Tab`          | Insert 2 spaces                         |

`Cmd` works in place of `Ctrl` on macOS.

### Toolbar Buttons

**Inline formatting**

- Bold (`**text**`)
- Italic (`*text*`)
- Underline (`<u>text</u>`)
- Strikethrough (`~~text~~`)
- Inline code (`` `code` ``)
- Code block (` ``` `)

**Block formatting**

- H1, H2, H3 — prefixes current line with `# `, `## `, `### `
- Blockquote — prefixes with `> `
- Bullet list — prefixes with `- `
- Numbered list — prefixes with `1. `
- Horizontal rule — inserts `\n---\n`

**Media & references**

- Link — wraps selection in `[text](url)`
- Image — opens image gallery modal, inserts `![image](url)`
- **Note** — inserts `[^N]` at cursor + `[^N]: ` definition at end of document (auto-increments N)
- **[G]** — inserts a glossary reference `[gloss:term]`
- **[Cite]** — inserts a bibliography citation `[cite:key]`

**Admonition** — dropdown picker for all admonition types (see Admonitions section below)

**Right side**

- Sync scroll toggle (split mode only)
- View mode: editor / split / preview
- Meta sidebar toggle

### Image Insertion — 4 Methods

1. **Gallery modal** — click the Image toolbar button; browse uploaded images, click to insert
2. **Drag & drop** — drag image files directly onto the textarea; auto-uploads and inserts markdown
3. **Paste** — paste an image from clipboard; auto-uploads and inserts markdown
4. **Cover gallery** — in the Meta sidebar, click the cover image picker (separate from content images)

All uploads go through `POST /api/admin/upload` and return a permanent `/uploads/...` URL (a WebP copy and a thumbnail are generated alongside).

### Meta Sidebar (Post Settings)

Open with the `PanelRight` button (top-right of toolbar).

| Field            | Notes                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------- |
| **Slug**         | Auto-generated from title for new posts; editable. Changing after publish breaks existing links.  |
| **Published at** | Date picker. Controls the displayed date on the post.                                             |
| **Description**  | Short summary shown on the blog listing and in meta tags. Language-aware (EN/ID).                 |
| **Cover image**  | Aspect-ratio preview. Hover to change or remove. Not shown in the article body.                   |
| **Tags**         | Toggle existing tags or create new ones (Enter to create). Tags are `#name` style.                |
| **Outline**      | Live heading outline from the current content. Click any heading to jump the editor to that line. |

Word count and character count are shown at the bottom of the sidebar (or in the footer when sidebar is closed).

### Bilingual Support (EN / ID)

Posts have two independent content sets: English (`title`, `description`, `content`) and Indonesian (`titleId`, `descriptionId`, `contentId`).

- Switch between them with the **EN / ID tabs** in the header bar.
- The editor, preview, title, description field, glossary and bibliography all switch with the tab.
- There is no automatic translation: the Indonesian version is written by hand. A post with no Indonesian content is served in English on `/id/blog/:slug`.
- The slug, cover image, tags and publish date are shared between both languages.

### Save / Publish

| Button        | Action                                                                |
| ------------- | --------------------------------------------------------------------- |
| **Preview**   | Opens the whole post in a modal, rendered the way readers will see it |
| **Save**      | Saves the current state (no status change)                            |
| **Publish**   | Saves and sets status → `published`                                   |
| **Unpublish** | Saves and sets status → `draft`                                       |

Save indicator: shows "Saved just now", "Saved 12s ago" or "Saved 3m ago" in the header after saving. A failed save shows its error in red.

---

## Markdown Syntax Reference

The parser is custom-built (`shared/markdown/`) with no external dependencies. It supports standard markdown plus several custom extensions.

### Headings

```md
# H1

## H2

### H3

#### H4

##### H5

###### H6
```

- Each heading gets a slug-based `id` for anchor links.
- A `§` anchor link is appended to each heading in the rendered output. The editor preview shows it; the public site hides it.
- All headings (H1–H6) are included in the TOC and the editor outline. The public site numbers them (1, 1.1, 1.2, 2…).
- Start a post body at `##`: the page title is already the `<h1>`.

### Paragraphs

Plain text, separated by blank lines. Multiple lines in the same paragraph block are joined with `<br>`.

### Inline Formatting

| Syntax              | Output            |
| ------------------- | ----------------- |
| `**bold**`          | **bold**          |
| `*italic*`          | _italic_          |
| `***bold italic***` | **_bold italic_** |
| `~~strikethrough~~` | ~~strikethrough~~ |
| `` `inline code` `` | `inline code`     |
| `<u>underline</u>`  | underlined text   |
| `[text](url)`       | hyperlink         |
| `![alt](url)`       | inline image      |

External links (starting with `https://`) automatically get `target="_blank" rel="noopener noreferrer"`.

Italic uses asterisks only: `_text_` is not parsed. The public site sets emphasis upright in the ink colour instead of slanting it, so `*italic*` reads as a quiet highlight there.

### Images

**Inline image** (inside a paragraph):

```md
Some text with an ![alt text](https://example.com/image.png) inline.
```

**Figure** (solo image on its own paragraph — renders as `<figure>` with optional caption):

```md
![This becomes the caption](https://example.com/image.png)
```

If the alt text is non-empty, it renders as `<figcaption>`. Leave alt empty (`![]()`) for no caption.

Images in the article are click-to-zoom (opens a full-screen overlay).

### Links

```md
[Link text](https://example.com)
[Internal link](/blog)
```

### Code

**Inline code:**

```md
Use `npm install` to install dependencies.
```

**Fenced code block** (with optional language for syntax highlighting):

````md
```typescript
const x: number = 42
```
````

**Supported languages** for syntax highlighting:
`js` / `jsx`, `ts` / `tsx`, `python` / `py`, `go`, `rust` / `rs`, `sql`, `html` / `xml`, `css`, `json`, `bash` / `sh` / `shell`, `markdown`

Any other language identifier renders the block without highlighting (plain text, HTML-escaped).

Code blocks in the viewer get a **Copy** button injected automatically.

### Blockquote

```md
> This is a blockquote.
> It can span multiple lines.
```

Blockquotes can contain other block elements (headings, lists, etc.).

### Lists

**Unordered:**

```md
- Item one
- Item two
  - Nested item (2-space indent)
```

**Ordered:**

```md
1. First item
2. Second item
   1. Nested (2-space indent)
```

Bullet markers accepted: `-`, `*`, `+`.

### Horizontal Rule

```md
---
```

Also accepts `***` or `___`.

### Tables

```md
| Header A | Header B | Header C |
| -------- | :------: | -------: |
| left     |  center  |    right |
| data     |   data   |     data |
```

Alignment in the separator row: `:---` = left, `:---:` = center, `---:` = right, `---` = default.

### Glossary

The glossary is managed in a **dedicated tab** in the admin editor, one list per language. It can be edited in **Form** mode or as **Raw** text.

**Editor Modes:**

- **Form mode**: Add entries one by one with fields for key, term, and definition
- **Raw mode**: Edit all entries as text using the format below, then **Apply & switch to Form**
- Toggle between modes with the Form/Raw buttons in the tab

**Glossary Raw Format:**

The first line of an entry is `key :: Term`, the definition follows on the next lines, and a blank line separates entries. See `docs/sample-glossary.txt`.

```
dom :: Document Object Model
The structure of HTML documents.

vt-name :: view-transition-name
CSS property for named capture groups.
It can run over several lines.
```

**Key Rules:**

- Keep keys short, lowercase and unique: letters, digits, hyphens
- A definition cannot contain a blank line (that starts the next entry)
- Reference numbers follow the order of the entries in the tab

**Inline glossary references:**

```md
This article discusses [gloss:termKey] in detail.
```

- References use the **key** (not the term label)
- Renders as a superscript number
- Hover previews the definition in a popup; click pins it (dismiss with Esc, its close button or a click outside)
- Keys not found render as `?`

**Glossary Section:**

- Renders as a collapsible block below the article (above the bibliography) and is linked from the contents list
- Click a term to jump to its first occurrence in the text

### Footnotes / Sidenotes

```md
This text has a footnote.[^1]

[^1]: This is the footnote content.
```

- The `[^id]` reference renders as a superscript number in the text.
- The `[^id]: text` definition renders as a **margin note** from 1240px wide (left of the text, level with its reference) and as a **footnote** where it was written on narrower screens. Put definitions at the end of the post.
- With margin notes showing, clicking the reference lights up its note instead of scrolling.
- IDs can be numbers or strings: `[^note]`, `[^1]`, `[^my-note]`.
- The toolbar **Note** button auto-increments numeric IDs.

### Admonitions

Custom block elements for callouts:

```md
:::note
This is a note.
:::
```

**Available types:**

| Type          | Icon | Label    | Purpose                                                                 |
| ------------- | ---- | -------- | ----------------------------------------------------------------------- |
| `:::note`     | ℹ    | Note     | General supplementary information the reader should be aware of         |
| `:::warning`  | ⚠    | Warning  | Potential pitfalls, common mistakes, or things that could go wrong      |
| `:::danger`   | 🔴   | Danger   | Critical risks or important things to avoid                             |
| `:::tip`      | 💡   | Tip      | Helpful advice, best practices, or useful shortcuts                     |
| `:::info`     | 📘   | Info     | Background context or explanatory detail that supports the main content |
| `:::tldr`     | ⚡   | TL;DR    | Brief summary of a longer section for readers who want the quick take   |
| `:::update`   | 📅   | Update   | Post-publication corrections, additions, or status changes              |
| `:::ai`       | 🤖   | Ask AI   | AI prompts the reader can copy and use in their preferred AI tool       |
| `:::see-also` | →    | See Also | Links to related posts, resources, or further reading                   |

Admonitions can contain any block-level markdown (paragraphs, lists, code blocks, etc.). An unknown type renders as a note.

The icons show in the editor preview. The public site drops them and marks the type with the label and a coloured left rule instead.

**Special: `:::ai`**

The `:::ai` block gets a **Copy prompt** button injected. The content is treated as an AI prompt that the reader can copy to paste into their preferred AI tool.

```md
:::ai
Explain the concept of dependency injection in simple terms.
:::
```

### Bibliography

The bibliography is managed in a **dedicated tab** in the admin editor, one list per language. It can be edited in **Form** mode or as **Raw** text.

**Editor Modes:**

- **Form mode**: Add entries one by one with fields for key, source type, and citation text
- **Raw mode**: Edit all entries as text using the format below, then **Apply & switch to Form**
- Toggle between modes with the Form/Raw buttons in the tab

**Bibliography Raw Format:**

The first line of an entry is `key [sourceType]`, the citation follows on the next lines, and a blank line separates entries. See `docs/sample-bibliography.txt`.

```
mdn-vt [web]
MDN Web Docs. "View Transition API". https://developer.mozilla.org/...

crafting-interpreters [book]
Robert Nystrom. "Crafting Interpreters". Genever Benning, 2021.
```

**Source Types:**

| Type      | Icon | Description       |
| --------- | ---- | ----------------- |
| `web`     | 🌐   | Websites, blogs   |
| `docs`    | 📖   | Documentation     |
| `journal` | 📄   | Academic journals |
| `article` | 📰   | News articles     |
| `book`    | 📚   | Books             |
| `video`   | 🎬   | Videos, talks     |
| `podcast` | 🎙   | Podcasts          |
| `repo`    | 💾   | Code repositories |
| `other`   | ·    | Everything else   |

**Key Rules:**

- Keep keys short, lowercase and unique: letters, digits, hyphens
- A first line without `[sourceType]` is read as type `web`
- A citation cannot contain a blank line (that starts the next entry)

**Inline citations:**

```md
This claim is supported by research.[cite:mdn-docs]
```

- References use the **key** (defined in the editor)
- Renders as a superscript number
- Hover previews the citation in a popup; click pins it
- Keys not found render as `?`

**Bibliography Section:**

- Renders as a collapsible block below the article (below the glossary) and is linked from the contents list
- Quoted titles (`"Title"`) are emphasised and URLs become links showing the host name (`shared/markdown/citation.ts`)
- Click an entry to jump to where it's first cited in the text

---

## Blog Post View

`web/src/folio/components/PostView.astro`, served at `/blog/:slug` (English) and `/id/blog/:slug` (Indonesian).

### Page Structure

```
[ one 672px column ]
  Header (site nav, language and theme toggles)
  ← Back to blog
  H1 title (28px, medium weight)
  Description
  Date · X min read · tags · copy link
  Contents (collapsible; below 1240px only)
  Article (.prose — the rendered markdown)
  Glossary (collapsible)
  Bibliography (collapsible)
  Next post
  Footer
```

### Wide Screens (≥ 1240px)

The column stays 672px and centred; two side columns hang off it.

| Column                  | Behavior                                                                                                   |
| ----------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Margin notes** (left) | Each footnote sits level with its reference. Below 1240px they stay in the text as footnotes.              |
| **Article**             | The rendered HTML.                                                                                         |
| **Contents** (right)    | Sticky, numbered, with scrollspy — the section in view is marked. Replaces the collapsible contents block. |

`scripts/post.ts` tests the same 1240px width as the `wide:` variant in `styles/folio.css`; change both together.

### Reading Time

`max(1, round(wordCount / 200))` minutes (`web/src/lib/utils.ts`), counted from the rendered HTML with the bibliography left out. Displayed as "X min read".

### Reference Popups

Glossary and citation numbers show their entry in a small popup: hover previews it, click pins it, and Esc, the close button or a click outside dismisses it.

### Image Zoom

Clicking an image in the article opens it in a full-screen overlay. Click anywhere or press Esc to close.

### Code Block Copy Button

Injected after render into every code block; shows a "copied" state for a moment after a click. `:::ai` blocks get their own **Copy prompt** button from the renderer.

### Copy Link

The last item of the meta line copies the post URL to the clipboard.

### Margin Note Highlight

With margin notes showing, clicking a footnote reference (`[^id]`) does not jump to the definition: its note lights up briefly (`data-lit`, the `lit` animation in `styles/folio.css`).

---

## Post Fields

| Field            | Type                        | Notes                                                                                         |
| ---------------- | --------------------------- | --------------------------------------------------------------------------------------------- |
| `title`          | string                      | EN title. Shown in H1, page title, blog listing.                                              |
| `titleId`        | string \| null              | ID (Indonesian) title. `null` = no translation, the EN field is used.                         |
| `slug`           | string                      | URL-safe identifier. Used in route `/blog/:slug`. Auto-generated from EN title for new posts. |
| `description`    | string                      | EN excerpt. Shown below the title, on the blog listing and in meta tags.                      |
| `descriptionId`  | string \| null              | ID description.                                                                               |
| `content`        | string                      | EN markdown body.                                                                             |
| `contentId`      | string \| null              | ID markdown body.                                                                             |
| `glossaryEn`     | GlossaryEntry[]             | `{ key, term, definition }`. Stored as JSON text.                                             |
| `glossaryId`     | GlossaryEntry[] \| null     | ID glossary.                                                                                  |
| `bibliographyEn` | BibliographyEntry[]         | `{ key, sourceType, text }`. Stored as JSON text.                                             |
| `bibliographyId` | BibliographyEntry[] \| null | ID bibliography.                                                                              |
| `status`         | `draft` \| `published`      | Only `published` posts appear on the public site.                                             |
| `publishedAt`    | ISO date string             | Displayed date. Falls back to the creation date.                                              |
| `coverImageUrl`  | string \| null              | Stored with the post. The current site does not display it.                                   |
| `tags`           | Tag[]                       | Array of `{ id, name, slug }`. Shown as plain text in the meta line of the post.              |

---

## Design

The public site is one text column, dark-first, set in Plus Jakarta Sans. Styling is Tailwind v4 utilities in the markup:

- **Tokens and variants**: `web/src/folio/styles/folio.css` — colours (`ink`, `body`, `quiet`, `leader`, `ring`, `raised`, `pen`…), the `light:`, `narrow:`, `wide:`, `fine:` and `coarse:` variants, and the site's own small reset. Tailwind's preflight is deliberately not imported.
- **Post body**: `web/src/folio/styles/post.css` — the rendered markdown carries the renderer's own class names (`.code-block`, `.admonition`, `.footnote-def`, `.gloss-ref`…), so it is styled from outside with `@apply` under `.prose`.
- **Editor preview**: `admin/src/app.css` styles the same renderer output for the admin (`.preview-content`, `.post-preview-content`). A new renderer class needs a rule in both files.
