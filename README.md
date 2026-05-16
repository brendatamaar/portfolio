# Brendatama Akbar Ramadan — Portfolio

Personal portfolio and blog built from scratch. No CMS dependencies — content is managed through a self-hosted admin UI backed by a custom API.

## Stack

| Layer     | Tech                                    |
| --------- | --------------------------------------- |
| Portfolio | Astro 5, TypeScript, Tailwind CSS v4    |
| Animation | Motion (view transitions)               |
| Admin     | SvelteKit 2, Svelte 5, Tailwind CSS v4  |
| API       | Hono, Bun, SQLite (libSQL), Drizzle ORM |
| Markdown  | Custom isomorphic parser (no deps)      |
| Infra     | Docker Compose, pnpm workspaces         |

## Structure

```
web/              — Astro portfolio + blog      (port 4321)
admin/            — SvelteKit blog admin UI     (port 4322)
server/           — Hono REST API + SQLite DB   (port 3001)
shared/markdown/  — shared markdown parser
shared/types/     — shared TypeScript types
```

## Getting Started

**1. Install dependencies**

```bash
pnpm install
```

**2. Set up the server (first time only)**

```bash
cd server
bun run setup   # creates admin user + DB
```

**3. Run everything**

```bash
pnpm dev
```

Or run individually:

```bash
pnpm -C web dev        # portfolio
pnpm -C server dev     # API
pnpm -C admin dev      # admin UI
```

## Docker

```bash
cp .env.example .env   # edit with your values
docker compose up -d
```

| Service   | Container Port | Host Port |
| --------- | -------------- | --------- |
| server    | 3001           | 3003      |
| portfolio | 3000           | 3001      |
| admin     | 3000           | 3002      |
