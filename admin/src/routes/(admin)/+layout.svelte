<script lang="ts">
  import { onMount } from 'svelte'
  import type { Snippet } from 'svelte'
  import type { LayoutData } from './$types'

  let { children, data }: { children: Snippet; data: LayoutData } = $props()
  let dark = $state(false)

  onMount(() => {
    dark = localStorage.getItem('admin-theme') === 'dark'
  })

  function toggleTheme() {
    dark = !dark
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('admin-theme', dark ? 'dark' : 'light')
  }

  const navLinks = [
    { href: '/', label: 'Posts' },
    { href: '/images', label: 'Images' },
  ]
</script>

<div class="flex min-h-screen flex-col dark:bg-[#0a0a0a]">
  <header class="flex h-14 items-center justify-between border-b border-black/10 px-6 dark:border-white/10">
    <a href="/" class="text-sm font-black tracking-tight uppercase dark:text-white">Portfolio CMS</a>
    <nav class="flex items-center gap-3">
      {#each navLinks as link}
        <a
          href={link.href}
          class="font-mono text-xs tracking-widest text-black/40 uppercase transition-colors hover:text-black dark:text-white/40 dark:hover:text-white"
        >
          {link.label}
        </a>
      {/each}
      <button
        onclick={toggleTheme}
        class="p-1.5 text-black/40 transition-colors hover:text-black dark:text-white/40 dark:hover:text-white"
        title="Toggle theme"
      >
        {dark ? '☀' : '☽'}
      </button>
      <form method="POST" action="/logout">
        <button
          type="submit"
          class="font-mono text-xs tracking-widest text-black/40 uppercase transition-colors hover:text-black dark:text-white/40 dark:hover:text-white"
        >
          Logout
        </button>
      </form>
    </nav>
  </header>

  <main class="flex-1">
    {@render children()}
  </main>
</div>
