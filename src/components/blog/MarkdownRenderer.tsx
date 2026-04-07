import { useRef, useEffect, useState } from 'react'
import type { MarkdownRendererProps } from '../../lib/types.js'
import Sidenotes from './Sidenotes.js'
import TOC from './TOC.js'

export default function MarkdownRenderer({
  html,
  toc,
  sidenotes,
}: MarkdownRendererProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [zoomedImg, setZoomedImg] = useState<string | null>(null)

  // Inject a "copy" button into every code block after the HTML mounts.
  useEffect(() => {
    const pres = contentRef.current?.querySelectorAll('pre')
    pres?.forEach((pre) => {
      if (pre.querySelector('.copy-btn')) return
      const btn = document.createElement('button')
      btn.className =
        'copy-btn font-mono text-[10px] uppercase tracking-widest border-2 border-black px-2 py-0.5 bg-white text-black hover:bg-[#FFE600] transition-colors absolute top-2 right-2 shadow-[2px_2px_0px_#000]'
      btn.textContent = 'copy'
      btn.onclick = async () => {
        await navigator.clipboard.writeText(
          pre.querySelector('code')?.textContent ?? '',
        )
        btn.textContent = 'copied!'
        setTimeout(() => {
          btn.textContent = 'copy'
        }, 2000)
      }
      pre.style.position = 'relative'
      pre.appendChild(btn)
    })
  }, [html])

  // Footnote ref click — on desktop, highlight the sidenote instead of jumping to #fn-*
  useEffect(() => {
    const content = contentRef.current
    if (!content) return

    const handleClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest(
        'a[data-sidenote-id]',
      ) as HTMLAnchorElement | null
      if (!link || window.innerWidth < 1024) return

      e.preventDefault()
      const id = link.dataset.sidenoteId
      if (!id) return

      const noteEl = document.querySelector(
        `[data-sidenote="${id}"]`,
      ) as HTMLElement | null
      if (!noteEl) return

      noteEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' })

      // Restart animation if already running
      noteEl.classList.remove('sidenote-highlighted')
      void noteEl.offsetWidth
      noteEl.classList.add('sidenote-highlighted')
      noteEl.addEventListener(
        'animationend',
        () => noteEl.classList.remove('sidenote-highlighted'),
        { once: true },
      )
    }

    content.addEventListener('click', handleClick)
    return () => content.removeEventListener('click', handleClick)
  }, [html])

  // Image zoom — click any <img> outside a code block to enlarge it.
  useEffect(() => {
    const imgs =
      contentRef.current?.querySelectorAll<HTMLImageElement>(
        'figure img, p img',
      )
    imgs?.forEach((img) => {
      img.style.cursor = 'zoom-in'
      img.onclick = () => setZoomedImg(img.src)
    })
    return () => {
      imgs?.forEach((img) => {
        img.onclick = null
      })
    }
  }, [html])

  return (
    <>
      <div className="blog-layout flex w-full items-start gap-10">
        {/* Left: margin notes (desktop only, positioned by Sidenotes.tsx) */}
        <Sidenotes sidenotes={sidenotes} contentRef={contentRef} />

        {/* Center: article content — HTML is trusted (server-generated from our own parser) */}
        <div
          ref={contentRef}
          className="blog-content prose-custom min-w-0 flex-1"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {/* Right: sticky scrollspy TOC (desktop only) */}
        <TOC toc={toc} />
      </div>

      {/* Image zoom overlay */}
      {zoomedImg && (
        <div
          className="fixed inset-0 z-[100] flex cursor-zoom-out items-center justify-center bg-black/90"
          onClick={() => setZoomedImg(null)}
        >
          <img
            src={zoomedImg}
            alt="Zoomed"
            className="max-h-[90vh] max-w-[90vw] border-2 border-white object-contain shadow-[8px_8px_0px_#fff]"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute top-5 right-6 font-mono text-sm tracking-widest text-white uppercase transition-colors hover:text-[#FFE600]"
            onClick={() => setZoomedImg(null)}
          >
            [close]
          </button>
        </div>
      )}
    </>
  )
}
