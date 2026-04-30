import { useEffect, useState } from 'react'
import { parse } from '@portfolio/shared/markdown/parser.js'
import type { PreviewProps } from '../types/ui'
import { PREVIEW_DEBOUNCE_MS } from '../lib/constants.ts'

export default function Preview({ markdown, fullWidth = false }: PreviewProps) {
  const [html, setHtml] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const result = parse(markdown)
        setHtml(result.html)
      } catch {
        setHtml('<p style="color:#f87171">Parse error</p>')
      }
    }, PREVIEW_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [markdown])

  return (
    <div
      className={['preview-content', fullWidth && 'preview-content-full']
        .filter(Boolean)
        .join(' ')}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
