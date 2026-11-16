<script lang="ts">
  import { enhance } from '$app/forms'
  import type { ActionData } from './$types'

  let { form }: { form: ActionData } = $props()
  let loading = $state(false)
</script>

<svelte:head><title>Login — Admin</title></svelte:head>

<div class="flex min-h-screen items-center justify-center bg-page px-4">
  <form method="POST" class="w-full max-w-80" use:enhance={() => { loading = true; return async ({ update }) => { loading = false; await update() } }}>
    <h1 class="text-[16px] text-ink">Admin</h1>
    <p class="mt-1 mb-8 text-[14px] text-quiet">Sign in to manage the site.</p>
    {#if form?.error}<p class="mb-4 rounded-lg border border-rose/40 bg-rose/10 px-3 py-2 text-[13px] text-rose" role="alert">{form.error}</p>{/if}
    <label class="mb-4 block">
      <span class="mb-1.5 block text-[13px] text-quiet">Username</span>
      <input id="username" name="username" type="text" autocomplete="username" required autofocus class="w-full rounded-lg border border-ring bg-transparent px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-quiet" />
    </label>
    <label class="mb-6 block">
      <span class="mb-1.5 block text-[13px] text-quiet">Password</span>
      <input id="password" name="password" type="password" autocomplete="current-password" required class="w-full rounded-lg border border-ring bg-transparent px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-quiet" />
    </label>
    <button type="submit" disabled={loading} class="w-full rounded-full bg-ink py-2.5 text-[14px] font-medium text-page transition-opacity hover:opacity-80 disabled:opacity-50">{loading ? 'Signing in…' : 'Sign in'}</button>
  </form>
</div>