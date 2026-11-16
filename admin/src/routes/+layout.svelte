<script lang="ts">
  import '@fontsource/plus-jakarta-sans/400.css'
  import '@fontsource/plus-jakarta-sans/500.css'
  import '../app.css'
  import type { Snippet } from 'svelte'

  let { children }: { children: Snippet } = $props()
</script>

{@render children()}
