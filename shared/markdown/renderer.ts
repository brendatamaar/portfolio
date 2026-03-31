/**
 * Renderer — BlockToken[] → HTML string.
 */

import type {
  BlockToken,
  ListItemToken,
  AdmonitionType,
  Sidenote,
  TocItem,
} from './types.js';
import { parseInline } from './inline.js';
import { highlight } from './highlight.js';

// ─── Admonition config ────────────────────────────────────────────────────────

const ADMONITION_CONFIG: Record<
  AdmonitionType,
  { icon: string; label: string; colorClass: string }
> = {
  note: { icon: 'ℹ', label: 'Note', colorClass: 'admonition-note' },
  warning: { icon: '⚠', label: 'Warning', colorClass: 'admonition-warning' },
  danger: { icon: '🔴', label: 'Danger', colorClass: 'admonition-danger' },
  tip: { icon: '💡', label: 'Tip', colorClass: 'admonition-tip' },
  info: { icon: '📘', label: 'Info', colorClass: 'admonition-info' },
  tldr: { icon: '⚡', label: 'TL;DR', colorClass: 'admonition-tldr' },
  update: { icon: '📅', label: 'Update', colorClass: 'admonition-update' },
  definition: { icon: '📖', label: 'Definition', colorClass: 'admonition-definition' },
  ai: { icon: '🤖', label: 'Ask AI', colorClass: 'admonition-ai' },
};

// ─── List rendering ───────────────────────────────────────────────────────────

function renderListItem(item: ListItemToken, ordered: boolean): string {
  let html = `<li>${parseInline(item.text)}`;
  if (item.children.length) {
    const tag = ordered ? 'ol' : 'ul';
    html += `<${tag}>${item.children.map((c) => renderListItem(c, ordered)).join('')}</${tag}>`;
  }
  html += '</li>';
  return html;
}

// ─── Main renderer ────────────────────────────────────────────────────────────

export interface RenderResult {
  html: string;
  toc: TocItem[];
  sidenotes: Sidenote[];
}

export function renderBlocks(tokens: BlockToken[]): RenderResult {
  const toc: TocItem[] = [];
  const sidenotes: Sidenote[] = [];
  const sidenoteMap = new Map<string, string>(); // id → html (from footnote_def tokens)
  let html = '';

  // First pass: collect footnote definitions
  for (const token of tokens) {
    if (token.type === 'footnote_def') {
      sidenoteMap.set(token.id, parseInline(token.text));
    }
  }

  // Second pass: render
  for (const token of tokens) {
    switch (token.type) {
      case 'heading': {
        toc.push({ id: token.id, text: token.text, level: token.level });
        html += `<h${token.level} id="${token.id}">${parseInline(token.text)}</h${token.level}>\n`;
        break;
      }

      case 'paragraph': {
        // Split on hard line breaks (two spaces at end or \n in source)
        const lines = token.text.split('\n');
        const inner = lines.map((l) => parseInline(l.trimEnd())).join('<br>');
        html += `<p>${inner}</p>\n`;
        break;
      }

      case 'code': {
        const highlighted = highlight(token.text, token.lang);
        const langLabel = token.lang
          ? `<span class="code-lang">${token.lang}</span>`
          : '';
        html += `<div class="code-block">${langLabel}<pre><code class="language-${token.lang}">${highlighted}</code></pre></div>\n`;
        break;
      }

      case 'blockquote': {
        const inner = renderBlocks(token.children);
        // Merge child toc/sidenotes up
        toc.push(...inner.toc);
        sidenotes.push(...inner.sidenotes);
        html += `<blockquote>${inner.html}</blockquote>\n`;
        break;
      }

      case 'list': {
        const tag = token.ordered ? 'ol' : 'ul';
        const items = token.items.map((item) => renderListItem(item, token.ordered)).join('');
        html += `<${tag}>${items}</${tag}>\n`;
        break;
      }

      case 'hr': {
        html += `<hr>\n`;
        break;
      }

      case 'table': {
        const thead = token.headers
          .map((h, idx) => {
            const align = token.align[idx];
            const style = align ? ` style="text-align:${align}"` : '';
            return `<th${style}>${parseInline(h)}</th>`;
          })
          .join('');
        const tbody = token.rows
          .map((row) => {
            const cells = row
              .map((cell, idx) => {
                const align = token.align[idx];
                const style = align ? ` style="text-align:${align}"` : '';
                return `<td${style}>${parseInline(cell)}</td>`;
              })
              .join('');
            return `<tr>${cells}</tr>`;
          })
          .join('');
        html += `<table><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>\n`;
        break;
      }

      case 'admonition': {
        const cfg = ADMONITION_CONFIG[token.kind] ?? ADMONITION_CONFIG.note;

        if (token.kind === 'ai') {
          // Render inner content as raw text (for copy button)
          const rawText = token.children
            .map((c) => (c.type === 'paragraph' ? c.text : ''))
            .join('\n')
            .trim();
          const inner = renderBlocks(token.children);
          toc.push(...inner.toc);
          sidenotes.push(...inner.sidenotes);
          html += `<div class="admonition ${cfg.colorClass}" data-ai-prompt="${rawText.replace(/"/g, '&quot;')}">
  <div class="admonition-header">
    <span class="admonition-icon">${cfg.icon}</span>
    <span class="admonition-label">${cfg.label}</span>
    <button class="admonition-copy-btn" onclick="(function(btn){const text=btn.closest('.admonition').dataset.aiPrompt;navigator.clipboard.writeText(text).then(()=>{btn.textContent='Copied!';setTimeout(()=>{btn.textContent='Copy prompt'},2000)})})(this)">Copy prompt</button>
  </div>
  <div class="admonition-body admonition-body-mono">${inner.html}</div>
</div>\n`;
        } else {
          const inner = renderBlocks(token.children);
          toc.push(...inner.toc);
          sidenotes.push(...inner.sidenotes);
          html += `<div class="admonition ${cfg.colorClass}">
  <div class="admonition-header">
    <span class="admonition-icon">${cfg.icon}</span>
    <span class="admonition-label">${cfg.label}</span>
  </div>
  <div class="admonition-body">${inner.html}</div>
</div>\n`;
        }
        break;
      }

      case 'footnote_def': {
        // Render sidenote — will be positioned by JS in the frontend
        const noteHtml = parseInline(token.text);
        sidenotes.push({ id: token.id, html: noteHtml });
        // Also render a hidden anchor target for mobile fallback
        html += `<div class="footnote-def" id="fn-${token.id}">
  <sup>[${token.id}]</sup> ${noteHtml}
</div>\n`;
        break;
      }
    }
  }

  return { html, toc, sidenotes };
}
