/**
 * Entry point — parse(md) → { html, toc, sidenotes }
 */

import { tokenizeBlocks } from './block.js'
import { renderBlocks } from './renderer.js'
import type { ParseResult } from './types.js'
import type { InlineContext } from './inline.js'

export function parse(md: string, ctx?: InlineContext): ParseResult {
  const tokens = tokenizeBlocks(md)
  const { html, toc, sidenotes } = renderBlocks(tokens, ctx)
  return { html, toc, sidenotes }
}

export type { ParseResult, TocItem, Sidenote } from './types.js'
export type { InlineContext } from './inline.js'
