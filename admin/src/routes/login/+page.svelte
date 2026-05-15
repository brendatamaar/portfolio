<script lang="ts">
  import { enhance } from '$app/forms'
  import type { ActionData } from './$types'

  let { form }: { form: ActionData } = $props()
  let loading = $state(false)
</script>

<svelte:head>
  <title>Login — Admin</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-[#f0f0f0] dark:bg-black">
  <form
    method="POST"
    class="w-full max-w-sm border-2 border-black p-8 dark:border-white"
    use:enhance={() => {
      loading = true
      return async ({ update }) => {
        loading = false
        await update()
      }
    }}
  >
    <h1 class="mb-6 text-2xl font-black tracking-tighter text-black uppercase dark:text-white">
      Admin Login
    </h1>

    {#if form?.error}
      <p class="mb-4 border border-red-500 p-2 font-mono text-xs text-red-500 dark:border-red-400 dark:text-red-400">
        {form.error}
      </p>
    {/if}

    <label class="mb-4 block">
      <span class="mb-1 block font-mono text-[11px] tracking-widest text-black/50 uppercase dark:text-white/50">
        Username
      </span>
      <input
        id="username"
        name="username"
        type="text"
        autocomplete="username"
        required
        autofocus
        class="w-full border-2 border-black/30 bg-white px-3 py-2 font-mono text-sm text-black transition-colors outline-none focus:border-black dark:border-white/30 dark:bg-black dark:text-white dark:focus:border-white"
      />
    </label>

    <label class="mb-6 block">
      <span class="mb-1 block font-mono text-[11px] tracking-widest text-black/50 uppercase dark:text-white/50">
        Password
      </span>
      <input
        id="password"
        name="password"
        type="password"
        autocomplete="current-password"
        required
        class="w-full border-2 border-black/30 bg-white px-3 py-2 font-mono text-sm text-black transition-colors outline-none focus:border-black dark:border-white/30 dark:bg-black dark:text-white dark:focus:border-white"
      />
    </label>

    <button
      type="submit"
      disabled={loading}
      class="w-full bg-black py-2.5 font-black tracking-tight text-white uppercase transition-colors hover:bg-black/80 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/80"
    >
      {loading ? 'Signing in…' : 'Sign in'}
    </button>
  </form>
</div>
