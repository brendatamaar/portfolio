:::tldr
I rewrote my portfolio's markdown pipeline from scratch — parser, highlighter, and editor. This post walks through **why**, the _trade-offs_, and what I'd do ~~the same~~ differently next time.
:::

Most blogs reach for an off-the-shelf markdown library. I didn't, partly out of curiosity and partly because I wanted features like sidenotes[^1] and admonitions[gloss:admonition] without plugin soup. The usual reference point is CommonMark[cite:commonmark], which I deliberately did not follow to the letter.

## Why build it yourself?

Three reasons, roughly in order of honesty:

1. Learning how tokenizers[gloss:tokenizer] actually work[cite:crafting-interpreters]
2. Full control over the output HTML
3. Zero dependencies in the `shared/` package
4. No supply-chain surprises
5. Smaller bundle for the admin editor

### What it supports

- Headings with auto-generated anchors
- **Bold**, _italic_, **_both_**, and ~~strikethrough~~
- Inline `code` and fenced code blocks
- Links, both [internal](/projects) and [external](https://astro.build)
  - Nested bullets work too
  - As long as they're indented two spaces
- Tables, blockquotes, footnotes, and admonitions

---

## The block tokenizer

The parser runs in two passes: a **block** pass that scans line by line, then an **inline** pass for each block's text. Each pass produces tokens that later get turned into HTML, a bit like building an AST[gloss:ast] but flatter.

```ts
export function tokenizeBlocks(markdown: string): BlockToken[] {
  const lines = markdown.split('\n')
  const tokens: BlockToken[] = []
  let i = 0

  while (i < lines.length) {
    // Heading, HR, code fence, admonition, quote, list, table, paragraph...
    i++
  }
  return tokens
}
```

The highlighter is just a list of regex rules per language. First match wins, overlapping matches are skipped:

```python
def highlight(code: str, rules: list) -> str:
    taken = [False] * len(code)
    for rule in rules:
        for m in rule.finditer(code):
            if not any(taken[m.start():m.end()]):
                mark(m, taken)
    return render(code, taken)
```

Running the test suite:

```bash
# from the repo root
pnpm --filter shared test
echo "done: $?"
```

:::tip
Put the most specific rules first (comments, strings) so keywords inside a string don't get highlighted.
:::

## Comparing approaches

| Approach                                | Bundle size | Control | Effort |
| :-------------------------------------- | :---------: | ------: | :----- |
| markdown-it[cite:markdown-it] + plugins |   ~100 KB   |  Medium | Low    |
| remark / rehype[cite:unified]           |   ~150 KB   |    High | Medium |
| **Hand-rolled**                         |    ~8 KB    |   Total | High   |

> Any sufficiently complicated markdown setup contains an ad hoc, informally-specified, bug-ridden implementation of half of CommonMark.
>
> — me, after a week of edge cases, paraphrasing Greenspun's tenth rule[cite:greenspun]

## Things that bit me

:::warning
A lone asterisk in prose, like a footnote marker, gets treated as the start of italics. Escape-free parsers are fragile.
:::

:::danger
Never render user-supplied URLs without sanitizing. `javascript:` links in an `href` are an XSS[gloss:xss] vector[cite:owasp-xss].
:::

:::note
Line breaks inside a paragraph become `<br>` here, which differs from CommonMark.
This line is a separate visual line in the same paragraph.
:::

:::info
Headings inside admonitions and blockquotes still show up in the table of contents.
:::

:::update
**2026-10-03:** Added syntax highlighting for Rust and SQL.
:::

:::ai
Explain the difference between a block-level and inline-level markdown tokenizer, with examples.
:::

## Wrapping up

Was it worth it? For a personal site, yes[^2]. For a team project, probably use remark. If you want a gentler intro to parsing, the talk on lexical scanning in Go[cite:pike-lexer] is a great watch.

If you want the source, it's all in the [repo](https://github.com/brendatamaar/portfolio)[cite:portfolio-repo].

[^1]: Footnotes render as sidenotes on wide screens and as regular footnotes on mobile.

[^2]: "Worth it" measured in fun, not hours.
