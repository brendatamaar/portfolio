export type AdmonitionType =
  | 'note'
  | 'warning'
  | 'danger'
  | 'tip'
  | 'info'
  | 'tldr'
  | 'update'
  | 'definition'
  | 'ai';

export type BlockTokenType =
  | 'heading'
  | 'paragraph'
  | 'code'
  | 'blockquote'
  | 'list'
  | 'list_item'
  | 'hr'
  | 'table'
  | 'admonition'
  | 'footnote_def';

export interface HeadingToken {
  type: 'heading';
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
  id: string;
}

export interface ParagraphToken {
  type: 'paragraph';
  text: string;
}

export interface CodeToken {
  type: 'code';
  lang: string;
  text: string;
}

export interface BlockquoteToken {
  type: 'blockquote';
  children: BlockToken[];
}

export interface ListItemToken {
  type: 'list_item';
  text: string;
  children: ListItemToken[];
}

export interface ListToken {
  type: 'list';
  ordered: boolean;
  items: ListItemToken[];
}

export interface HrToken {
  type: 'hr';
}

export interface TableToken {
  type: 'table';
  headers: string[];
  align: Array<'left' | 'center' | 'right' | null>;
  rows: string[][];
}

export interface AdmonitionToken {
  type: 'admonition';
  kind: AdmonitionType;
  children: BlockToken[];
}

export interface FootnoteDefToken {
  type: 'footnote_def';
  id: string;
  text: string;
}

export type BlockToken =
  | HeadingToken
  | ParagraphToken
  | CodeToken
  | BlockquoteToken
  | ListToken
  | HrToken
  | TableToken
  | AdmonitionToken
  | FootnoteDefToken;

export interface TocItem {
  id: string;
  text: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
}

export interface Sidenote {
  id: string;
  html: string;
}

export interface ParseResult {
  html: string;
  toc: TocItem[];
  sidenotes: Sidenote[];
}
