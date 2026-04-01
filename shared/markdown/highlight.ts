/**
 * Syntax highlighter — regex tokenizer per language.
 * Outputs HTML with <span class="hl-*"> tokens.
 */

type TokenKind =
  | 'comment'
  | 'string'
  | 'keyword'
  | 'number'
  | 'operator'
  | 'function'
  | 'type'
  | 'builtin'
  | 'tag'
  | 'attr'
  | 'value'
  | 'punctuation'
  | 'property'
  | 'variable'

interface HlRule {
  kind: TokenKind
  pattern: RegExp
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// ─── Language rule sets ───────────────────────────────────────────────────────

const JS_KEYWORDS =
  /\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|delete|typeof|instanceof|in|of|import|export|default|from|class|extends|super|this|null|undefined|true|false|try|catch|finally|throw|async|await|yield|static|get|set|void)\b/
const TS_KEYWORDS =
  /\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|delete|typeof|instanceof|in|of|import|export|default|from|class|extends|super|this|null|undefined|true|false|try|catch|finally|throw|async|await|yield|static|get|set|void|type|interface|enum|namespace|declare|abstract|implements|as|readonly|keyof|infer|never|unknown|any)\b/
const PY_KEYWORDS =
  /\b(def|return|if|elif|else|for|while|import|from|as|class|pass|break|continue|raise|try|except|finally|with|lambda|yield|None|True|False|and|or|not|in|is|global|nonlocal|del|assert|async|await)\b/
const GO_KEYWORDS =
  /\b(func|return|if|else|for|range|switch|case|break|continue|var|const|type|struct|interface|import|package|defer|go|chan|select|map|make|new|nil|true|false|error|string|int|int8|int16|int32|int64|uint|uint8|uint16|uint32|uint64|float32|float64|bool|byte|rune|append|len|cap|close|delete|copy|panic|recover|print|println)\b/
const RUST_KEYWORDS =
  /\b(fn|let|mut|return|if|else|for|while|loop|match|use|mod|pub|struct|enum|impl|trait|type|const|static|self|Self|super|crate|where|in|ref|move|async|await|dyn|Box|Option|Some|None|Result|Ok|Err|Vec|String|str|bool|i8|i16|i32|i64|i128|u8|u16|u32|u64|u128|f32|f64|usize|isize|true|false)\b/
const SQL_KEYWORDS =
  /\b(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|ON|AS|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|INDEX|DROP|ALTER|ADD|COLUMN|PRIMARY|KEY|FOREIGN|REFERENCES|NOT|NULL|DEFAULT|UNIQUE|CASCADE|AND|OR|IN|LIKE|BETWEEN|GROUP|BY|ORDER|HAVING|LIMIT|OFFSET|DISTINCT|COUNT|SUM|AVG|MIN|MAX|UNION|ALL|EXISTS|CASE|WHEN|THEN|ELSE|END)\i/

const rules: Record<string, HlRule[]> = {
  js: [
    { kind: 'comment', pattern: /\/\/.*$|\/\*[\s\S]*?\*\//m },
    {
      kind: 'string',
      pattern: /`[\s\S]*?`|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/,
    },
    { kind: 'keyword', pattern: JS_KEYWORDS },
    { kind: 'number', pattern: /\b\d+(\.\d+)?\b/ },
    { kind: 'function', pattern: /\b([a-zA-Z_$][\w$]*)\s*(?=\()/ },
    { kind: 'operator', pattern: /[+\-*/%=<>!&|^~?:]+/ },
  ],
  ts: [
    { kind: 'comment', pattern: /\/\/.*$|\/\*[\s\S]*?\*\//m },
    {
      kind: 'string',
      pattern: /`[\s\S]*?`|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/,
    },
    { kind: 'type', pattern: /\b([A-Z][a-zA-Z0-9_]*)\b/ },
    { kind: 'keyword', pattern: TS_KEYWORDS },
    { kind: 'number', pattern: /\b\d+(\.\d+)?\b/ },
    { kind: 'function', pattern: /\b([a-zA-Z_$][\w$]*)\s*(?=\()/ },
    { kind: 'operator', pattern: /[+\-*/%=<>!&|^~?:]+/ },
  ],
  python: [
    { kind: 'comment', pattern: /#.*$/ },
    {
      kind: 'string',
      pattern:
        /"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/,
    },
    {
      kind: 'builtin',
      pattern:
        /\b(print|len|range|enumerate|zip|map|filter|list|dict|set|tuple|int|float|str|bool|type|isinstance|hasattr|getattr|setattr|open|super|property|staticmethod|classmethod)\b/,
    },
    { kind: 'keyword', pattern: PY_KEYWORDS },
    { kind: 'number', pattern: /\b\d+(\.\d+)?\b/ },
    { kind: 'function', pattern: /\b([a-zA-Z_][\w]*)\s*(?=\()/ },
    { kind: 'operator', pattern: /[+\-*/%=<>!&|^~]+/ },
  ],
  go: [
    { kind: 'comment', pattern: /\/\/.*$|\/\*[\s\S]*?\*\//m },
    { kind: 'string', pattern: /`[\s\S]*?`|"(?:[^"\\]|\\.)*"/ },
    { kind: 'keyword', pattern: GO_KEYWORDS },
    { kind: 'number', pattern: /\b\d+(\.\d+)?\b/ },
    { kind: 'function', pattern: /\b([a-zA-Z_][\w]*)\s*(?=\()/ },
    { kind: 'operator', pattern: /[+\-*/%=<>!&|^~]+/ },
  ],
  rust: [
    { kind: 'comment', pattern: /\/\/.*$|\/\*[\s\S]*?\*\//m },
    { kind: 'string', pattern: /"(?:[^"\\]|\\.)*"/ },
    { kind: 'type', pattern: /\b([A-Z][a-zA-Z0-9_]*)\b/ },
    { kind: 'keyword', pattern: RUST_KEYWORDS },
    { kind: 'number', pattern: /\b\d+(\.\d+)?(_\w+)?\b/ },
    { kind: 'function', pattern: /\b([a-z_][\w]*)\s*(?=\()/ },
    { kind: 'operator', pattern: /[+\-*/%=<>!&|^~?:]+/ },
  ],
  sql: [
    { kind: 'comment', pattern: /--.*$|\/\*[\s\S]*?\*\//m },
    { kind: 'string', pattern: /'(?:[^'\\]|\\.)*'/ },
    { kind: 'keyword', pattern: SQL_KEYWORDS },
    { kind: 'number', pattern: /\b\d+(\.\d+)?\b/ },
    { kind: 'function', pattern: /\b([A-Z_]+)\s*(?=\()/i },
  ],
  html: [
    { kind: 'comment', pattern: /<!--[\s\S]*?-->/ },
    { kind: 'string', pattern: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/ },
    { kind: 'tag', pattern: /<\/?[a-zA-Z][a-zA-Z0-9-]*/ },
    { kind: 'attr', pattern: /\b([a-zA-Z-]+)(?=\s*=)/ },
    { kind: 'punctuation', pattern: /[<>/=]/ },
  ],
  css: [
    { kind: 'comment', pattern: /\/\*[\s\S]*?\*\// },
    { kind: 'string', pattern: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/ },
    { kind: 'property', pattern: /\b([\w-]+)\s*(?=:)/ },
    { kind: 'value', pattern: /:\s*([^;{]+)/ },
    {
      kind: 'builtin',
      pattern: /#[0-9a-fA-F]{3,8}|\b(\d+)(px|em|rem|%|vh|vw|deg|s|ms)\b/,
    },
    { kind: 'tag', pattern: /\b([a-z][a-z0-9-]*)\s*(?=[{,])/ },
  ],
  json: [
    { kind: 'property', pattern: /"(?:[^"\\]|\\.)*"\s*(?=:)/ },
    { kind: 'string', pattern: /"(?:[^"\\]|\\.)*"/ },
    { kind: 'number', pattern: /-?\b\d+(\.\d+)?([eE][+-]?\d+)?\b/ },
    { kind: 'keyword', pattern: /\b(true|false|null)\b/ },
  ],
  bash: [
    { kind: 'comment', pattern: /#.*$/ },
    { kind: 'string', pattern: /"(?:[^"\\]|\\.)*"|'[^']*'/ },
    {
      kind: 'keyword',
      pattern:
        /\b(if|then|else|elif|fi|for|while|do|done|case|esac|in|function|return|exit|export|source|echo|local|declare|readonly|shift|set|unset)\b/,
    },
    { kind: 'variable', pattern: /\$\{?[\w]+\}?/ },
    {
      kind: 'builtin',
      pattern:
        /\b(cd|ls|mkdir|rm|cp|mv|cat|grep|sed|awk|find|chmod|chown|curl|wget|git|npm|pnpm|node|python|pip)\b/,
    },
    { kind: 'operator', pattern: /[|&;><]/ },
  ],
  markdown: [
    { kind: 'keyword', pattern: /^#{1,6}\s.*/m },
    { kind: 'string', pattern: /\*\*.*?\*\*|\*.*?\*/ },
    { kind: 'comment', pattern: /`[^`]+`|```[\s\S]*?```/ },
    { kind: 'function', pattern: /\[.*?\]\(.*?\)/ },
  ],
}

// Aliases
rules['jsx'] = rules['js']
rules['tsx'] = rules['ts']
rules['xml'] = rules['html']
rules['sh'] = rules['bash']
rules['shell'] = rules['bash']
rules['py'] = rules['python']
rules['rs'] = rules['rust']

// ─── Tokenizer ────────────────────────────────────────────────────────────────

interface Span {
  start: number
  end: number
  kind: TokenKind
}

function tokenize(code: string, langRules: HlRule[]): Span[] {
  const spans: Span[] = []
  const taken = new Uint8Array(code.length)

  for (const rule of langRules) {
    const re = new RegExp(
      rule.pattern.source,
      rule.pattern.flags.includes('m') ? 'gm' : 'g',
    )
    let match: RegExpExecArray | null
    while ((match = re.exec(code)) !== null) {
      const start = match.index
      const end = start + match[0].length
      // Skip if any byte in range is already taken
      let overlap = false
      for (let j = start; j < end; j++) {
        if (taken[j]) {
          overlap = true
          break
        }
      }
      if (!overlap) {
        for (let j = start; j < end; j++) taken[j] = 1
        spans.push({ start, end, kind: rule.kind })
      }
    }
  }

  spans.sort((a, b) => a.start - b.start)
  return spans
}

export function highlight(code: string, lang: string): string {
  const langKey = lang.toLowerCase()
  const langRules = rules[langKey]

  if (!langRules) {
    return escapeHtml(code)
  }

  const spans = tokenize(code, langRules)
  let result = ''
  let pos = 0

  for (const span of spans) {
    if (pos < span.start) {
      result += escapeHtml(code.slice(pos, span.start))
    }
    result += `<span class="hl-${span.kind}">${escapeHtml(code.slice(span.start, span.end))}</span>`
    pos = span.end
  }

  if (pos < code.length) {
    result += escapeHtml(code.slice(pos))
  }

  return result
}
