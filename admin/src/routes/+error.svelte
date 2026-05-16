<script lang="ts">
  import { page } from '$app/state'
</script>

<svelte:head>
  <title>Error {page.status} — Admin</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-white dark:bg-[#0a0a0a]">
  <div class="border-2 border-black p-8 shadow-[4px_4px_0px_#000] dark:border-white dark:shadow-[4px_4px_0px_#fff]">
    <p class="mb-1 font-mono text-[10px] tracking-widest text-black/40 uppercase dark:text-white/40">
      Error
    </p>
    <h1 class="mb-2 text-6xl font-black tracking-tighter text-black dark:text-white">
      {page.status}
    </h1>
    <p class="mb-6 font-mono text-sm text-black/60 dark:text-white/60">
      {page.error?.message ?? 'Something went wrong.'}
    </p>
    <a
      href="/"
      class="inline-block bg-black px-4 py-2 font-mono text-xs font-bold tracking-widest text-white uppercase transition-colors hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80"
    >
      ← Back to posts
    </a>
  </div>
</div>
