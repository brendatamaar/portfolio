<script lang="ts">
  import { untrack } from 'svelte'
  import { api } from '$lib/api'
  import type { AdminImage } from '$lib/types'
  import type { PageData } from './$types'
  import { fmtSize } from '$lib/utils'

  let { data }: { data: PageData } = $props()
  let images = $state<AdminImage[]>(untrack(() => data.images))
  let uploading = $state(false)
  let error = $state('')
  let copied = $state<number | null>(null)

  async function handleUpload(e: Event) {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    uploading = true
    error = ''
    try {
      const img = await api.uploadImage(file)
      images = [img, ...images]
    } catch (e: unknown) {
      error = String(e)
    } finally {
      uploading = false
      input.value = ''
    }
  }

  async function handleDelete(img: AdminImage) {
    if (!confirm('Delete this image?')) return
    try {
      await api.deleteImage(img.id)
      images = images.filter((i) => i.id !== img.id)
    } catch (e: unknown) {
      error = String(e)
    }
  }

  async function copyUrl(img: AdminImage) {
    await navigator.clipboard.writeText(img.url)
    copied = img.id
    setTimeout(() => (copied = null), 1500)
  }

</script>

<svelte:head>
  <title>Images — Admin</title>
</svelte:head>

<div class="mx-auto w-full max-w-176 px-4 pt-8 pb-16 sm:px-0">
  <div class="mb-6 flex items-center justify-between">
    <h1 class="text-[16px] text-ink">Images</h1>
    <label
      class="cursor-pointer bg-ink px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-ink/80 dark:bg-ink dark:text-page dark:hover:bg-page/80"
    >
      {uploading ? 'Uploading…' : '+ Upload'}
      <input
        type="file"
        accept="image/*"
        class="hidden"
        disabled={uploading}
        onchange={handleUpload}
      />
    </label>
  </div>

  {#if error}
    <div class="mb-4 border border-red-500 p-2 font-mono text-xs text-red-500">
      {error}
    </div>
  {/if}

  {#if images.length === 0}
    <p class="py-16 text-center text-[13px] text-quiet dark:text-quiet">
      No images uploaded yet.
    </p>
  {:else}
    <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {#each images as img (img.id)}
        <div class="border border-ring bg-page dark:border-white/10 dark:bg-raised">
          <img
            src={img.url}
            alt={img.filename}
            class="aspect-square w-full object-cover"
            loading="lazy"
          />
          <div class="border-t border-ring p-2 dark:border-white/10">
            <p class="truncate font-mono text-[11px] font-bold dark:text-white">{img.filename}</p>
            <p class="mb-2 font-mono text-[11px] text-quiet">
              {fmtSize(img.size)}{img.width ? ` · ${img.width}×${img.height}` : ''}
            </p>
            <div class="flex gap-1">
              <button
                onclick={() => copyUrl(img)}
                class="flex-1 bg-raised py-1 font-mono text-[11px] font-bold transition-colors hover:bg-ink hover:text-white dark:bg-white/5 dark:text-white dark:hover:bg-page dark:hover:text-ink"
              >
                {copied === img.id ? 'Copied!' : 'Copy URL'}
              </button>
              <button
                onclick={() => handleDelete(img)}
                class="px-2 py-1 font-mono text-[11px] font-bold text-red-500 transition-colors hover:bg-red-500 hover:text-white"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
