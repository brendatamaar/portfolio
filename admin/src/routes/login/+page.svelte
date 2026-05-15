<script lang="ts">
  import { enhance } from '$app/forms'
  import type { ActionData } from './$types'

  let { form }: { form: ActionData } = $props()
  let loading = $state(false)
</script>

<svelte:head>
  <title>Login — Admin</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-[#f5f5f5] dark:bg-[#0a0a0a]">
  <div
    class="w-full max-w-sm border-2 border-black bg-white p-8 shadow-[6px_6px_0px_#000] dark:border-white dark:bg-[#111] dark:shadow-[6px_6px_0px_#fff]"
  >
    <h1 class="mb-8 text-2xl font-black uppercase tracking-tight dark:text-white">Admin Login</h1>

    {#if form?.error}
      <div class="mb-4 border-2 border-red-600 bg-red-50 p-3 text-sm font-bold text-red-600">
        {form.error}
      </div>
    {/if}

    <form
      method="POST"
      use:enhance={() => {
        loading = true
        return async ({ update }) => {
          loading = false
          await update()
        }
      }}
    >
      <div class="mb-4">
        <label
          for="username"
          class="mb-1 block text-xs font-bold uppercase tracking-widest dark:text-white"
        >
          Username
        </label>
        <input id="username" name="username" type="text" autocomplete="username" required />
      </div>

      <div class="mb-6">
        <label
          for="password"
          class="mb-1 block text-xs font-bold uppercase tracking-widest dark:text-white"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autocomplete="current-password"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        class="w-full border-2 border-black bg-[#ffe600] px-4 py-2 text-sm font-black uppercase tracking-widest transition-all hover:bg-black hover:text-[#ffe600] disabled:opacity-50"
      >
        {loading ? 'Logging in…' : 'Login'}
      </button>
    </form>
  </div>
</div>
