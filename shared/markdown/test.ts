/**
 * Quick smoke test — run with: npx tsx shared/markdown/test.ts
 */

import { parse } from './parser.js'

const md = `
# Hello World

This is a **bold** and *italic* paragraph with a \`code span\` and a [link](https://example.com).

Also a sidenote ref [^1] here.

## Code Block

\`\`\`ts
const x: string = "hello";
function greet(name: string): void {
  console.log(\`Hello, \${name}\`);
}
\`\`\`

## Admonitions

:::note
This is a **note** admonition.
:::

:::warning
Be careful here.
:::

:::ai
Explain virtual memory as if I'm a junior developer.
Use a library analogy: books are data, shelves are RAM.
:::

## Table

| Name   | Age | City     |
|--------|-----|----------|
| Alice  | 30  | Jakarta  |
| Bob    | 25  | Bandung  |

## List

- Item one
- Item two
  - Nested A
  - Nested B
- Item three

1. First
2. Second
3. Third

> This is a blockquote with **bold** text.

---

[^1]: This is the sidenote content for ref 1.
`

const result = parse(md)

console.log('=== HTML (first 500 chars) ===')
console.log(result.html.slice(0, 500))
console.log('\n=== TOC ===')
console.log(JSON.stringify(result.toc, null, 2))
console.log('\n=== Sidenotes ===')
console.log(JSON.stringify(result.sidenotes, null, 2))
console.log('\nDone.')
