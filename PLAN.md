# Custom Blog CMS — Implementation Plan

The blog on this portfolio originally ran on Contentful. The goal is to replace it entirely with a self-owned CMS — no third-party content platform, no vendor lock-in, full control over data and rendering.

The driving intentions behind this rewrite:

**Reading experience first.** Blog posts should feel like long-form technical writing, not a generic blog. That means a 3-column layout with a sticky TOC on the right, sidenotes in the left margin (collapsing to footnotes on mobile), and rich admonitions that add context without breaking flow.

**AI admonition.** Technical writing often has sections that are dense or assume prior knowledge. A dedicated `:::ai` admonition lets the author embed a pre-written prompt — a ready-to-copy question or explanation request — so readers can paste it directly into an AI chat for further clarification. No guessing what to ask.

**Markdown as the single source of truth.** Every post is written in plain markdown. No proprietary rich-text format, no CMS-specific content model. Files stay portable, readable, and version-controllable.

**No heavy dependencies for the core.** The markdown parser, syntax highlighter, and admin editor are all written from scratch. This is intentional: it keeps the bundle lean, removes runtime surprises from upstream library changes, and makes the rendering pipeline fully transparent and customisable.

**A writing environment that fits the workflow.** The admin editor is a split-pane — raw markdown on the left, live preview on the right — with a toggle to go full-editor or full-preview. Images can be inserted by toolbar, drag-and-drop, paste, or picking from a gallery of previously uploaded files. Code snippets are first-class citizens with per-language syntax highlighting.

**Self-hosted.** The entire stack (frontend, admin, API, database, images) runs on a VPS. No external services beyond the server itself.

---

## Repository Structure

```
portofolio/
├── src/              # Portfolio frontend (existing Vite/React)
├── admin/            # NEW: CMS admin app (separate Vite/React)
├── server/           # NEW: API backend (Hono + SQLite + Drizzle)
└── shared/           # NEW: Shared code (markdown parser, types)
    └── markdown/
```

**VPS deployment (Nginx):**
- `domain.com` → `src/dist/` (static)
- `admin.domain.com` → `admin/dist/` (static, private)
- `domain.com/api/*` → `server/` on port 3001

---

## Stack

| Concern | Choice |
|---|---|
| Backend | Hono + TypeScript |
| Database | SQLite + Drizzle ORM |
| Auth | JWT (credentials in env vars) |
| Images | Local FS `server/uploads/` |
| Markdown | Custom parser (scratch) |
| Syntax highlighting | Custom tokenizer (scratch) |
| Admin editor | Custom split-pane textarea (scratch) |

**Allowed third-party deps:** `hono`, `better-sqlite3`, `drizzle-orm`, `drizzle-kit`, `jsonwebtoken`, `zod`, `lucide-react`, `tailwindcss` only.

---

## Implementation Steps

### [ ] Step 0 — PLAN.md (this file)

### [ ] Step 1 — `shared/markdown/`

Core markdown engine. Isomorphic TS — runs identically in Node.js (server) and browser (admin live preview).

```
shared/markdown/
├── types.ts       # BlockToken, TocItem, Sidenote, ParseResult interfaces
├── block.ts       # Block-level tokenizer (line-by-line scanner)
├── inline.ts      # Inline element parser (regex sequential)
├── highlight.ts   # Syntax highlighter (regex tokenizer per language)
├── renderer.ts    # BlockToken[] → HTML string
└── parser.ts      # Entry: parse(md) → { html, toc, sidenotes }
```

**Supported markdown syntax:**

Block: `# H1-H6`, ` ```lang ``` ` fenced code, `> blockquote`, `- / 1.` lists (nested), `---` HR, `| table |`, `:::type ... :::` admonitions, `[^n]: text` footnotes/sidenotes

Inline: `**bold**`, `*italic*`, `` `code` ``, `[link](url)`, `![img](url)`, `[^n]` refs, `~~strike~~`

**Admonitions (9 types):**

There are two categories of admonition, which share the same markdown syntax and block parser but differ in how the renderer outputs them.

**Basic admonitions** — styled callout blocks. Rendered as a bordered `<div>` with a coloured left accent, an icon, a label, and the inner content rendered as normal markdown (paragraphs, lists, inline markup, etc.).

| Key | Icon | Color | Use |
|---|---|---|---|
| `note` | ℹ | Blue | General informational note |
| `warning` | ⚠ | Amber | Caution / heads-up |
| `danger` | 🔴 | Red | Critical — do not do this |
| `tip` | 💡 | Green | Helpful suggestion |
| `info` | 📘 | Indigo | Contextual aside |
| `tldr` | ⚡ | Yellow (#FFE600) | Summary, placed at top of post |
| `update` | 📅 | Gray | Post revision notice |
| `definition` | 📖 | Teal | Term definition / glossary |

**AI admonition** — a special-purpose block designed for reader-facing AI prompts. When a section of the article is dense or assumes prior knowledge, the author can embed a pre-written question here. The reader copies it and pastes directly into any AI chat for further explanation.

| Key | Icon | Color | Extra behaviour |
|---|---|---|---|
| `ai` | 🤖 | Purple | Copy button — copies prompt text only to clipboard, shows "Copied!" for 2s |

The inner content of `:::ai` is rendered in monospace (same style as a code block) to visually signal it is a prompt to paste, not prose. The copy button emits the raw text (not HTML).

**Syntax (same for all 9):**
```
:::note
This is a basic admonition. Supports **inline** markdown.
:::

:::ai
Jelaskan konsep virtual memory seolah saya junior developer.
Gunakan analogi perpustakaan: buku adalah data, rak adalah RAM.
:::
```

**Syntax highlighter languages:** `js/ts/jsx/tsx`, `python`, `html/xml`, `css`, `bash/sh`, `json`, `go`, `rust`, `sql`, `markdown`

**Output:**
```typescript
parse(md: string): {
  html: string        // rendered HTML
  toc: TocItem[]      // [{ id, text, level }]
  sidenotes: Sidenote[] // [{ id, html }]
}
```

---

### [ ] Step 2 — `server/`

```
server/
├── src/
│   ├── index.ts              # Hono app, CORS, static /uploads
│   ├── db/
│   │   ├── schema.ts         # Drizzle schema
│   │   └── index.ts          # DB singleton
│   ├── middleware/
│   │   └── auth.ts           # JWT verify
│   └── routes/
│       ├── auth.ts           # POST /api/auth/login
│       ├── posts.ts          # Public: GET /api/posts, /api/posts/:slug
│       └── admin.ts          # Protected: CRUD + images + tags
├── uploads/                  # Image files (gitignored)
├── drizzle.config.ts
├── package.json
└── tsconfig.json
```

**Database schema:**
```
posts:     id, title, slug, description, content(markdown),
           status('draft'|'published'), published_at, created_at,
           updated_at, cover_image_url

tags:      id, name, slug

post_tags: post_id FK, tag_id FK  (CASCADE delete)

images:    id, filename, original_name, mime_type, size_bytes, url, created_at
```

**API routes:**
```
Public:
  GET  /api/posts              list published posts
  GET  /api/posts/:slug        { post, html, toc, sidenotes }

Auth:
  POST /api/auth/login         → { token }

Protected (Bearer JWT):
  GET  /api/admin/posts        all posts (draft + published)
  POST /api/admin/posts        create
  PUT  /api/admin/posts/:id    update
  DEL  /api/admin/posts/:id    delete
  GET  /api/admin/images       all images (for gallery picker)
  POST /api/admin/upload       upload → { url, id, filename }
  DEL  /api/admin/images/:id   delete image
  GET  /api/admin/tags         list
  POST /api/admin/tags         create
  DEL  /api/admin/tags/:id     delete
```

---

### [ ] Step 3 — `src/` (portfolio frontend)

**Modify:**
- `src/pages/Blog.tsx` — fetch from `GET /api/posts`
- `src/pages/BlogPost.tsx` — new 3-column layout
- `src/components/ui/post-card.tsx` — update BlogPost type
- `src/lib/api.ts` — NEW: typed fetch helpers
- `src/globals.css` — add admonition styles, syntax highlight token colors, 3-col layout

**Create:**
- `src/components/blog/MarkdownRenderer.tsx` — render HTML + wire sidenote alignment
- `src/components/blog/TOC.tsx` — sticky right TOC, active heading scrollspy
- `src/components/blog/Sidenotes.tsx` — margin notes (desktop) / footnotes (mobile)

**Remove:**
- `contentful/` directory
- `contentful`, `@contentful/rich-text-react-renderer`, `@contentful/rich-text-types` packages

**Blog post layout:**
```
┌──────────┬────────────────────┬──────────┐
│Sidenotes │  Article content   │   TOC    │
│  w-52    │  max-w-2xl flex-1  │   w-48   │
│ sticky   │                    │  sticky  │
└──────────┴────────────────────┴──────────┘

Mobile: TOC collapses at top, sidenotes → footnotes at bottom
```

Sidenote alignment: each `[^n]` ref gets `data-sidenote-id`. On mount, JS reads each ref's `offsetTop` and positions the sidenote accordingly in the left column.

---

### [ ] Step 4 — `admin/`

Separate Vite/React app. Proxies `/api` to `:3001` in dev.

```
admin/
├── src/
│   ├── App.tsx               # Routes: /login, /posts, /posts/new, /posts/:id
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── PostList.tsx
│   │   └── PostEditor.tsx
│   ├── components/
│   │   ├── Editor.tsx        # Custom split-pane textarea
│   │   ├── Toolbar.tsx       # Formatting buttons
│   │   ├── Preview.tsx       # Live preview (uses shared parser)
│   │   └── ImageGallery.tsx  # Modal image picker grid
│   └── lib/
│       └── api.ts            # API client with auth header
├── vite.config.ts
└── package.json
```

**Editor modes:** Split (50/50) | Editor only | Preview only

**Toolbar:** Bold, Italic, Strike, `Code`, H1–H3, Blockquote, UL, OL, HR, Link, Image, Admonition picker (9 types), Footnote

**Keyboard shortcuts:** `Ctrl+B` bold · `Ctrl+I` italic · `Ctrl+K` link · `Tab` indent · `Ctrl+Shift+P` toggle preview

**Image insertion (4 methods):**
1. Toolbar button → file picker → upload → insert `![name](url)` at cursor
2. Drag & drop onto editor → upload → insert
3. Paste (Ctrl+V with image) → upload → insert
4. Gallery picker → modal grid of all uploaded images → click to insert

**Live preview:** debounced 150ms, same `parse()` from `shared/markdown/parser.ts`

---

## Verification Checklist

- [ ] `GET /api/posts` returns published posts
- [ ] `GET /api/posts/:slug` returns `{ html, toc, sidenotes }`
- [ ] Markdown parser: headings, code blocks, all 9 admonitions, sidenotes, tables, TOC
- [ ] Portfolio blog list loads from own API
- [ ] 3-column layout: TOC scrollspy, sidenotes align to references
- [ ] Mobile: TOC collapses, sidenotes become footnotes
- [ ] AI admonition copy button copies prompt text
- [ ] Admin: login, create/edit/delete post, publish toggle
- [ ] All 4 image insert methods work in editor
- [ ] Gallery picker shows uploaded images
