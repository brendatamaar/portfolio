/**
 * Inline parser — converts inline markdown to HTML.
 * Processes: bold, italic, strikethrough, code, links, images, footnote refs.
 */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function parseInline(text: string): string {
  // Escape HTML first (except we need to allow through our own tags)
  // We'll escape as we go instead.

  let result = '';
  let i = 0;
  const len = text.length;

  while (i < len) {
    // Footnote ref [^id]
    if (text[i] === '[' && text[i + 1] === '^') {
      const end = text.indexOf(']', i + 2);
      if (end !== -1) {
        const id = text.slice(i + 2, end);
        result += `<sup class="footnote-ref"><a href="#fn-${id}" id="fnref-${id}" data-sidenote-id="${id}">[${id}]</a></sup>`;
        i = end + 1;
        continue;
      }
    }

    // Image ![alt](url) — must check before link
    if (text[i] === '!' && text[i + 1] === '[') {
      const altEnd = text.indexOf(']', i + 2);
      if (altEnd !== -1 && text[altEnd + 1] === '(') {
        const urlEnd = text.indexOf(')', altEnd + 2);
        if (urlEnd !== -1) {
          const alt = text.slice(i + 2, altEnd);
          const url = text.slice(altEnd + 2, urlEnd);
          result += `<img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}" class="rounded-sm">`;
          i = urlEnd + 1;
          continue;
        }
      }
    }

    // Link [text](url)
    if (text[i] === '[') {
      const textEnd = text.indexOf(']', i + 1);
      if (textEnd !== -1 && text[textEnd + 1] === '(') {
        const urlEnd = text.indexOf(')', textEnd + 2);
        if (urlEnd !== -1) {
          const linkText = text.slice(i + 1, textEnd);
          const url = text.slice(textEnd + 2, urlEnd);
          const isExternal = /^https?:\/\//.test(url);
          const attrs = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
          result += `<a href="${escapeHtml(url)}"${attrs} class="underline underline-offset-2">${parseInline(linkText)}</a>`;
          i = urlEnd + 1;
          continue;
        }
      }
    }

    // Inline code `...`
    if (text[i] === '`') {
      const end = text.indexOf('`', i + 1);
      if (end !== -1) {
        const code = text.slice(i + 1, end);
        result += `<code class="inline-code">${escapeHtml(code)}</code>`;
        i = end + 1;
        continue;
      }
    }

    // Bold+Italic ***text***
    if (text.startsWith('***', i)) {
      const end = text.indexOf('***', i + 3);
      if (end !== -1) {
        result += `<strong><em>${parseInline(text.slice(i + 3, end))}</em></strong>`;
        i = end + 3;
        continue;
      }
    }

    // Bold **text**
    if (text.startsWith('**', i)) {
      const end = text.indexOf('**', i + 2);
      if (end !== -1) {
        result += `<strong>${parseInline(text.slice(i + 2, end))}</strong>`;
        i = end + 2;
        continue;
      }
    }

    // Italic *text*
    if (text[i] === '*') {
      const end = text.indexOf('*', i + 1);
      if (end !== -1) {
        result += `<em>${parseInline(text.slice(i + 1, end))}</em>`;
        i = end + 1;
        continue;
      }
    }

    // Strikethrough ~~text~~
    if (text.startsWith('~~', i)) {
      const end = text.indexOf('~~', i + 2);
      if (end !== -1) {
        result += `<del>${parseInline(text.slice(i + 2, end))}</del>`;
        i = end + 2;
        continue;
      }
    }

    // Escape HTML character
    const ch = text[i];
    if (ch === '&') result += '&amp;';
    else if (ch === '<') result += '&lt;';
    else if (ch === '>') result += '&gt;';
    else result += ch;

    i++;
  }

  return result;
}
