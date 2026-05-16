<script lang="ts">
  import { onMount } from 'svelte'
  import { page } from '$app/state'
  import { Sun, Moon, LogOut, Plus } from 'lucide-svelte'
  import type { Snippet } from 'svelte'
  import type { LayoutData } from './$types'

  let { children, data }: { children: Snippet; data: LayoutData } = $props()
  let dark = $state(false)

  onMount(() => {
    dark = localStorage.getItem('admin_theme') === 'dark'
    document.documentElement.classList.toggle('dark', dark)
  })

  function toggleTheme() {
    dark = !dark
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('admin_theme', dark ? 'dark' : 'light')
  }

  let isCollectionOrResume = $derived(
    page.url.pathname.startsWith('/collection') || page.url.pathname.startsWith('/resume'),
  )
</script>

<div class="flex min-h-screen flex-col dark:bg-[#0a0a0a]">
  <header class="flex h-14 items-center justify-between border-b border-black/10 px-6 dark:border-white/10">
    <span class="text-sm font-black tracking-tight uppercase dark:text-white">Portfolio CMS</span>

    {#if isCollectionOrResume}
      <a
        href="/"
        class="font-mono text-xs tracking-widest text-black/40 uppercase transition-colors hover:text-black dark:text-white/40 dark:hover:text-white"
      >
        ← Posts
      </a>
    {:else}
      <nav class="flex items-center gap-3">
        <a
          href="/collection"
          class="font-mono text-xs tracking-widest text-black/40 uppercase transition-colors hover:text-black dark:text-white/40 dark:hover:text-white"
        >
          Collection
        </a>
        <a
          href="/resume"
          class="font-mono text-xs tracking-widest text-black/40 uppercase transition-colors hover:text-black dark:text-white/40 dark:hover:text-white"
        >
          Resume
        </a>
        <a
          href="/posts/new"
          class="flex items-center gap-1.5 bg-black px-3 py-1.5 text-xs font-bold tracking-wide text-white uppercase transition-colors hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80"
        >
          <Plus size={13} />
          New post
        </a>
        <button
          onclick={toggleTheme}
          class="p-1.5 text-black/40 transition-colors hover:text-black dark:text-white/40 dark:hover:text-white"
          title="Toggle theme"
        >
          {#if dark}
            <Sun size={15} />
          {:else}
            <Moon size={15} />
          {/if}
        </button>
        <form method="POST" action="/logout">
          <button
            type="submit"
            class="flex items-center gap-1.5 font-mono text-xs tracking-widest text-black/40 uppercase transition-colors hover:text-black dark:text-white/40 dark:hover:text-white"
          >
            <LogOut size={13} />
            Logout
          </button>
        </form>
      </nav>
    {/if}
  </header>

  <main class="flex-1">
    {@render children()}
  </main>
</div>
