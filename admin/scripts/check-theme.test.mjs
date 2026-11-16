// Regression: the inline FOUC script in app.html and the toggle in
// (admin)/+layout.svelte must use the SAME localStorage key, otherwise the
// saved theme never applies on reload (was admin-theme vs admin_theme).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const appHtml = readFileSync(join(root, 'src/app.html'), 'utf8')
const layout = readFileSync(join(root, 'src/routes/(admin)/+layout.svelte'), 'utf8')

test('theme localStorage key is consistent', () => {
  const read = appHtml.match(/localStorage\.getItem\('([^']+)'\)/)?.[1]
  const written = layout.match(/localStorage\.setItem\('([^']+)'/)?.[1]
  assert.ok(read, 'app.html should read a theme key')
  assert.equal(read, written)
})

test('dead client API methods stay removed (serverFetch owns them)', () => {
  const api = readFileSync(join(root, 'src/lib/api.ts'), 'utf8')
  for (const dead of ['getPosts:', 'getTags:', 'deletePost:', 'login:', 'logout:'])
    assert.ok(!api.includes(dead), `${dead} should not be in client api`)
})
