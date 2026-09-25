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

Production runs from images built by GitHub Actions (GHCR) behind a Cloudflare Tunnel —
no host ports are published. See [docs/deployment.md](docs/deployment.md) for the full VPS runbook.

| Service     | Container Port | Public hostname                    |
| ----------- | -------------- | ---------------------------------- |
| web         | 3000           | www.brendatama.dev, brendatama.dev |
| server      | 3001           | api.brendatama.dev                 |
| admin       | 3000           | admin.brendatama.dev               |
| cloudflared | —              | outbound tunnel to Cloudflare      |

Build the images locally instead of pulling:

```bash
docker compose -f docker-compose.yml -f docker-compose.build.yml up --build
```
