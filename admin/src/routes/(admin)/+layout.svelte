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
  <header class="border-b-2 border-black bg-white dark:border-white dark:bg-[#111]">
    <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
      <a href="/" class="text-sm font-black uppercase tracking-widest dark:text-white">Admin CMS</a>
      <nav class="flex items-center gap-6">
        {#each navLinks as link}
          <a
            href={link.href}
            class="text-xs font-bold uppercase tracking-widest hover:underline dark:text-white"
          >
            {link.label}
          </a>
        {/each}
        <button
          onclick={toggleTheme}
          class="text-xs font-bold uppercase tracking-widest hover:underline dark:text-white"
        >
          {dark ? 'Light' : 'Dark'}
        </button>
        <form method="POST" action="/logout">
          <button
            type="submit"
            class="text-xs font-bold uppercase tracking-widest hover:underline dark:text-white"
          >
            Logout
          </button>
        </form>
      </nav>
    </div>
  </header>

  <main class="flex-1">
    {@render children()}
  </main>
</div>
