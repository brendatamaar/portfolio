'use client'
import React from 'react'
import {
  Document as RichTextDocument,
  BLOCKS,
  MARKS,
  INLINES,
} from '@contentful/rich-text-types'
import {
  documentToReactComponents,
  Options,
} from '@contentful/rich-text-react-renderer'
import { CopyBlock } from 'react-code-blocks'

type RichTextProps = {
  document: RichTextDocument | null
}

const brutalistTheme = {
  lineNumberColor: '#4b5563',
  lineNumberBgColor: '#0d0d0d',
  backgroundColor: '#0d0d0d',
  textColor: '#e5e7eb',
  substringColor: '#86efac',
  keywordColor: '#FFE600',
  attributeColor: '#93c5fd',
  selectorTagColor: '#FFE600',
  docTagColor: '#6b7280',
  nameColor: '#f9a8d4',
  builtInColor: '#93c5fd',
  literalColor: '#fdba74',
  bulletColor: '#86efac',
  codeColor: '#e5e7eb',
  additionColor: '#86efac',
  regexpColor: '#fca5a5',
  symbolColor: '#f9a8d4',
  variableColor: '#e5e7eb',
  templateVariableColor: '#fdba74',
  linkColor: '#93c5fd',
  selectorAttributeColor: '#fdba74',
  selectorPseudoColor: '#d8b4fe',
  typeColor: '#f9a8d4',
  stringColor: '#86efac',
  selectorIdColor: '#FFE600',
  quoteColor: '#6b7280',
  titleColor: '#93c5fd',
  sectionColor: '#FFE600',
  commentColor: '#4b5563',
  metaKeywordColor: '#FFE600',
  metaColor: '#6b7280',
  functionColor: '#93c5fd',
  numberColor: '#fdba74',
}

function CodeBlock({ text }: { text: string }) {
  return (
    <div className="my-8 border-2 border-black dark:border-white shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff]">
      <div className="bg-black border-b-2 border-black dark:border-white px-4 py-2">
        <span className="font-[family-name:var(--font-mono)] text-[10px] font-bold uppercase tracking-widest text-white/40">
          code
        </span>
      </div>
      <CopyBlock
        text={text}
        language="tsx"
        theme={brutalistTheme}
        codeBlock
        showLineNumbers
        customStyle={{
          borderRadius: '0',
          padding: '1.25rem',
          fontSize: '0.875rem',
          lineHeight: '1.7',
          fontFamily: 'var(--font-mono)',
          margin: '0',
        }}
      />
    </div>
  )
}

const find = (array: any, condition: any) => {
  return array.find((item: any) => condition(item))
}

const renderOptions: Options = {
  renderNode: {
    [BLOCKS.PARAGRAPH]: (node: any, children: React.ReactNode) => {
      if (
        node.content[0]?.marks &&
        find(node.content[0].marks, (mark: { type: string }) => mark.type === 'code')
      ) {
        return <CodeBlock text={node.content[0].value} />
      }
      return (
        <p className="my-6 text-base leading-[1.8] text-black/75 dark:text-white/75">
          {children}
        </p>
      )
    },

    [BLOCKS.HEADING_1]: (_node: any, children: React.ReactNode) => (
      <h1 className="mt-12 mb-4 font-black text-3xl uppercase tracking-tight text-black dark:text-white border-b-2 border-black dark:border-white pb-3">
        {children}
      </h1>
    ),
    [BLOCKS.HEADING_2]: (_node: any, children: React.ReactNode) => (
      <h2 className="mt-10 mb-4 font-black text-2xl uppercase tracking-tight text-black dark:text-white border-b-2 border-black dark:border-white pb-3">
        {children}
      </h2>
    ),
    [BLOCKS.HEADING_3]: (_node: any, children: React.ReactNode) => (
      <h3 className="mt-8 mb-3 font-black text-xl uppercase tracking-tight text-black dark:text-white">
        {children}
      </h3>
    ),
    [BLOCKS.HEADING_4]: (_node: any, children: React.ReactNode) => (
      <h4 className="mt-6 mb-2 font-black text-base uppercase tracking-tight text-black dark:text-white">
        {children}
      </h4>
    ),
    [BLOCKS.HEADING_5]: (_node: any, children: React.ReactNode) => (
      <h5 className="mt-6 mb-2 font-bold text-sm uppercase tracking-widest text-black dark:text-white">
        {children}
      </h5>
    ),
    [BLOCKS.HEADING_6]: (_node: any, children: React.ReactNode) => (
      <h6 className="mt-4 mb-2 font-bold text-sm uppercase tracking-widest text-black/60 dark:text-white/60">
        {children}
      </h6>
    ),

    [BLOCKS.OL_LIST]: (_node: any, children: React.ReactNode) => (
      <ol className="my-6 ml-4 list-decimal space-y-2 text-base text-black/75 dark:text-white/75">
        {children}
      </ol>
    ),
    [BLOCKS.UL_LIST]: (node: any, children: React.ReactNode) => (
      <ul
        key={node.data.id || JSON.stringify(node.data)}
        className="my-6 ml-4 list-disc space-y-2 text-base text-black/75 dark:text-white/75"
      >
        {children}
      </ul>
    ),
    [BLOCKS.LIST_ITEM]: (node: any, children: React.ReactNode) => (
      <li
        key={node.data.id || JSON.stringify(node.data)}
        className="leading-relaxed [&>p]:my-0"
      >
        {children}
      </li>
    ),

    [BLOCKS.QUOTE]: (_node: any, children: React.ReactNode) => (
      <blockquote className="my-8 border-l-4 border-black dark:border-white pl-5">
        <div className="font-[family-name:var(--font-mono)] text-[10px] font-bold uppercase tracking-widest text-black/30 dark:text-white/30 mb-2">
          quote
        </div>
        <div className="text-base italic leading-relaxed text-black/70 dark:text-white/70">
          {children}
        </div>
      </blockquote>
    ),

    [BLOCKS.HR]: () => (
      <hr className="my-10 border-t-2 border-black dark:border-white" />
    ),

    [INLINES.HYPERLINK]: (node, children) => (
      <a
        href={node.data.uri}
        className="font-medium text-black dark:text-white underline underline-offset-2 decoration-2 hover:decoration-[#FFE600] hover:text-black dark:hover:text-white transition-colors"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    ),

    [INLINES.EMBEDDED_ENTRY]: (node) => (
      <a href={`/blog/${node.data.target.fields.slug}`} className="underline underline-offset-2">
        {node.data.target.fields.title}
      </a>
    ),

    [BLOCKS.EMBEDDED_ENTRY]: (node) => {
      if (node.data.target.sys.contentType.sys.id === 'videoEmbed') {
        return (
          <div className="my-8 border-2 border-black dark:border-white shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff]">
            <iframe
              src={node.data.target.fields.embedUrl}
              height="400"
              width="100%"
              frameBorder="0"
              scrolling="no"
              title={node.data.target.fields.title}
              allowFullScreen={true}
            />
          </div>
        )
      }
    },

    [BLOCKS.EMBEDDED_ASSET]: (node) => (
      <figure className="my-8">
        <div className="border-2 border-black dark:border-white shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff]">
          <img
            className="w-full h-auto block"
            src={`https://${node.data.target.fields.file.url}`}
            height={node.data.target.fields.file.details.image.height}
            width={node.data.target.fields.file.details.image.width}
            alt={node.data.target.fields.title}
          />
        </div>
        {node.data.target.fields.description && (
          <figcaption className="mt-3 font-[family-name:var(--font-mono)] text-[11px] font-bold uppercase tracking-widest text-black/40 dark:text-white/40 text-center">
            {node.data.target.fields.description}
          </figcaption>
        )}
      </figure>
    ),
  },

  renderMark: {
    [MARKS.BOLD]: (text) => (
      <strong className="font-bold text-black dark:text-white">{text}</strong>
    ),
    [MARKS.ITALIC]: (text) => <em className="italic">{text}</em>,
    [MARKS.UNDERLINE]: (text) => <u className="underline underline-offset-2">{text}</u>,
    [MARKS.CODE]: (text) => (
      <code className="font-[family-name:var(--font-mono)] text-[0.875em] bg-black/8 dark:bg-white/10 text-black dark:text-white px-1.5 py-0.5 border border-black/20 dark:border-white/20">
        {text}
      </code>
    ),
  },

  preserveWhitespace: true,
}

const RichText: React.FC<RichTextProps> = ({ document }) => {
  if (!document) return null

  return (
    <div>
      {documentToReactComponents(document, renderOptions)}
    </div>
  )
}

export default RichText
