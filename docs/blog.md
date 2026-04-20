# Blog System Rules

Reference for writing posts and understanding how the blog editor and viewer work.
Applies to both the author (writing reference) and Claude (AI context for this project).

---

## Architecture Overview

```
Admin editor (admin/)  →  Hono API (server/)  →  SQLite  →  Portfolio frontend (src/)
                                  ↑
                         shared/markdown/  (isomorphic parser)
```

- **Editor**: `admin/src/pages/PostEditor.tsx` — split-pane markdown editor
- **Parser**: `shared/markdown/parser.ts` — `parse(md) → { html, toc, sidenotes, bibliography }`
- **Viewer**: `src/pages/BlogPost.tsx` + `src/components/blog/MarkdownRenderer.tsx`
- **Layout**: 3-column (sidenotes | article | TOC) on desktop, collapses to single column on mobile

---

## Editor

### Layout

The editor is a full-screen split-pane app at `http://localhost:5174`.

| Zone             | Description                                                            |
| ---------------- | ---------------------------------------------------------------------- |
| **Header bar**   | Title input, language tabs (EN/ID), status badge, Save/Publish buttons |
| **Toolbar**      | Formatting buttons + view mode toggle                                  |
| **Editor pane**  | Raw markdown textarea                                                  |
| **Preview pane** | Live rendered HTML (uses the same parser as production)                |
| **Meta sidebar** | Slug, date, description, cover image, tags, heading outline            |
| **Footer**       | Word count + character count                                           |

### View Modes

Three modes toggled from the toolbar (right side):

| Mode            | Icon        | Keyboard       |
| --------------- | ----------- | -------------- |
| Editor only     | `PanelLeft` | —              |
| Split (default) | `Columns2`  | —              |
| Preview only    | `Eye`       | `Ctrl+Shift+P` |

**Sync scroll**: In split mode, the chain-link button links editor and preview scroll positions proportionally.

### Keyboard Shortcuts

| Shortcut       | Action                                |
| -------------- | ------------------------------------- |
| `Ctrl+S`       | Save (draft)                          |
| `Ctrl+B`       | Bold — inserts `****`, cursor between |
| `Ctrl+I`       | Italic — inserts `**`, cursor between |
| `Ctrl+K`       | Link — inserts `[](url)`              |
| `Ctrl+Shift+P` | Toggle preview / split mode           |
| `Tab`          | Insert 2 spaces                       |

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
- **DL** — inserts a definition list template
- **Fig** — inserts a figure template `![Caption text](image-url)`

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

All uploads go through `POST /api/images` and return a permanent URL.

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
- The editor, preview, description field, and meta title all switch with the tab.
- **Make ID →** button (when on EN tab): calls the translation API to generate an Indonesian version from the current EN content. Overwrites existing ID content (prompts before overwriting).
- **Make EN →** button (when on ID tab): reverse — generates EN from ID.
- A **⚠** warning appears on the button when source content has changed since the last translation ("stale" indicator).
- The slug and cover image are shared between both languages.

### Save / Publish

| Button        | Action                                          |
| ------------- | ----------------------------------------------- |
| **Save**      | Saves current state as draft (no status change) |
| **Publish**   | Saves and sets status → `published`             |
| **Unpublish** | Saves and sets status → `draft`                 |

Save indicator: shows "Saved X ago" in the header after saving. Error shows "Save failed" in red.

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
- A `§` anchor link is appended to each heading in the rendered output.
- All headings (H1–H6) are included in the TOC and the editor outline.

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

### Definition List

```md
Term
: Definition text here

Another Term
: First definition
: Second definition
```

The term must be a plain line immediately followed by `: definition` on the next line.

### Footnotes / Sidenotes

```md
This text has a footnote.[^1]

[^1]: This is the footnote content.
```

- The `[^id]` reference renders as a superscript number in the text.
- The `[^id]: text` definition renders as a **sidenote** on desktop (right margin) and as a **footnote** at the bottom on mobile.
- On desktop, clicking the reference highlights the sidenote instead of scrolling.
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

| Type            | Icon | Label      | Purpose                                                                 |
| --------------- | ---- | ---------- | ----------------------------------------------------------------------- |
| `:::note`       | ℹ   | Note       | General supplementary information the reader should be aware of         |
| `:::warning`    | ⚠   | Warning    | Potential pitfalls, common mistakes, or things that could go wrong      |
| `:::danger`     | 🔴   | Danger     | Critical risks or important things to avoid                             |
| `:::tip`        | 💡   | Tip        | Helpful advice, best practices, or useful shortcuts                     |
| `:::info`       | 📘   | Info       | Background context or explanatory detail that supports the main content |
| `:::tldr`       | ⚡   | TL;DR      | Brief summary of a longer section for readers who want the quick take   |
| `:::update`     | 📅   | Update     | Post-publication corrections, additions, or status changes              |
| `:::definition` | 📖   | Definition | Defines a specific term or concept not covered in its own section       |
| `:::ai`         | 🤖   | Ask AI     | AI prompts the reader can copy and use in their preferred AI tool       |
| `:::see-also`   | →    | See Also   | Links to related posts, resources, or further reading                   |

Admonitions can contain any block-level markdown (paragraphs, lists, code blocks, etc.).

**Special: `:::ai`**

The `:::ai` block gets a **Copy prompt** button injected. The content is treated as an AI prompt that the reader can copy to paste into their preferred AI tool.

```md
:::ai
Explain the concept of dependency injection in simple terms.
:::
```

### Bibliography

A bibliography block declares references, then you cite them inline:

**Declaration** (at any point in the document — typically at the end):

````md
```bibliography
[key1:web] Author Name "Title of Article" https://example.com
[key2:book] Author Name "Book Title" Publisher, Year
[key3:journal] Author Name "Paper Title" Journal Vol(Issue), Year
```
````

**Inline citation:**

```md
This claim is supported by research.[cite:key1]
```

Renders as a superscript number `[1]` linking to the bibliography section.

**Source types** (after the colon in the key):

| Type      | Icon |
| --------- | ---- |
| `web`     | 🌐   |
| `docs`    | 📖   |
| `journal` | 📄   |
| `article` | 📰   |
| `book`    | 📚   |
| `video`   | 🎬   |
| `podcast` | 🎙   |
| `repo`    | 💾   |
| `other`   | ·    |

The bibliography section auto-groups entries by type and assigns sequential numbers based on declaration order in the bibliography block — the first entry is `[1]`, the second is `[2]`, etc. Quoted titles (`"Title"`) are rendered bold.

---

## Blog Post View

### Page Structure

```
ScrollProgress bar (fixed, yellow, top of viewport)

[ max-w-3xl centered zone ]
  Header (site nav)
  ← Back to blog
  Tags (brutalist badge style)
  H1 title (5xl–6xl, uppercase, black, font-black)
  Description (xl, muted)
  Date · X min read
  ─────────────────────────────────

[ max-w-[72rem] wide zone ]
  MarkdownRenderer (3-column layout)
    Sidenotes column (desktop, left)
    Article content (center, flex-1)
    TOC column (desktop, right, sticky)

[ max-w-3xl centered zone ]
  ← All posts
  Footer
```

### 3-Column Layout

The article area is wider than the header/footer (`max-w-[72rem]` vs `max-w-3xl`) to accommodate sidenotes and TOC alongside the content.

| Column               | Behavior                                                                                                                                 |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Sidenotes** (left) | Desktop only (`lg:`). Absolutely positioned next to their reference in the text. Falls back to footnotes (appended at bottom) on mobile. |
| **Article**          | Center column, `flex-1`. Contains the rendered HTML.                                                                                     |
| **TOC**              | Desktop only (`lg:`). Sticky, scrollspy — highlights the current section.                                                                |

### Reading Time

Calculated as `ceil(wordCount / 200)`, minimum 1 minute. Displayed as "X min read".

### Scroll Progress Bar

Fixed yellow (`#FFE600`) bar at the top of the viewport showing reading progress.

### Back to Top

Appears after scrolling past a threshold.

### Image Zoom

Clicking any `<figure> img` or `<p> img` in the article opens a full-screen overlay:

- Black/90% backdrop
- Image constrained to 90vw × 90vh
- `[close]` button top-right
- Click backdrop to close

### Code Block Copy Button

Injected dynamically after render. Brutalist style: 2px black border, white bg, yellow hover. Shows "copied!" for 2 seconds after click.

### Sidenote Highlight

On desktop (≥ `lg`), clicking a footnote reference (`[^id]`) instead of jumping to the definition:

- Scrolls the sidenote into view
- Plays a highlight animation (`sidenote-highlighted` CSS class)

---

## Post Fields

| Field           | Type                   | Notes                                                                                         |
| --------------- | ---------------------- | --------------------------------------------------------------------------------------------- |
| `title`         | string                 | EN title. Shown in H1, page title, blog listing.                                              |
| `titleId`       | string                 | ID (Indonesian) title.                                                                        |
| `slug`          | string                 | URL-safe identifier. Used in route `/blog/:slug`. Auto-generated from EN title for new posts. |
| `description`   | string                 | EN excerpt. Shown below title and on blog listing card.                                       |
| `descriptionId` | string                 | ID description.                                                                               |
| `content`       | string                 | EN markdown body.                                                                             |
| `contentId`     | string                 | ID markdown body.                                                                             |
| `status`        | `draft` \| `published` | Only `published` posts appear on the public site.                                             |
| `publishedAt`   | ISO date string        | Displayed date. Defaults to creation date.                                                    |
| `coverImageUrl` | string \| null         | Used on blog listing cards. Not shown in the article body.                                    |
| `tags`          | Tag[]                  | Array of `{ id, name, slug }`. Shown as brutalist badges on the post page.                    |

---

## Design Tokens (Brutalist)

The blog view follows the site's brutalist design system:

- **Borders**: `border-2 border-black` / `dark:border-white`
- **Shadow**: `shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]` / white variant for dark mode
- **Accent color**: `#FFE600` (yellow) — used for scroll progress bar, copy button hover, Back to Top
- **Typography**: `font-black`, `tracking-tighter`, `uppercase` for titles
- **Max content width**: `max-w-3xl` (header/footer zones), `max-w-[72rem]` (article zone)
- **Mono labels**: `font-mono text-[11px] tracking-widest uppercase` for metadata
