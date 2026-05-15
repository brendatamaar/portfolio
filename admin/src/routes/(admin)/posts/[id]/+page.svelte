<script lang="ts">
  import Editor from '$lib/components/Editor.svelte'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()
</script>

<svelte:head>
  <title>{data.post?.title ?? 'Edit Post'} — Admin</title>
</svelte:head>

<Editor post={data.post} allTags={data.allTags} />
