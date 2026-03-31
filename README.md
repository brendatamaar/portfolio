# Brendatama Akbar Ramadan — Portfolio

Personal portfolio and blog built from scratch. No CMS dependencies — content is managed through a self-hosted admin UI backed by a custom API.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite 6, TypeScript, Tailwind CSS v4 |
| Animation | Framer Motion (`motion/react`) |
| Routing | React Router v7 |
| Theming | next-themes |
| API | Hono, SQLite, Drizzle ORM |
| Markdown | Custom isomorphic parser (no deps) |

## Structure

```
portofolio/       — portfolio frontend          (port 5173)
admin/            — blog admin UI               (port 5174)
server/           — Hono REST API + SQLite DB   (port 3001)
shared/markdown/  — shared markdown parser
```

## Getting Started

**1. Set up the server (first time only)**
```bash
cd server
npm install
npm run setup   # creates admin user + DB
```

**2. Run everything**
```bash
npm run dev:all
```

Or run individually:
```bash
npm run dev              # portfolio
npm run dev --prefix server   # API
npm run dev --prefix admin    # admin UI
```

## Features

- Brutalist design — heavy borders, offset shadows, yellow accent
- Light / dark mode
- Blog with markdown, syntax highlighting, sidenotes, and TOC
- Self-hosted CMS admin with split-pane editor
- Reading time, scroll progress, tag filtering, copy code buttons
