# Migration Plan: React → Astro (vanilla) + SvelteKit on Bun

## Locked Decisions

| Concern             | Choice                                                                                                      |
| ------------------- | ----------------------------------------------------------------------------------------------------------- |
| Portfolio framework | **Astro 5 — zero framework runtime, vanilla JS only for interactivity**                                     |
| Admin framework     | SvelteKit 2                                                                                                 |
| Runtime             | Bun (using **official Node adapters** — `@astrojs/node` + `@sveltejs/adapter-node` — run via `bun run`)     |
| Server              | Hono stays separate, swap to `Bun.serve` + `bun:sqlite`                                                     |
| Markdown parser     | Keep `shared/markdown/parser.ts` (TypeScript, framework-agnostic)                                           |
| Blog content        | DB-backed (no change)                                                                                       |
| Auth                | Upgrade JWT-in-localStorage → httpOnly cookie sessions                                                      |
| Translations        | Manual, per-post via `language` + `translation_of_id` columns + Astro i18n routing; **drop LibreTranslate** |
| Images              | Process-on-upload via `sharp` → webp + thumbnail; serve via Hono                                            |
| Animations          | Astro `<ViewTransitions />` + CSS / Motion One (drop `motion/react`)                                        |
| Theme toggle        | ~30 lines vanilla JS (drop `next-themes`)                                                                   |
| Testing             | `bun test` for `shared/markdown/`; Vitest + Playwright for apps                                             |
| CI                  | Add pre-deploy GitHub Actions job (typecheck + build + test)                                                |

---

## Target Architecture

```
web/                             Astro 5 + Tailwind v4 — zero JS framework (Bun runtime, port 3000)
  src/pages/                       file-based routes (replaces src/routes/)
  src/components/                  .astro components (server-rendered)
  src/scripts/                     vanilla TS modules — theme, scrollspy, sidenotes
  src/layouts/                     shared layouts
  src/lib/api.ts                   typed fetch helpers (port from current)

admin/                           SvelteKit + Tailwind v4 (Bun runtime, port 3000 internal)
  src/routes/                      file-based routes
  src/lib/                         shared utils, API client
  src/hooks.server.ts              cookie session auth

server/                          Hono + Drizzle + bun:sqlite + sharp (Bun runtime, port 3001)
  src/index.ts                     Bun.serve entry
  src/routes/                      Hono route handlers
  src/db/                          Drizzle schema + migrations
  src/lib/auth.ts                  cookie sessions + scrypt

shared/markdown/                 unchanged (plain TS, isomorphic)
shared/types/                    shared API contract types
```

### Interactivity strategy for the portfolio

No framework runtime ships to the browser. Each interactive piece is a vanilla TS module imported via Astro's `<script>` directive (Astro bundles, minifies, and tree-shakes these).

| Feature                                           | Implementation                                                                  | Approx LOC |
| ------------------------------------------------- | ------------------------------------------------------------------------------- | ---------- |
| Theme toggle                                      | `localStorage` + `matchMedia('prefers-color-scheme: dark')` + class on `<html>` | ~30        |
| TOC scrollspy                                     | `IntersectionObserver` on `<h2>/<h3>` → toggles `aria-current` on links         | ~40        |
| Sidenotes (desktop margin notes / mobile popover) | `matchMedia` for layout switch + click handler for mobile expand                | ~50        |
| Mobile nav                                        | `<details>` + CSS, or `aria-expanded` toggle                                    | ~20        |
| Page transitions                                  | Astro `<ViewTransitions />` (built-in, no JS to write)                          | 0          |
| Micro-animations                                  | CSS `@keyframes` / Motion One for anything CSS can't express                    | minimal    |

Total client JS on a typical blog post: **well under 5 KB minified**.

---

## Migration Phases

Each phase ships independently on its own branch. Trunk stays green throughout.

### Phase 0 — Prep (ships before any code changes)

**Goal:** Safety net before touching anything.

- [ ] Branch: `chore/migration-prep`
- [ ] Add `.gitignore` entries for: `preview.log`, `preview.err.log`, `start.log`, `start.err.log`, `vite-report.html`, `localhost_*.report.html`, `REPORT.md` (or commit it intentionally)
- [ ] Add GitHub Actions CI workflow `.github/workflows/ci.yml`: typecheck + lint + build on every PR. Use `oven-sh/setup-bun@v2`.
- [ ] Backup script: `server/scripts/backup-db.ts` — copies `app.db` to timestamped file. Run in deploy.yml _before_ `docker compose down`.
- [ ] Smoke test checklist documented (`docs/smoke-test.md`): the 10 manual checks to run after deploy. Login → post list → edit post → preview → publish → blog list → blog post → theme toggle → mobile view → 404.

**Ship criteria:** CI green on PRs, backup script tested locally.

---

### Phase 1 — Server: Bun + sharp + cookie sessions (ships independently)

**Goal:** Server runs on Bun with no behavior change for existing clients, plus cookie-auth and webp image pipeline added. Foundation for everything else.

- [ ] Branch: `feat/server-bun`
- [ ] `server/package.json`: bump `drizzle-orm` 0.30 → latest, `zod` to latest
- [ ] Replace `better-sqlite3` with `bun:sqlite`:
  - Remove `better-sqlite3` from deps
  - In `server/src/db/client.ts`: `import { Database } from "bun:sqlite"; import { drizzle } from "drizzle-orm/bun-sqlite";`
  - Regen migrations with `drizzle-kit` if needed
- [ ] Replace `@hono/node-server` with Bun:
  ```ts
  import { Hono } from 'hono'
  const app = new Hono()
  // ... routes
  export default { port: PORT, fetch: app.fetch }
  ```
- [ ] Drop `tsx`: change `"dev": "bun run --watch src/index.ts"`
- [ ] Drop the `build` step: Bun runs TS directly. `"start": "bun run src/index.ts"`
- [ ] Add `sharp` for image processing. Update upload handler to generate `.webp` + `-thumb.webp` alongside original. API returns `{ url, webpUrl, thumbUrl, width, height }`.
- [ ] Add cookie session endpoints **alongside existing JWT** (dual-support during migration):
  - New `sessions` table: `id (uuid), user_id, created_at, expires_at, user_agent, ip`
  - `POST /api/auth/login` → creates session row, sets httpOnly cookie `session=<id>; HttpOnly; Secure; SameSite=Lax; Path=/`
  - `POST /api/auth/logout` → deletes session row, clears cookie
  - `GET /api/auth/me` → reads cookie, returns user or 401
  - Middleware checks cookie first, falls back to Bearer header (legacy support during phase)
- [ ] DB migration: add `posts.language` (default `'en'`), `posts.translation_of_id` (nullable FK self-ref). Drop `translations` table + LibreTranslate cache.
- [ ] Remove LibreTranslate code: env var, routes, fetch calls.
- [ ] Rewrite `server/Dockerfile`:
  ```dockerfile
  FROM oven/bun:1-alpine
  WORKDIR /app
  RUN apk add --no-cache vips-dev   # sharp native dep on alpine
  COPY shared/ ./shared/
  COPY server/package.json server/bun.lockb ./server/
  RUN cd server && bun install --production
  COPY server/ ./server/
  EXPOSE 3001
  HEALTHCHECK --interval=30s CMD wget -qO- http://localhost:3001/api/health || exit 1
  CMD ["bun", "run", "server/src/index.ts"]
  ```
- [ ] Update `docker-compose.yml`: drop `LIBRETRANSLATE_URL`

**Ship criteria:** All existing endpoints green via Postman/curl. Old React admin + portfolio still work against new server (cookie auth opt-in). Image uploads produce `.webp` variants. One-off migration script (see Phase 5) handles legacy images.

**Rollback:** Revert branch. SQLite file is compatible (bun:sqlite + better-sqlite3 use identical format).

---

### Phase 2 — Astro scaffold, zero-JS-framework (parallel work, doesn't touch current site)

**Goal:** Bare Astro app with theme toggle, layout, fonts. Reachable on a `:4321` dev port alongside current site.

- [ ] Branch: `feat/astro-scaffold`
- [ ] Create new folder structure (don't delete `src/` yet — work in parallel):
  ```
  web/                  ← new Astro app
  src/                  ← old React app (delete in Phase 6)
  ```
- [ ] `cd web && bun create astro@latest`. Pick: minimal, TypeScript strict.
- [ ] Add integrations: `bun add @astrojs/node @astrojs/sitemap @tailwindcss/vite tailwindcss@latest motion`
  - **No `@astrojs/svelte` / `@astrojs/react`** — zero framework runtime
- [ ] `web/astro.config.mjs`:

  ```js
  import { defineConfig } from 'astro/config'
  import node from '@astrojs/node'
  import sitemap from '@astrojs/sitemap'
  import tailwindcss from '@tailwindcss/vite'

  export default defineConfig({
    output: 'server',
    adapter: node({ mode: 'standalone' }),
    integrations: [sitemap()],
    vite: { plugins: [tailwindcss()] },
    i18n: {
      defaultLocale: 'en',
      locales: ['en', 'id'],
      routing: { prefixDefaultLocale: false },
    },
  })
  ```

- [ ] Path aliases in `web/tsconfig.json`: `@portfolio/shared/*` → `../shared/*`
- [ ] Copy `globals.css` tokens, brutalist styles, syntax highlight tokens.
- [ ] Build `web/src/layouts/Base.astro` — `<head>` + theme init script + nav + footer.
- [ ] **Theme toggle** as `web/src/scripts/theme.ts`:
  - Inline script in `<head>` reads `localStorage.theme` and applies class before paint (no FOUC)
  - Toggle button wires up via `web/src/components/ThemeToggle.astro` with `<script>` block
- [ ] Wire `<ViewTransitions />` in `<head>` of `Base.astro`.
- [ ] Dev: `bun run web/dev` (Astro dev server at :4321). Production: `bun run dist/server/entry.mjs` at :3000.

**Ship criteria:** Empty homepage with theme toggle works. Lighthouse Performance ≥ 95. Network tab shows zero framework JS shipped.

---

### Phase 3 — Port portfolio routes

**Goal:** All public pages live in Astro. Internal-only deploy on a `/preview` subdomain to compare side-by-side with prod.

- [ ] Branch: `feat/astro-portfolio`
- [ ] Import shared markdown parser: `import { parse } from '@portfolio/shared/markdown/parser'`
- [ ] Port `src/lib/api.ts` → `web/src/lib/api.ts`. Use `fetch` + cookie credentials (`credentials: 'include'`).
- [ ] Port routes in this order (easiest first):
  - `web/src/pages/index.astro` ← `src/pages/Home.tsx`
  - `web/src/pages/collection.astro` ← `src/pages/Collection.tsx` (or equivalent)
  - `web/src/pages/blog/index.astro` ← `src/pages/Blog.tsx`
  - `web/src/pages/blog/[slug].astro` ← `src/pages/BlogPost.tsx` (the hard one — 3-column layout, sidenotes, TOC)
  - `web/src/pages/[lang]/blog/index.astro` + `[lang]/blog/[slug].astro` for translations
- [ ] Convert React components → `.astro` (all server-rendered):
  - Static cards/lists → `.astro` files
  - `MarkdownRenderer` → `.astro` that calls `parse()` and outputs `Fragment set:html={html}`
  - `PostCard` → `.astro` (port from `components/ui/post-card.tsx`)
- [ ] Build vanilla TS modules in `web/src/scripts/`:
  - `theme.ts` — toggle + persistence (~30 LOC)
  - `scrollspy.ts` — `IntersectionObserver` for TOC active state (~40 LOC)
  - `sidenotes.ts` — desktop margin / mobile popover behavior (~50 LOC)
  - `nav.ts` — mobile menu toggle if needed (~20 LOC)
- [ ] Each script imported by the component that needs it via Astro `<script>` directive — Astro bundles and minifies per-page, tree-shakes unused exports.
- [ ] Page transitions: `<ViewTransitions />` in `Base.astro` — covers most of what `motion/react` did for route changes.
- [ ] Micro-animations: CSS `@keyframes` for hover/scroll. Use Motion One only if a CSS solution isn't possible (rare).
- [ ] Sitemap auto-generated by `@astrojs/sitemap`
- [ ] Cookie auth: portfolio is read-only for the public — no login needed on the marketing site. If any preview/draft pages require auth, read `session` cookie in Astro middleware (`src/middleware.ts`).
- [ ] Language picker: dropdown shows only languages with a `translation_of_id` row for the current post. Hidden if only one language exists.

**Ship criteria:**

- All pages parity with current React site (visual diff via Playwright screenshots)
- Blog post page ships **0 KB of framework JS** (only your minified script modules)
- Lighthouse Performance ≥ 98 on blog post

---

### Phase 4 — Rebuild admin in SvelteKit

**Goal:** Feature-parity admin in SvelteKit. The biggest phase.

- [ ] Branch: `feat/admin-sveltekit`
- [ ] In `admin-new/`: `bunx sv create` (Skeleton project, TS strict, Tailwind, ESLint, Prettier)
- [ ] Add `@sveltejs/adapter-node`
- [ ] Path aliases in `svelte.config.js`: `@portfolio/shared` → `../shared`
- [ ] Cookie session auth via `hooks.server.ts`:
  - Read `session` cookie on every request
  - Hit `GET /api/auth/me` (or validate locally against shared session table for zero server roundtrip)
  - Populate `event.locals.user`
  - `+layout.server.ts` redirects to `/login` if `!locals.user`
- [ ] Login page (`src/routes/login/+page.svelte`) with form action → posts to Hono → sets cookie
- [ ] Posts list (`src/routes/posts/+page.svelte`) — table with title, status, language, last edited
- [ ] Post editor (`src/routes/posts/[id]/+page.svelte`) — port the hard part:
  - Split-pane: editor textarea | live markdown preview (call shared parser)
  - All 4 image insert methods (drag/drop, upload button, gallery picker, paste URL)
  - Frontmatter fields: title, slug, excerpt, language, translation_of, tags, status
  - Translation UI: dropdown to switch language; "Add translation" button → creates new post with `translation_of_id` set
- [ ] Image gallery (`src/routes/images/+page.svelte`) — grid, search, copy URL/markdown
- [ ] Form actions for create/update/delete (progressive enhancement, no JS required for basic CRUD)
- [ ] No `motion/react`; use Svelte's built-in `transition:fade` / `transition:slide` / `animate:flip` for gallery/list reorders
- [ ] Toast/error notifications via Svelte store + headless component (no shadcn-svelte needed yet)

**Ship criteria:** Feature parity checklist passes. Daily-driver test by you for ≥ 1 week before cutover.

---

### Phase 5 — Deployment infra + data migration

**Goal:** All Dockerfiles + docker-compose updated. CI runs before deploy. Legacy images reprocessed.

- [ ] Branch: `chore/migration-infra`
- [ ] Rewrite root `Dockerfile` (portfolio):

  ```dockerfile
  FROM oven/bun:1-alpine AS build
  WORKDIR /app
  COPY shared/ ./shared/
  COPY web/package.json web/bun.lockb ./web/
  RUN cd web && bun install
  ARG VITE_API_URL
  ENV VITE_API_URL=$VITE_API_URL
  COPY web/ ./web/
  RUN cd web && bun run build

  FROM oven/bun:1-alpine
  WORKDIR /app
  COPY --from=build /app/web/dist ./dist
  COPY --from=build /app/web/node_modules ./node_modules
  EXPOSE 3000
  HEALTHCHECK --interval=30s CMD wget -qO- http://localhost:3000/ || exit 1
  CMD ["bun", "run", "dist/server/entry.mjs"]
  ```

- [ ] Rewrite `admin/Dockerfile` (no more nginx):

  ```dockerfile
  FROM oven/bun:1-alpine AS build
  WORKDIR /app
  COPY shared/ ./shared/
  COPY admin/package.json admin/bun.lockb ./admin/
  RUN cd admin && bun install
  ARG PUBLIC_API_URL
  ENV PUBLIC_API_URL=$PUBLIC_API_URL
  COPY admin/ ./admin/
  RUN cd admin && bun run build

  FROM oven/bun:1-alpine
  WORKDIR /app
  COPY --from=build /app/admin/build ./build
  COPY --from=build /app/admin/node_modules ./node_modules
  COPY --from=build /app/admin/package.json ./
  EXPOSE 3000
  HEALTHCHECK --interval=30s CMD wget -qO- http://localhost:3000/ || exit 1
  CMD ["bun", "run", "build/index.js"]
  ```

- [ ] Update `docker-compose.yml`: admin internal port 80 → 3000, drop `LIBRETRANSLATE_URL`, add healthchecks.
- [ ] Delete `nginx.conf` (unless used externally — confirm first via Claude web prompt below).
- [ ] One-off image migration script `server/scripts/migrate-images.ts` — walks uploads dir, generates `.webp` + `-thumb.webp` for legacy images. Idempotent. Run once after Phase 1 deploy.
- [ ] Update GitHub Actions deploy workflow:
  - Add `ci` job: typecheck, lint, build, test (Bun)
  - `deploy` job depends on `ci`
  - Before `docker compose up`: run `docker compose exec server bun run scripts/backup-db.ts`
  - After `docker compose up`: run `docker compose exec server bun run drizzle-kit migrate`

**Ship criteria:** Staging deploy works end-to-end. Healthchecks pass.

---

### Phase 6 — Cutover

**Goal:** Switch DNS / reverse proxy to new containers. Old code deleted.

- [ ] Branch: `feat/migration-cutover` (or merge migration branches sequentially into `main`)
- [ ] Schedule cutover window (low-traffic time)
- [ ] Run pre-cutover checklist:
  - [ ] DB backup verified restorable
  - [ ] All Phase 1-5 branches merged
  - [ ] Smoke test passed on staging
- [ ] On VPS: `git pull && docker compose up -d --build` (deploy workflow handles this)
- [ ] Post-deploy:
  - [ ] Smoke test full checklist
  - [ ] Lighthouse Performance ≥ 98 on blog post (was: variable, current React build)
  - [ ] Network tab on blog post shows 0 framework JS
  - [ ] All translations resolve correctly
  - [ ] Image uploads in admin produce webp variants
  - [ ] Login persists, cookie set with `HttpOnly; Secure; SameSite=Lax`
- [ ] Delete old `src/`, old admin React code, old deps from `package.json`
- [ ] Rename `web/` → root (move Astro app to project root) OR keep `web/` and update Dockerfile paths. Recommend: rename, for cleanliness.
- [ ] Update README + `CLAUDE.md` memory hints

**Rollback:** Revert merge commit. `docker compose up -d --build` deploys previous version. Restore DB from backup if schema migration needs reversing.

---

## Risk Register

| Risk                                                                                | Likelihood | Mitigation                                                                |
| ----------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------- |
| Sharp doesn't run in Bun on Alpine                                                  | Low        | Test in Phase 1. Fallback: `oven/bun:1-debian` base.                      |
| `bun:sqlite` behavioral diff from `better-sqlite3`                                  | Low        | Test in Phase 1 with existing data. Both follow SQLite spec.              |
| Cookie auth breaks cross-origin (admin → server)                                    | Medium     | Set `SameSite=Lax` + proper CORS `credentials` config. Test from Phase 1. |
| Vanilla JS modules forget to clean up listeners on `<ViewTransitions />` navigation | Medium     | Use `astro:page-load` event to re-init scripts; document the pattern.     |
| Lighthouse regression on blog post                                                  | Very low   | Astro defaults + zero framework JS → almost impossible to regress.        |
| `motion/react` parity gap when porting animations                                   | Low        | Most replaced by `<ViewTransitions />`; Motion One handles the rest.      |

---

## Prompts for Claude Web (VPS-specific config)

Claude web has memory of your VPS setup. Use these prompts when you're ready to tailor the deployment config. Paste this whole `MIGRATION_PLAN.md` as context first.

### Prompt 1 — Adapt docker-compose.yml to your VPS

```
I'm migrating my portfolio from React+Bun to Astro (zero JS framework, vanilla
only) + SvelteKit (admin) + Bun. Attached is MIGRATION_PLAN.md with the full
target architecture.

Given my VPS setup (you have context on this), please:

1. Produce an updated docker-compose.yml that:
   - Uses the three containers described in Phase 5 (portfolio, admin, server)
   - Matches my existing port-mapping conventions (currently portfolio 3001:3000,
     server 3003:3001, admin 3002:80 — admin will now be 3002:3000 since no
     nginx inside the container)
   - Preserves my existing volumes for SQLite db and uploads
   - Drops the LIBRETRANSLATE_URL env var
   - Adds healthchecks on all three services
   - Keeps my current memory/cpu resource limits

2. Tell me if my reverse proxy / TLS setup (whatever you remember about it)
   needs changes — specifically: does the admin container's port change from
   80 to 3000 break anything upstream?

3. Flag any other VPS-specific concerns my plan misses.
```

### Prompt 2 — Update nginx (external reverse proxy, if used)

```
I'm doing the Astro+SvelteKit+Bun migration described in attached MIGRATION_PLAN.md.

The admin container will no longer have nginx inside it (SvelteKit is its own
server). If my VPS has nginx in front of Docker (you have context on this):

1. Confirm whether my external nginx config needs changes given:
   - Admin internal port changes from 80 → 3000
   - Portfolio is now Astro SSR, not a static build behind a server
   - All three apps want to be reachable on subdomains/paths (your call based on
     what I currently have)

2. Generate the updated nginx server blocks if needed, including:
   - TLS termination (use my existing cert paths)
   - Reverse proxy to the three containers
   - Static asset caching headers (Astro emits hashed assets in /_astro/)
   - SvelteKit static assets (in /_app/immutable/)
   - WebSocket / SSE passthrough if applicable

3. Tell me if I should add a maintenance-page nginx fallback for cutover.
```

### Prompt 3 — Update GitHub Actions

```
I'm migrating to the stack described in attached MIGRATION_PLAN.md.

My current .github/workflows/deploy.yml SSHes to my VPS and runs
`docker compose up -d --build`. I want to add CI before deploy.

Generate a new workflow that:

1. On PR: runs typecheck, lint, build, and bun test (three Bun projects: web/,
   admin/, server/). Use oven-sh/setup-bun@v2.
2. On push to main: runs the CI job first, then runs the deploy job (SSH +
   compose) only if CI passes.
3. Adds these deploy-time steps in the right order:
   - Backup app.db before `docker compose down`
   - `docker compose up -d --build`
   - `docker compose exec server bun run drizzle-kit migrate`
   - Smoke test the /api/health endpoint
4. Notifies me (whatever channel you remember) on failure.

Constraints: my secrets are VPS_HOST, VPS_USER, VPS_SSH_KEY. Don't add new
required secrets unless you flag them clearly.
```

### Prompt 4 — DB backup + image migration scripts

```
For the migration in attached MIGRATION_PLAN.md, write me two one-off scripts:

1. server/scripts/backup-db.ts — copies server/data/app.db to a timestamped
   file in server/data/backups/, keeps last 7 backups, deletes older. Should
   work invoked via `bun run server/scripts/backup-db.ts` and inside the
   docker container.

2. server/scripts/migrate-images.ts — walks the uploads directory (path is in
   my server config — you have context), and for every .png/.jpg/.jpeg that
   doesn't already have a .webp sibling, generates:
     - foo.webp (quality 80)
     - foo-thumb.webp (400px wide, quality 75)
   Uses sharp. Idempotent. Reports progress and final count.

Both scripts must work in Bun runtime, not Node.
```

### Prompt 5 — Final sanity check

```
Attached is MIGRATION_PLAN.md. Given everything you know about my VPS,
infrastructure, and how I work:

What did this plan miss? Specifically:
- TLS cert renewal interactions
- Backup retention beyond app.db (uploads dir?)
- Monitoring / log aggregation I currently rely on
- Cron jobs or scheduled tasks on the VPS that touch these services
- DNS, CDN, or cache layers in front
- Any other VPS-specific surface area

Be blunt — list what's missing, don't pad.
```

---

## Estimated Effort

| Phase                              | Effort            | Can ship before next phase?               |
| ---------------------------------- | ----------------- | ----------------------------------------- |
| 0 — Prep                           | ~2 hours          | ✓                                         |
| 1 — Server Bun + sharp + cookies   | 1-2 days          | ✓ (server still serves old React clients) |
| 2 — Astro scaffold                 | 0.5 day           | ✓ (parallel folder)                       |
| 3 — Portfolio routes               | 2-3 days          | ✓ (preview subdomain)                     |
| 4 — Admin SvelteKit                | 4-6 days          | ✓ (parallel)                              |
| 5 — Deploy infra + image migration | 1 day             | ✓ (staging)                               |
| 6 — Cutover                        | 0.5 day + monitor | —                                         |

**Total: ~10-14 focused days.** Realistically calendar 3-5 weeks with normal life.

---

## Cleanup Checklist (Phase 6 tail)

- [ ] Delete `src/` (old React portfolio)
- [ ] Delete old `admin/` React code if rebuilt under a new path
- [ ] Remove deps: `react`, `react-dom`, `@tanstack/react-router`, `@tanstack/router-vite-plugin`, `next-themes`, `motion`, `@radix-ui/*`, `react-router-dom`, `tsx`, `@vitejs/plugin-react`, `eslint-plugin-prettier` (if dropping for Bun's `bun fmt`)
- [ ] Delete `nginx.conf` (if confirmed unused externally)
- [ ] Delete `next-env.d.ts` (stale Next.js artifact)
- [ ] Delete `vite-report.html`, `*.report.html`, `preview.*log`, `start.*log`, `tsconfig.tsbuildinfo`
- [ ] Delete `src/routeTree.gen.ts` (TanStack Router artifact)
- [ ] Update `README.md` to reflect new stack
- [ ] Update `CLAUDE.md` / memory files to reflect new structure
- [ ] Bump version: 0.1.0 → 0.2.0
