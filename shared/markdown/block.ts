/**
 * Block-level tokenizer — scans markdown line by line and produces BlockToken[].
 */

import type {
  BlockToken,
  HeadingToken,
  ListItemToken,
  AdmonitionType,
} from './types.js';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function stripInlineMarkers(text: string): string {
  return text.replace(/[*_`~\[\]]/g, '');
}

// ─── List parsing ────────────────────────────────────────────────────────────

function parseListItems(lines: string[], ordered: boolean): ListItemToken[] {
  const items: ListItemToken[] = [];
  let current: { text: string; subLines: string[] } | null = null;
  const bulletRe = ordered ? /^\d+\.\s+(.*)/ : /^[-*+]\s+(.*)/;
  const subBulletRe = ordered ? /^\s{2,}\d+\.\s+(.*)/ : /^\s{2,}[-*+]\s+(.*)/;

  for (const line of lines) {
    const subMatch = line.match(subBulletRe);
    const topMatch = !subMatch && line.match(bulletRe);

    if (topMatch) {
      if (current) items.push(buildListItem(current.text, current.subLines, ordered));
      current = { text: topMatch[1], subLines: [] };
    } else if (subMatch && current) {
      current.subLines.push(line.trimStart());
    } else if (current && line.trim()) {
      current.text += ' ' + line.trim();
    }
  }

  if (current) items.push(buildListItem(current.text, current.subLines, ordered));
  return items;
}

function buildListItem(text: string, subLines: string[], ordered: boolean): ListItemToken {
  return {
    type: 'list_item',
    text,
    children: subLines.length ? parseListItems(subLines, ordered) : [],
  };
}

// ─── Table parsing ───────────────────────────────────────────────────────────

function parseTableRow(line: string): string[] {
  return line
    .split('|')
    .slice(1, -1)
    .map((c) => c.trim());
}

function parseTableAlign(cells: string[]): Array<'left' | 'center' | 'right' | null> {
  return cells.map((c) => {
    if (/^:-+:$/.test(c)) return 'center';
    if (/^-+:$/.test(c)) return 'right';
    if (/^:-+$/.test(c)) return 'left';
    return null;
  });
}

// ─── Main tokenizer ───────────────────────────────────────────────────────────

export function tokenizeBlocks(markdown: string): BlockToken[] {
  const lines = markdown.split('\n');
  const tokens: BlockToken[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) { i++; continue; }

    // Heading
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)/);
    if (headingMatch) {
      const level = headingMatch[1].length as HeadingToken['level'];
      const text = headingMatch[2].trim();
      tokens.push({ type: 'heading', level, text, id: slugify(stripInlineMarkers(text)) });
      i++;
      continue;
    }

    // HR
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      tokens.push({ type: 'hr' });
      i++;
      continue;
    }

    // Fenced code block
    const fenceMatch = trimmed.match(/^```(\w*)/);
    if (fenceMatch) {
      const lang = fenceMatch[1] || '';
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // closing ```
      tokens.push({ type: 'code', lang, text: codeLines.join('\n') });
      continue;
    }

    // Admonition :::type
    const admonitionMatch = trimmed.match(/^:::(\w+)/);
    if (admonitionMatch) {
      const kind = admonitionMatch[1] as AdmonitionType;
      const innerLines: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim() !== ':::') {
        innerLines.push(lines[i]);
        i++;
      }
      i++; // closing :::
      const children = tokenizeBlocks(innerLines.join('\n'));
      tokens.push({ type: 'admonition', kind, children });
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      const children = tokenizeBlocks(quoteLines.join('\n'));
      tokens.push({ type: 'blockquote', children });
      continue;
    }

    // Footnote definition [^id]: text
    const fnMatch = trimmed.match(/^\[\^([^\]]+)\]:\s*(.*)/);
    if (fnMatch) {
      tokens.push({ type: 'footnote_def', id: fnMatch[1], text: fnMatch[2] });
      i++;
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(trimmed)) {
      const listLines: string[] = [];
      while (
        i < lines.length &&
        (lines[i].trim() === '' ? false : /^\d+\.\s|^\s{2,}/.test(lines[i]))
      ) {
        listLines.push(lines[i]);
        i++;
      }
      const items = parseListItems(listLines, true);
      tokens.push({ type: 'list', ordered: true, items });
      continue;
    }

    // Unordered list
    if (/^[-*+]\s/.test(trimmed)) {
      const listLines: string[] = [];
      while (
        i < lines.length &&
        (lines[i].trim() === '' ? false : /^[-*+]\s|^\s{2,}/.test(lines[i]))
      ) {
        listLines.push(lines[i]);
        i++;
      }
      const items = parseListItems(listLines, false);
      tokens.push({ type: 'list', ordered: false, items });
      continue;
    }

    // Table (header | separator | rows)
    if (trimmed.includes('|') && i + 1 < lines.length && /^\|?[\s:|-]+\|/.test(lines[i + 1])) {
      const headers = parseTableRow(trimmed);
      i++;
      const align = parseTableAlign(parseTableRow(lines[i]));
      i++;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().includes('|')) {
        rows.push(parseTableRow(lines[i]));
        i++;
      }
      tokens.push({ type: 'table', headers, align, rows });
      continue;
    }

    // Paragraph — collect until blank line or block-level element
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].trim().match(/^#{1,6}\s/) &&
      !lines[i].trim().match(/^```/) &&
      !lines[i].trim().match(/^:::/) &&
      !lines[i].trim().startsWith('>') &&
      !lines[i].trim().match(/^[-*+]\s/) &&
      !lines[i].trim().match(/^\d+\.\s/) &&
      !lines[i].trim().match(/^\[\^[^\]]+\]:/) &&
      !/^(-{3,}|\*{3,}|_{3,})$/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length) {
      tokens.push({ type: 'paragraph', text: paraLines.join('\n') });
    }
  }

  return tokens;
}
