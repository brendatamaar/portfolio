<script lang="ts">
  import type { GlossaryEntry } from '$lib/types'

  interface Props {
    lang: 'en' | 'id'
    entries: GlossaryEntry[]
    rawMode: boolean
    rawText: string
    onadd: () => void
    onremove: (idx: number) => void
    onupdate: (idx: number, field: keyof GlossaryEntry, val: string) => void
    ontoggleraw: () => void
    onrawchange: (val: string) => void
  }

  let { lang, entries, rawMode, rawText, onadd, onremove, onupdate, ontoggleraw, onrawchange }: Props = $props()

  const toggleBtnClass = (active: boolean) =>
    [
      'px-2.5 py-1 text-[11px] transition-colors',
      active
        ? 'bg-ink text-page'
        : 'text-quiet hover:text-ink/40 dark:hover:text-ink',
    ].join(' ')
</script>

<div class="flex min-h-0 w-full flex-col">
  <div class="flex shrink-0 items-center justify-between border-b border-ring px-4 py-2 dark:border-white/10">
    <h3 class="text-[13px] dark:text-white">
      Glossary — {lang.toUpperCase()}
    </h3>
    <div class="flex items-center gap-2">
      <div class="flex border border-ring">
        <button type="button" onclick={rawMode ? ontoggleraw : undefined} class={toggleBtnClass(!rawMode)}>Form</button>
        <button type="button" onclick={!rawMode ? ontoggleraw : undefined} class={toggleBtnClass(rawMode)}>Raw</button>
      </div>
      {#if !rawMode}
        <button
          onclick={onadd}
          class="rounded-full bg-ink px-3.5 py-1.5 text-[13px] font-medium text-page transition-opacity hover:opacity-80"
        >+ Add Entry</button>
      {/if}
    </div>
  </div>

  {#if rawMode}
    <div class="flex min-h-0 flex-1 flex-col p-3">
      <p class="mb-2 shrink-0 font-mono text-[11px] text-quiet">
        Each entry: <code class="bg-raised px-1 dark:bg-white/5">key :: Term Name</code> on first line, definition below. Blank line between entries. Markdown supported.
      </p>
      <textarea
        value={rawText}
        oninput={(e) => onrawchange((e.target as HTMLTextAreaElement).value)}
        spellcheck="false"
        placeholder={"my-term :: My Term Name\nDefinition supporting **markdown**.\n\nanother-term :: Another Term\nAnother definition."}
        class="editor-textarea min-h-0 flex-1"
      ></textarea>
      <button
        type="button"
        onclick={ontoggleraw}
        class="mt-2 shrink-0 self-start rounded-full bg-ink px-3.5 py-1.5 text-[13px] font-medium text-page transition-opacity hover:opacity-80"
      >Apply & switch to Form</button>
    </div>
  {:else}
    <div class="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
      {#each entries as entry, idx}
        <div class="mb-4 border border-ring bg-page p-4 dark:border-white/10 dark:bg-raised">
          <div class="mb-2 flex items-center justify-between">
            <span class="font-mono text-[11px] text-quiet">Entry {idx + 1}</span>
            <button onclick={() => onremove(idx)} class="font-mono text-[11px] text-red-600 hover:underline">Remove</button>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <span class="mb-1 block text-[12px] text-quiet dark:text-quiet">Key</span>
              <input
                value={entry.key}
                oninput={(e) => onupdate(idx, 'key', (e.target as HTMLInputElement).value)}
                class="w-full border-b border-ring bg-transparent pb-1 font-mono text-xs text-body outline-none focus:border-quiet dark:border-white/15 dark:text-white/70 dark:focus:border-quiet"
              />
            </div>
            <div>
              <span class="mb-1 block text-[12px] text-quiet dark:text-quiet">Term</span>
              <input
                value={entry.term}
                oninput={(e) => onupdate(idx, 'term', (e.target as HTMLInputElement).value)}
                class="w-full border-b border-ring bg-transparent pb-1 font-mono text-xs text-body outline-none focus:border-quiet dark:border-white/15 dark:text-white/70 dark:focus:border-quiet"
              />
            </div>
          </div>
          <div class="mt-3">
            <span class="mb-1 block text-[12px] text-quiet dark:text-quiet">Definition</span>
            <textarea
              value={entry.definition}
              oninput={(e) => onupdate(idx, 'definition', (e.target as HTMLTextAreaElement).value)}
              rows="3"
              class="w-full resize-none border border-ring bg-transparent p-2 font-mono text-xs text-body outline-none focus:border-leader dark:border-white/10 dark:text-white/70 dark:focus:border-quiet"
            ></textarea>
          </div>
        </div>
      {/each}
      {#if entries.length === 0}
        <p class="font-mono text-xs text-quiet">No glossary entries. Add one or switch to Raw mode.</p>
      {/if}
    </div>
  {/if}
</div>
