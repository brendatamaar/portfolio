<script lang="ts">
  import { onMount } from 'svelte'
  import { page } from '$app/state'
  import { Sun, Moon, LogOut, Plus, House } from 'lucide-svelte'
  import type { Snippet } from 'svelte'
  import type { LayoutData } from './$types'

  let { children, data }: { children: Snippet; data: LayoutData } = $props()
  let dark = $state(true)

  onMount(() => {
    const stored = localStorage.getItem('admin_theme')
    dark = stored ? stored === 'dark' : !matchMedia('(prefers-color-scheme: light)').matches
    document.documentElement.classList.toggle('dark', dark)
  })

  function toggleTheme() {
    dark = !dark
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('admin_theme', dark ? 'dark' : 'light')
  }

  const NAV = [
    { href: '/', label: 'Posts', match: (p: string) => p === '/' || p.startsWith('/posts') },
    { href: '/collection', label: 'Collection', match: (p: string) => p.startsWith('/collection') },
    { href: '/resume', label: 'Resume', match: (p: string) => p.startsWith('/resume') },
    { href: '/images', label: 'Images', match: (p: string) => p.startsWith('/images') },
  ]
  let path = $derived(page.url.pathname)
  let isEditor = $derived(path.startsWith('/posts/'))
</script>

<div class="flex min-h-screen flex-col bg-page text-ink">
  <header class="flex min-h-11 items-center justify-between px-4 pt-2 sm:px-6">
    <a href="/" aria-label="Posts home" class="-ml-2 inline-flex min-h-11 min-w-11 items-center justify-center text-quiet transition-colors hover:text-ink">
      <House size={20} strokeWidth={1.7} />
    </a>
    <nav class="flex items-center gap-1 text-[14px] sm:gap-2" aria-label="Admin">
      {#each NAV as item (item.href)}
        <a href={item.href} aria-current={item.match(path) ? 'page' : undefined} class="inline-flex min-h-11 items-center px-1.5 py-2.5 transition-colors {item.match(path) ? 'font-medium text-ink' : 'text-quiet hover:text-ink'}">{item.label}</a>
      {/each}
      {#if !isEditor}
        <a href="/posts/new" class="ml-1 inline-flex min-h-9 items-center gap-1.5 rounded-full bg-ink px-3.5 text-[13px] font-medium text-page transition-opacity hover:opacity-80"><Plus size={13} /> New post</a>
      {/if}
      <button onclick={toggleTheme} class="-mr-1 inline-flex min-h-11 items-center px-2 text-quiet transition-colors hover:text-ink" title={dark ? 'Switch to light' : 'Switch to dark'} aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}>
        {#if dark}<Sun size={20} strokeWidth={1.7} />{:else}<Moon size={20} strokeWidth={1.7} />{/if}
      </button>
      <form method="POST" action="/logout" class="flex">
        <button type="submit" class="inline-flex min-h-11 items-center gap-1.5 px-1.5 text-quiet transition-colors hover:text-ink" title="Log out"><LogOut size={15} /><span class="hidden sm:inline">Logout</span></button>
      </form>
    </nav>
  </header>
  <main class="flex-1">{@render children()}</main>
</div>
