<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { LayoutData } from './$types'

  let { children, data }: { children: Snippet; data: LayoutData } = $props()

  const navLinks = [
    { href: '/', label: 'Posts' },
    { href: '/images', label: 'Images' },
  ]
</script>

<div class="flex min-h-screen flex-col">
  <header class="border-b-2 border-black bg-white">
    <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
      <a href="/" class="text-sm font-black uppercase tracking-widest">Admin CMS</a>
      <nav class="flex items-center gap-6">
        {#each navLinks as link}
          <a href={link.href} class="text-xs font-bold uppercase tracking-widest hover:underline">
            {link.label}
          </a>
        {/each}
        <form method="POST" action="/logout">
          <button type="submit" class="text-xs font-bold uppercase tracking-widest hover:underline">
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
