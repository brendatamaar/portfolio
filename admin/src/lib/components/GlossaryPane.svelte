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
      'px-2.5 py-1 font-mono text-[9px] tracking-widest uppercase transition-colors',
      active
        ? 'bg-black text-white dark:bg-white dark:text-black'
        : 'text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white',
    ].join(' ')
</script>

<div class="flex min-h-0 w-full flex-col">
  <div class="flex shrink-0 items-center justify-between border-b border-black/10 px-4 py-2 dark:border-white/10">
    <h3 class="font-mono text-[11px] tracking-widest uppercase dark:text-white">
      Glossary — {lang.toUpperCase()}
    </h3>
    <div class="flex items-center gap-2">
      <div class="flex border border-black/10 dark:border-white/10">
        <button type="button" onclick={rawMode ? ontoggleraw : undefined} class={toggleBtnClass(!rawMode)}>Form</button>
        <button type="button" onclick={!rawMode ? ontoggleraw : undefined} class={toggleBtnClass(rawMode)}>Raw</button>
      </div>
      {#if !rawMode}
        <button
          onclick={onadd}
          class="bg-black px-3 py-1 text-xs font-bold tracking-wide text-white uppercase hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80"
        >+ Add Entry</button>
      {/if}
    </div>
  </div>

  {#if rawMode}
    <div class="flex min-h-0 flex-1 flex-col p-3">
      <p class="mb-2 shrink-0 font-mono text-[10px] text-black/30 dark:text-white/30">
        Each entry: <code class="bg-black/5 px-1 dark:bg-white/5">key :: Term Name</code> on first line, definition below. Blank line between entries. Markdown supported.
      </p>
      <textarea
        value={rawText}
        oninput={(e) => onrawchange((e.target as HTMLTextAreaElement).value)}
        spellcheck="false"
        placeholder={"my-term :: My Term Name\nDefinition supporting **markdown**.\n\nanother-term :: Another Term\nAnother definition."}
        class="editor-textarea min-h-0 flex-1 resize-none border border-black/10 bg-transparent p-3 font-mono text-sm leading-relaxed text-black outline-none focus:border-black/30 dark:border-white/10 dark:text-white dark:focus:border-white/30"
      ></textarea>
      <button
        type="button"
        onclick={ontoggleraw}
        class="mt-2 shrink-0 self-start bg-black px-3 py-1.5 text-xs font-bold tracking-wide text-white uppercase hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80"
      >Apply & switch to Form</button>
    </div>
  {:else}
    <div class="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
      {#each entries as entry, idx}
        <div class="mb-4 border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-[#111]">
          <div class="mb-2 flex items-center justify-between">
            <span class="font-mono text-[10px] text-black/40 dark:text-white/40">Entry {idx + 1}</span>
            <button onclick={() => onremove(idx)} class="font-mono text-[10px] text-red-600 hover:underline">Remove</button>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <span class="mb-1 block font-mono text-[10px] tracking-widest text-black/30 uppercase dark:text-white/30">Key</span>
              <input
                value={entry.key}
                oninput={(e) => onupdate(idx, 'key', (e.target as HTMLInputElement).value)}
                class="w-full border-b border-black/15 bg-transparent pb-1 font-mono text-xs text-black/70 outline-none focus:border-black/40 dark:border-white/15 dark:text-white/70 dark:focus:border-white/40"
              />
            </div>
            <div>
              <span class="mb-1 block font-mono text-[10px] tracking-widest text-black/30 uppercase dark:text-white/30">Term</span>
              <input
                value={entry.term}
                oninput={(e) => onupdate(idx, 'term', (e.target as HTMLInputElement).value)}
                class="w-full border-b border-black/15 bg-transparent pb-1 font-mono text-xs text-black/70 outline-none focus:border-black/40 dark:border-white/15 dark:text-white/70 dark:focus:border-white/40"
              />
            </div>
          </div>
          <div class="mt-3">
            <span class="mb-1 block font-mono text-[10px] tracking-widest text-black/30 uppercase dark:text-white/30">Definition</span>
            <textarea
              value={entry.definition}
              oninput={(e) => onupdate(idx, 'definition', (e.target as HTMLTextAreaElement).value)}
              rows="3"
              class="w-full resize-none border border-black/10 bg-transparent p-2 font-mono text-xs text-black/70 outline-none focus:border-black/30 dark:border-white/10 dark:text-white/70 dark:focus:border-white/30"
            ></textarea>
          </div>
        </div>
      {/each}
      {#if entries.length === 0}
        <p class="font-mono text-xs text-black/40 dark:text-white/40">No glossary entries. Add one or switch to Raw mode.</p>
      {/if}
    </div>
  {/if}
</div>
