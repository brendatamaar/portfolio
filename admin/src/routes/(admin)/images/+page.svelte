<script lang="ts">
  import { api } from '$lib/api'
  import type { AdminImage } from '$lib/types'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()
  let images = $state<AdminImage[]>(data.images)
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

<div class="mx-auto max-w-6xl px-6 py-8">
  <div class="mb-8 flex items-center justify-between">
    <h1 class="text-2xl font-black uppercase tracking-tight">Images</h1>
    <label class="cursor-pointer border-2 border-black bg-[#ffe600] px-4 py-2 text-xs font-black uppercase tracking-widest shadow-[3px_3px_0px_#000] hover:bg-black hover:text-[#ffe600]">
      {uploading ? 'Uploading…' : '+ Upload'}
      <input type="file" accept="image/*" class="hidden" disabled={uploading} onchange={handleUpload} />
    </label>
  </div>

  {#if error}
    <div class="mb-4 border-2 border-red-600 bg-red-50 p-3 text-sm font-bold text-red-600">{error}</div>
  {/if}

  {#if images.length === 0}
    <p class="py-16 text-center text-xs font-bold uppercase tracking-widest text-black/40">No images uploaded yet.</p>
  {:else}
    <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {#each images as img (img.id)}
        <div class="group border-2 border-black bg-white">
          <img src={img.url} alt={img.filename} class="aspect-square w-full object-cover" loading="lazy" />
          <div class="border-t-2 border-black p-2">
            <p class="truncate text-[10px] font-bold">{img.filename}</p>
            <p class="mb-2 text-[10px] text-black/50">{fmtSize(img.size)}{img.width ? ` · ${img.width}×${img.height}` : ''}</p>
            <div class="flex gap-1">
              <button
                onclick={() => copyUrl(img)}
                class="flex-1 border border-black bg-[#f5f5f5] py-1 text-[10px] font-bold uppercase hover:bg-black hover:text-white"
              >
                {copied === img.id ? 'Copied!' : 'Copy URL'}
              </button>
              <button
                onclick={() => handleDelete(img)}
                class="border border-red-600 bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600 hover:bg-red-600 hover:text-white"
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
