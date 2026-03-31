import { useState, useRef, useEffect, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import {
  BoldIcon, ItalicIcon, StrikethroughIcon, CodeIcon, Code2Icon,
  Heading1Icon, Heading2Icon, Heading3Icon,
  QuoteIcon, ListIcon, ListOrderedIcon,
  MinusIcon, LinkIcon, ImageIcon, FootprintsIcon,
  BotIcon, SplitIcon, PanelLeftIcon, EyeIcon,
  Undo2Icon, Redo2Icon, Link2Icon, Link2OffIcon,
} from 'lucide-react'

type Mode = 'split' | 'editor' | 'preview'

interface Props {
  textareaRef: RefObject<HTMLTextAreaElement | null>
  mode: Mode
  onModeChange: (m: Mode) => void
  onImageClick: () => void
  syncScroll: boolean
  onSyncScrollChange: (v: boolean) => void
}

function wrap(
  ta: HTMLTextAreaElement,
  before: string,
  after = before,
  placeholder = 'text',
) {
  const { selectionStart: s, selectionEnd: e, value } = ta
  const selected = value.slice(s, e) || placeholder
  const newVal = value.slice(0, s) + before + selected + after + value.slice(e)
  // Use execCommand for undo history (deprecated but still works)
  ta.focus()
  ta.setSelectionRange(s, e)
  document.execCommand('insertText', false, before + selected + after)
  ta.setSelectionRange(s + before.length, s + before.length + selected.length)
}

function insertLine(ta: HTMLTextAreaElement, prefix: string) {
  const { selectionStart: s, value } = ta
  const lineStart = value.lastIndexOf('\n', s - 1) + 1
  ta.focus()
  ta.setSelectionRange(lineStart, lineStart)
  document.execCommand('insertText', false, prefix)
}

function insertBlock(ta: HTMLTextAreaElement, text: string) {
  const { selectionStart: s, value } = ta
  const needsNewline = s > 0 && value[s - 1] !== '\n'
  ta.focus()
  ta.setSelectionRange(s, s)
  document.execCommand('insertText', false, (needsNewline ? '\n' : '') + text)
}

const ADMONITION_TYPES = [
  'note', 'warning', 'danger', 'tip', 'info', 'tldr', 'update', 'definition', 'ai',
] as const

export default function Toolbar({ textareaRef, mode, onModeChange, onImageClick, syncScroll, onSyncScrollChange }: Props) {
  const ta = () => textareaRef.current!

  const [admonitionOpen, setAdmonitionOpen] = useState(false)
  const admonitionBtnRef = useRef<HTMLButtonElement>(null)
  const [admonitionPos, setAdmonitionPos] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (!admonitionOpen) return
    const close = () => setAdmonitionOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [admonitionOpen])

  function openAdmonition(e: React.MouseEvent) {
    e.stopPropagation()
    const rect = admonitionBtnRef.current?.getBoundingClientRect()
    if (!rect) return
    setAdmonitionPos({ top: rect.bottom + 4, left: rect.left })
    setAdmonitionOpen((v) => !v)
  }

  function undo() { ta().focus(); document.execCommand('undo') }
  function redo() { ta().focus(); document.execCommand('redo') }

  function bold()   { wrap(ta(), '**') }
  function italic() { wrap(ta(), '*') }
  function strike() { wrap(ta(), '~~') }
  function code()   { wrap(ta(), '`') }
  function codeBlock() {
    const textarea = ta()
    const { selectionStart: s, selectionEnd: e, value } = textarea
    const selected = value.slice(s, e)
    const needsNewline = s > 0 && value[s - 1] !== '\n'
    const prefix = (needsNewline ? '\n' : '') + '```\n'
    const suffix = '\n```'
    textarea.focus()
    textarea.setSelectionRange(s, e)
    document.execCommand('insertText', false, prefix + selected + suffix)
    if (!selected) {
      const cursorPos = s + prefix.length
      textarea.setSelectionRange(cursorPos, cursorPos)
    }
  }
  function h1()     { insertLine(ta(), '# ') }
  function h2()     { insertLine(ta(), '## ') }
  function h3()     { insertLine(ta(), '### ') }
  function quote()  { insertLine(ta(), '> ') }
  function ul()     { insertLine(ta(), '- ') }
  function ol()     { insertLine(ta(), '1. ') }
  function hr()     { insertBlock(ta(), '\n---\n') }
  function link()   { wrap(ta(), '[', '](url)') }
  function footnote() {
    const textarea = ta()
    const { value, selectionEnd: e } = textarea
    const refs = [...value.matchAll(/\[\^(\d+)\]/g)].map((m) => Number(m[1]))
    const next = refs.length ? Math.max(...refs) + 1 : 1

    // Insert marker after the selected word (or at cursor)
    textarea.focus()
    textarea.setSelectionRange(e, e)
    document.execCommand('insertText', false, `[^${next}]`)

    // Append definition at end of document
    const updated = textarea.value
    const trailing = updated.length > 0 && !updated.endsWith('\n') ? '\n' : ''
    textarea.setSelectionRange(updated.length, updated.length)
    document.execCommand('insertText', false, `${trailing}\n[^${next}]: `)
    // cursor lands right after "[^n]: " ready to type the note
  }
  function admonition(type: string) {
    insertBlock(ta(), `\n:::${type}\n\n:::\n`)
  }

  const Btn = ({
    onClick,
    title,
    children,
    active,
  }: {
    onClick: () => void
    title: string
    children: React.ReactNode
    active?: boolean
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={[
        'flex items-center justify-center w-7 h-7 rounded transition-colors',
        active
          ? 'bg-white/20 text-white'
          : 'text-white/50 hover:text-white hover:bg-white/10',
      ].join(' ')}
    >
      {children}
    </button>
  )

  const Sep = () => <div className="w-px h-4 bg-white/15 mx-0.5" />

  return (
    <div className="flex items-center gap-0.5 px-3 h-10 border-b border-white/10 bg-[#111] overflow-x-auto">
      {/* Undo / Redo */}
      <Btn onClick={undo} title="Undo (Ctrl+Z)"><Undo2Icon size={13} /></Btn>
      <Btn onClick={redo} title="Redo (Ctrl+Y)"><Redo2Icon size={13} /></Btn>
      <Sep />

      {/* Inline formatting */}
      <Btn onClick={bold}      title="Bold (Ctrl+B)">    <BoldIcon size={13} /> </Btn>
      <Btn onClick={italic}    title="Italic (Ctrl+I)">  <ItalicIcon size={13} /> </Btn>
      <Btn onClick={strike}    title="Strikethrough">    <StrikethroughIcon size={13} /> </Btn>
      <Btn onClick={code}      title="Inline code">      <CodeIcon size={13} /> </Btn>
      <Btn onClick={codeBlock} title="Code block">       <Code2Icon size={13} /></Btn>
      <Sep />

      {/* Headings */}
      <Btn onClick={h1} title="H1"><Heading1Icon size={13} /></Btn>
      <Btn onClick={h2} title="H2"><Heading2Icon size={13} /></Btn>
      <Btn onClick={h3} title="H3"><Heading3Icon size={13} /></Btn>
      <Sep />

      {/* Blocks */}
      <Btn onClick={quote} title="Blockquote">    <QuoteIcon size={13} /> </Btn>
      <Btn onClick={ul}    title="Bullet list">   <ListIcon size={13} /> </Btn>
      <Btn onClick={ol}    title="Numbered list"> <ListOrderedIcon size={13} /> </Btn>
      <Btn onClick={hr}    title="Horizontal rule"><MinusIcon size={13} /> </Btn>
      <Sep />

      {/* Links & images */}
      <Btn onClick={link}         title="Link (Ctrl+K)">     <LinkIcon size={13} /></Btn>
      <Btn onClick={onImageClick} title="Image">             <ImageIcon size={13} /></Btn>
      <Btn onClick={footnote}     title="Footnote/sidenote"> <FootprintsIcon size={13} /></Btn>
      <Sep />

      {/* Admonition picker */}
      <button
        ref={admonitionBtnRef}
        type="button"
        title="Admonition"
        onClick={openAdmonition}
        className={[
          'flex items-center gap-1 px-2 h-7 font-mono text-[10px] uppercase tracking-widest rounded transition-colors',
          admonitionOpen ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white hover:bg-white/10',
        ].join(' ')}
      >
        <BotIcon size={13} />
        <span>Admonition</span>
      </button>
      {admonitionOpen && createPortal(
        <div
          className="fixed flex flex-col bg-[#1a1a1a] border border-white/20 min-w-max z-[9999] shadow-xl"
          style={{ top: admonitionPos.top, left: admonitionPos.left }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {ADMONITION_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { admonition(t); setAdmonitionOpen(false) }}
              className="px-3 py-1.5 text-left font-mono text-[11px] text-white/60 hover:bg-white/10 hover:text-white transition-colors"
            >
              :::{t}
            </button>
          ))}
        </div>,
        document.body,
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Sync scroll (split mode only) */}
      {mode === 'split' && (
        <>
          <Btn
            onClick={() => onSyncScrollChange(!syncScroll)}
            title={syncScroll ? 'Sync scroll: on' : 'Sync scroll: off'}
            active={syncScroll}
          >
            {syncScroll ? <Link2Icon size={13} /> : <Link2OffIcon size={13} />}
          </Btn>
          <Sep />
        </>
      )}

      {/* View mode */}
      <Btn onClick={() => onModeChange('editor')}  title="Editor only"  active={mode === 'editor'}>  <PanelLeftIcon size={13} /> </Btn>
      <Btn onClick={() => onModeChange('split')}   title="Split view"   active={mode === 'split'}>   <SplitIcon size={13} /> </Btn>
      <Btn onClick={() => onModeChange('preview')} title="Preview only" active={mode === 'preview'}>  <EyeIcon size={13} /> </Btn>
    </div>
  )
}
