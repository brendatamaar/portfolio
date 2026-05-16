<script lang="ts">
  import { api } from '$lib/api'
  import type { AdminImage } from '$lib/types'
  import { fmtSize } from '$lib/utils'

  interface Props {
    open: boolean
    onselect: (url: string) => void
    onclose: () => void
  }
  let { open, onselect, onclose }: Props = $props()

  let images = $state<AdminImage[]>([])
  let loading = $state(false)
  let uploading = $state(false)
  let error = $state('')

  $effect(() => {
    if (open) loadImages()
  })

  async function loadImages() {
    loading = true
    try {
      const res = await api.getImages()
      images = res.data
    } catch (e) {
      error = String(e)
    } finally {
      loading = false
    }
  }

  async function handleUpload(e: Event) {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    uploading = true
    try {
      const img = await api.uploadImage(file)
      images = [img, ...images]
    } catch (e) {
      error = String(e)
    } finally {
      uploading = false
      input.value = ''
    }
  }

  async function handleDelete(img: AdminImage, e: MouseEvent) {
    e.stopPropagation()
    if (!confirm('Delete this image?')) return
    try {
      await api.deleteImage(img.id)
      images = images.filter((i) => i.id !== img.id)
    } catch (e) {
      error = String(e)
    }
  }
</script>

{#if open}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 z-40 bg-black/60"
    role="button"
    tabindex="-1"
    onkeydown={(e) => e.key === 'Escape' && onclose()}
    onclick={onclose}
  ></div>

  <!-- Modal -->
  <div
    class="fixed inset-4 z-50 flex flex-col border-2 border-black bg-white shadow-[8px_8px_0px_#000] dark:border-white dark:bg-[#111] dark:shadow-[8px_8px_0px_#fff] md:inset-12"
  >
    <div
      class="flex items-center justify-between border-b-2 border-black px-6 py-4 dark:border-white"
    >
      <h2 class="text-base font-black uppercase tracking-widest dark:text-white">Image Gallery</h2>
      <div class="flex items-center gap-4">
        <label
          class="cursor-pointer border-2 border-black bg-[#ffe600] px-3 py-1.5 text-xs font-black uppercase tracking-widest shadow-[2px_2px_0px_#000] hover:bg-black hover:text-[#ffe600] dark:shadow-[2px_2px_0px_#fff]"
        >
          {uploading ? 'Uploading…' : 'Upload'}
          <input
            type="file"
            accept="image/*"
            class="hidden"
            disabled={uploading}
            onchange={handleUpload}
          />
        </label>
        <button onclick={onclose} class="text-xl font-black leading-none dark:text-white">×</button>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-6">
      {#if error}
        <p class="mb-4 text-sm font-bold text-red-600">{error}</p>
      {/if}
      {#if loading}
        <p class="text-sm font-bold uppercase tracking-widest text-black/40 dark:text-white/40">
          Loading…
        </p>
      {:else if images.length === 0}
        <p class="text-sm font-bold uppercase tracking-widest text-black/40 dark:text-white/40">
          No images yet.
        </p>
      {:else}
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {#each images as img (img.id)}
            <div
              class="group relative cursor-pointer border-2 border-black hover:border-[#ffe600] dark:border-white dark:hover:border-[#ffe600]"
              role="button"
              tabindex="0"
              onkeydown={(e) => e.key === 'Enter' && onselect(img.url)}
              onclick={() => onselect(img.url)}
            >
              <img
                src={img.url}
                alt={img.filename}
                class="aspect-square w-full object-cover"
                loading="lazy"
              />
              <div class="border-t border-black/20 p-1.5 dark:border-white/20">
                <p class="truncate text-[10px] font-medium dark:text-white">{img.filename}</p>
                <p class="text-[10px] text-black/50 dark:text-white/50">{fmtSize(img.size)}</p>
              </div>
              <button
                class="absolute right-1 top-1 hidden border border-black bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white group-hover:block"
                onclick={(e) => handleDelete(img, e)}
              >
                ×
              </button>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
{/if}
