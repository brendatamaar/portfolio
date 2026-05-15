# Post-Deploy Smoke Test Checklist

Run after every production deploy. All 10 checks must pass before considering the deploy successful.

---

## Auth

- [ ] **Login** — Go to `/admin/login`. Enter credentials. Verify redirect to post list (no error).
- [ ] **Session persists** — Refresh admin page. Verify still logged in (cookie session, not just localStorage).

## Admin — Content

- [ ] **Post list** — `/admin/posts` loads. At least one post shown. No console errors.
- [ ] **Edit post** — Open a published post in the editor. Verify split-pane (editor + preview) renders. Make a minor change and save. Verify success toast.
- [ ] **Preview** — Click Preview on a draft post. Verify draft content renders correctly.
- [ ] **Publish** — Change a draft post to Published. Verify it appears on `/blog`.

## Public — Blog

- [ ] **Blog list** — `/blog` loads. Posts visible. Theme toggle works (light ↔ dark).
- [ ] **Blog post** — Open a published post at `/blog/<slug>`. Verify: title, body, TOC (desktop), sidenotes (desktop), no 404.

## Public — Portfolio

- [ ] **Theme toggle** — Toggle dark/light on the homepage. Verify no FOUC on reload.
- [ ] **Mobile view** — Resize to 375px. Verify nav collapses, no horizontal overflow, blog post readable.

## 404

- [ ] **404 page** — Navigate to `/does-not-exist`. Verify a friendly 404 page renders (not a blank screen or server error).

---

## After confirming all checks pass

Update the deploy log / PR comment with: `✓ smoke test passed — <date> <deployer>`
