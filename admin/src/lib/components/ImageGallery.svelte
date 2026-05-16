<script lang="ts">
  import { Check, Image as ImageIcon, Trash2, Upload, X } from 'lucide-svelte'
  import { api } from '$lib/api'
  import type { AdminImage } from '$lib/types'

  interface Props {
    open: boolean
    enableInsertDetails?: boolean
    onselect: (url: string, opts?: { altText: string; caption: string }) => void
    onclose: () => void
  }
  let { open, enableInsertDetails = false, onselect, onclose }: Props = $props()

  let images = $state<AdminImage[]>([])
  let loading = $state(true)
  let uploading = $state(false)
  let uploadError = $state('')
  let selectedImage = $state<AdminImage | null>(null)
  let altText = $state('')
  let caption = $state('')

  let closeBtnRef = $state<HTMLButtonElement | null>(null)

  $effect(() => {
    if (open) {
      void loadImages()
      // restore focus on close handled implicitly; focus close button on open
      queueMicrotask(() => closeBtnRef?.focus())
    } else {
      // reset insert-details state when closed
      selectedImage = null
      altText = ''
      caption = ''
      uploadError = ''
    }
  })

  async function loadImages() {
    loading = true
    try {
      const res = await api.getImages()
      images = res.data
    } catch (e) {
      uploadError = String(e)
    } finally {
      loading = false
    }
  }

  function defaultAltFor(filename: string) {
    return filename.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ')
  }

  function selectImage(img: AdminImage) {
    if (!enableInsertDetails) {
      onselect(img.url)
      onclose()
      return
    }
    selectedImage = img
    if (!altText) altText = defaultAltFor(img.filename)
  }

  function insertSelectedImage() {
    if (!selectedImage) return
    onselect(selectedImage.url, { altText: altText.trim(), caption: caption.trim() })
    onclose()
  }

  async function handleUpload(e: Event) {
    const input = e.target as HTMLInputElement
    const files = input.files
    if (!files?.length) return
    uploadError = ''
    uploading = true
    try {
      for (const file of Array.from(files)) {
        const img = await api.uploadImage(file)
        images = [img, ...images]
        if (enableInsertDetails) {
          selectedImage = img
          altText = defaultAltFor(file.name)
          caption = ''
        }
      }
    } catch (e) {
      uploadError = e instanceof Error ? e.message : 'Upload failed. Try again.'
    } finally {
      uploading = false
      input.value = ''
    }
  }

  async function handleDelete(img: AdminImage, e: MouseEvent) {
    e.stopPropagation()
    if (!confirm(`Delete "${img.filename}"?`)) return
    try {
      await api.deleteImage(img.id)
      images = images.filter((x) => x.id !== img.id)
      if (selectedImage?.id === img.id) {
        selectedImage = null
        altText = ''
        caption = ''
      }
    } catch (e) {
      uploadError = String(e)
    }
  }
</script>

{#if open}
  <div
    role="dialog"
    aria-modal="true"
    aria-label={enableInsertDetails ? 'Insert image' : 'Image gallery'}
    tabindex="-1"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
    onmousedown={(e) => {
      if (e.target === e.currentTarget) onclose()
    }}
    onkeydown={(e) => {
      if (e.key === 'Escape') onclose()
    }}
  >
    <div
      class="flex max-h-[85vh] w-full max-w-5xl flex-col border border-black/20 bg-[#f0f0f0] dark:border-white/20 dark:bg-[#111]"
    >
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-black/10 px-4 py-3 dark:border-white/10">
        <h2 class="text-sm font-black tracking-tight uppercase dark:text-white">
          {enableInsertDetails ? 'Insert Image' : 'Image Gallery'}
        </h2>
        <button
          bind:this={closeBtnRef}
          type="button"
          onclick={onclose}
          aria-label="Close image gallery"
          class="text-black/40 transition-colors hover:text-black dark:text-white/40 dark:hover:text-white"
        >
          <X size={16} />
        </button>
      </div>

      <!-- Upload bar -->
      <div class="flex flex-wrap items-center gap-3 border-b border-black/10 px-4 py-3 dark:border-white/10">
        <label class="flex cursor-pointer items-center gap-2 bg-black px-3 py-1.5 text-xs font-bold tracking-wide text-white uppercase transition-colors hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80">
          <Upload size={12} />
          {uploading ? 'Uploading…' : 'Upload'}
          <input
            type="file"
            multiple
            accept="image/*"
            class="hidden"
            disabled={uploading}
            onchange={handleUpload}
          />
        </label>
        <span class="font-mono text-[10px] tracking-widest text-black/30 uppercase dark:text-white/30">
          {enableInsertDetails ? 'Select an image, then add details' : 'Click an image to select it'}
        </span>
      </div>

      {#if uploadError}
        <div class="border-b border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-700 dark:text-red-300">
          {uploadError}
        </div>
      {/if}

      <div class={enableInsertDetails ? 'grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(0,1fr)_320px]' : 'min-h-0 flex-1'}>
        <!-- Grid -->
        <div class="min-h-0 overflow-y-auto p-4">
          {#if loading}
            <p class="font-mono text-xs tracking-widest text-black/40 uppercase dark:text-white/40">Loading…</p>
          {:else if images.length === 0}
            <p class="font-mono text-xs tracking-widest text-black/40 uppercase dark:text-white/40">No images yet.</p>
          {:else}
            <div class="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
              {#each images as img (img.id)}
                {@const selected = selectedImage?.id === img.id}
                <div class="group relative aspect-square">
                  <button
                    type="button"
                    onclick={() => selectImage(img)}
                    class={[
                      'block h-full w-full overflow-hidden border transition-colors',
                      selected
                        ? 'border-black ring-2 ring-black/30 dark:border-white dark:ring-white/30'
                        : 'border-black/10 hover:border-black/40 dark:border-white/10 dark:hover:border-white/40',
                    ].join(' ')}
                    aria-label={`Select ${img.filename}`}
                  >
                    <img src={img.url} alt={img.filename} class="h-full w-full object-cover" loading="lazy" />
                  </button>
                  {#if selected}
                    <div class="absolute top-1 left-1 bg-black p-1 text-white dark:bg-white dark:text-black">
                      <Check size={11} />
                    </div>
                  {/if}
                  <button
                    type="button"
                    onclick={(e) => handleDelete(img, e)}
                    class="absolute top-1 right-1 bg-black/70 p-1 text-white/50 opacity-0 transition-all group-hover:opacity-100 hover:text-red-400"
                    aria-label={`Delete ${img.filename}`}
                    title="Delete"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              {/each}
            </div>
          {/if}
        </div>

        {#if enableInsertDetails}
          <div class="flex min-h-0 flex-col border-t border-black/10 p-4 dark:border-white/10 md:border-t-0 md:border-l">
            <div class="mb-4 flex aspect-video items-center justify-center overflow-hidden border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5">
              {#if selectedImage}
                <img src={selectedImage.url} alt={selectedImage.filename} class="h-full w-full object-contain" />
              {:else}
                <ImageIcon size={28} class="text-black/25 dark:text-white/25" />
              {/if}
            </div>

            <div class="flex min-h-0 flex-1 flex-col gap-3">
              <label class="flex flex-col gap-1">
                <span class="font-mono text-[10px] tracking-widest text-black/40 uppercase dark:text-white/40">Alt text</span>
                <input
                  value={altText}
                  oninput={(e) => (altText = (e.target as HTMLInputElement).value)}
                  placeholder="Describe the image"
                  class="h-9 border border-black/15 bg-transparent px-3 text-sm text-black outline-none transition-colors focus:border-black dark:border-white/15 dark:text-white dark:focus:border-white"
                />
              </label>

              <label class="flex flex-col gap-1">
                <span class="font-mono text-[10px] tracking-widest text-black/40 uppercase dark:text-white/40">Caption</span>
                <textarea
                  value={caption}
                  oninput={(e) => (caption = (e.target as HTMLTextAreaElement).value)}
                  placeholder="Shown below the image when supported"
                  class="min-h-20 resize-none border border-black/15 bg-transparent px-3 py-2 text-sm text-black outline-none transition-colors focus:border-black dark:border-white/15 dark:text-white dark:focus:border-white"
                ></textarea>
              </label>
            </div>

            <div class="mt-4 flex justify-end gap-2 border-t border-black/10 pt-4 dark:border-white/10">
              <button
                type="button"
                onclick={onclose}
                class="px-3 py-2 font-mono text-[10px] tracking-widest text-black/50 uppercase transition-colors hover:text-black dark:text-white/50 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onclick={insertSelectedImage}
                disabled={!selectedImage}
                class="bg-black px-3 py-2 font-mono text-[10px] tracking-widest text-white uppercase transition-colors hover:bg-black/80 disabled:cursor-not-allowed disabled:bg-black/20 disabled:text-black/30 dark:bg-white dark:text-black dark:hover:bg-white/80 dark:disabled:bg-white/20 dark:disabled:text-white/30"
              >
                Insert image
              </button>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
