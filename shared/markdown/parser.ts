/**
 * Entry point — parse(md) → { html, toc, sidenotes }
 */

import { tokenizeBlocks } from './block.js'
import { renderBlocks } from './renderer.js'
import type { ParseResult } from './types.js'

export function parse(md: string): ParseResult {
  const tokens = tokenizeBlocks(md)
  const { html, toc, sidenotes, bibliography } = renderBlocks(tokens)
  return { html, toc, sidenotes, bibliography }
}

export type {
  ParseResult,
  TocItem,
  Sidenote,
  BibliographyEntry,
} from './types.js'
