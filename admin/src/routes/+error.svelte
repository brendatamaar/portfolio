<script lang="ts">
  import { page } from '$app/state'
</script>

<svelte:head><title>Error {page.status} — Admin</title></svelte:head>

<div class="flex min-h-screen items-center justify-center bg-page px-4">
  <div class="w-full max-w-80">
    <p class="text-[14px] text-quiet">Error {page.status}</p>
    <h1 class="mt-1 text-[16px] text-ink">{page.error?.message ?? 'Something went wrong.'}</h1>
    <a href="/" class="mt-6 inline-block border-b border-leader font-medium text-ink transition-colors hover:border-ink">← Back to posts</a>
  </div>
</div>