<script lang="ts">
  import type { AlbumItem, AlbumSearchResult } from '$lib/types'
  import { api } from '$lib/api'
  import CollectionTabBase from './CollectionTabBase.svelte'

  let { initialItems }: { initialItems: AlbumItem[] } = $props()

  let artist = $state('')

  function onResultSelect(r: AlbumSearchResult) {
    artist = r.artist
  }

  function afterCreate() {
    artist = ''
  }

  function createFn(
    title: string,
    coverUrl: string | null | undefined,
    year: number | null | undefined,
  ) {
    return api.createAlbum({ title, artist: artist.trim(), coverUrl, year })
  }

  let canSubmit = $derived(artist.trim().length > 0)
</script>

<CollectionTabBase
  {initialItems}
  searchFn={api.searchAlbums}
  {createFn}
  featureFn={api.featureAlbum}
  deleteFn={api.deleteAlbum}
  onAfterCreate={afterCreate}
  {canSubmit}
  searchPlaceholder="Search album title..."
  emptyText="No albums yet."
  coverClass="h-10 w-10"
  {onResultSelect}
>
  {#snippet extraFormFields()}
    <div class="flex flex-col gap-1">
      <label class="text-[12px] text-quiet dark:text-quiet">
        Artist
      </label>
      <input
        value={artist}
        oninput={(e) => (artist = (e.target as HTMLInputElement).value)}
        placeholder="Artist name"
        class="border border-leader bg-transparent px-3 py-1.5 text-sm focus:border-quiet focus:outline-none dark:border-white/20 dark:focus:border-quiet"
      />
    </div>
  {/snippet}

  {#snippet dropdownMeta(r: AlbumSearchResult)}
    {r.artist || '—'}
  {/snippet}

  {#snippet itemMeta(item: AlbumItem)}
    {item.artist}
  {/snippet}
</CollectionTabBase>
