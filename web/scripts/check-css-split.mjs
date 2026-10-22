// Regression check for the per-page CSS split (styles/*.css).
// Classes used by shared components (Header/Footer/Sticker/Logo) or by more
// than one page must live in shared.css — otherwise a page that never loads
// home.css/blog.css/post.css renders them unstyled (e.g. footer cards and
// the blog empty state broke that way). Run: bun scripts/check-css-split.mjs
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../src/', import.meta.url))
const read = (p) => readFileSync(root + p, 'utf8')
const shared = read('v2/styles/shared.css')
const files = {
  home: read('v2/styles/home.css'),
  blog: read('v2/styles/blog.css'),
  post: read('v2/styles/post.css'),
}

const classesOf = (src) => {
  const out = new Set()
  for (const m of src.matchAll(/class(?:Name)?=["'`]([^"'`]+)["'`]/g))
    for (const tok of m[1].split(/\s+/)) if (tok && !tok.includes('{')) out.add(tok)
  return out
}

const sharedCompClasses = new Set()
for (const p of [
  'v2/components/Header.astro',
  'v2/components/Footer.astro',
  'v2/components/Sticker.astro',
  'v2/components/Logo.astro',
  'v2/components/NotFound.astro',
  'v2/layouts/V2.astro',
])
  for (const c of classesOf(read(p))) sharedCompClasses.add(c)

const pageClasses = {
  home: classesOf(read('pages/index.astro')),
  blog: classesOf(read('pages/blog.astro')),
  post: classesOf(read('pages/blog/[slug].astro')),
}

const hasRule = (css, cls) => new RegExp(`\\.${cls.replace(/-/g, '\\-')}[\\s,{.:]`).test(css)

let failed = 0
const check = (cond, msg) => {
  if (!cond) {
    failed++
    console.error('FAIL', msg)
  }
}

// 1. Every shared-component class with a rule anywhere must be in shared.css.
for (const cls of sharedCompClasses) {
  const somewhere = Object.entries(files).find(([, css]) => hasRule(css, cls))
  if (somewhere) check(hasRule(shared, cls), `.${cls} (shared component) only in ${somewhere[0]}.css`)
}
// 2. Footer card + empty-state families explicitly (dynamic tone classes are
//    built as `card--${tone}`, so they never appear literally in markup).
for (const cls of ['card', 'card--lime', 'card--navy', 'scrap__empty', 'scrap__empty-seal', 'scrap__empty-title'])
  check(hasRule(shared, cls), `.${cls} must be in shared.css`)
// 3. A class used by two pages must not live in only one page's file.
for (const [cls] of [...pageClasses.home].entries()) void cls
const all = new Set([...pageClasses.home, ...pageClasses.blog, ...pageClasses.post])
for (const cls of all) {
  const usedBy = Object.keys(pageClasses).filter((k) => pageClasses[k].has(cls))
  if (usedBy.length < 2) continue
  for (const [name, css] of Object.entries(files))
    if (hasRule(css, cls) && !usedBy.includes(name))
      check(false, `.${cls} used by ${usedBy} but only styled in ${name}.css`)
}

if (failed) {
  console.error(`${failed} CSS split check(s) failed`)
  process.exit(1)
}
console.log('CSS split checks passed')
