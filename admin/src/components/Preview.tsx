import { useEffect, useState } from 'react'
import { parse } from '@portfolio/shared/markdown/parser.js'
import type { PreviewProps } from '../lib/types.ts'

export default function Preview({ markdown }: PreviewProps) {
  const [html, setHtml] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const result = parse(markdown)
        setHtml(result.html)
      } catch {
        setHtml('<p style="color:#f87171">Parse error</p>')
      }
    }, 150)
    return () => clearTimeout(timer)
  }, [markdown])

  return (
    <div
      className="preview-content"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
