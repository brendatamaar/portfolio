<script lang="ts">
  import { untrack } from 'svelte'
  import { api } from '$lib/api'
  import type { AdminImage } from '$lib/types'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()
  let images = $state<AdminImage[]>(untrack(() => data.images))
  $effect(() => {
    images = data.images
  })
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

  function fmtSize(bytes: number) {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`
  }
</script>

<svelte:head>
  <title>Images — Admin</title>
</svelte:head>

<div class="mx-auto max-w-4xl px-6 py-8">
  <div class="mb-6 flex items-center justify-between">
    <h1 class="text-3xl font-black tracking-tighter uppercase dark:text-white">Images</h1>
    <label
      class="cursor-pointer bg-black px-3 py-1.5 text-xs font-bold tracking-wide text-white uppercase transition-colors hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80"
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
    <p class="py-16 text-center font-mono text-xs tracking-widest text-black/40 uppercase dark:text-white/40">
      No images uploaded yet.
    </p>
  {:else}
    <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {#each images as img (img.id)}
        <div class="border border-black/10 bg-white dark:border-white/10 dark:bg-[#111]">
          <img
            src={img.url}
            alt={img.filename}
            class="aspect-square w-full object-cover"
            loading="lazy"
          />
          <div class="border-t border-black/10 p-2 dark:border-white/10">
            <p class="truncate font-mono text-[10px] font-bold dark:text-white">{img.filename}</p>
            <p class="mb-2 font-mono text-[10px] text-black/40 dark:text-white/40">
              {fmtSize(img.size)}{img.width ? ` · ${img.width}×${img.height}` : ''}
            </p>
            <div class="flex gap-1">
              <button
                onclick={() => copyUrl(img)}
                class="flex-1 bg-black/5 py-1 font-mono text-[10px] font-bold uppercase transition-colors hover:bg-black hover:text-white dark:bg-white/5 dark:text-white dark:hover:bg-white dark:hover:text-black"
              >
                {copied === img.id ? 'Copied!' : 'Copy URL'}
              </button>
              <button
                onclick={() => handleDelete(img)}
                class="px-2 py-1 font-mono text-[10px] font-bold text-red-500 transition-colors hover:bg-red-500 hover:text-white"
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
