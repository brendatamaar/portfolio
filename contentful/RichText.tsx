"use client"
import React from 'react';
import { Document as RichTextDocument, BLOCKS, MARKS, INLINES } from '@contentful/rich-text-types';
import { documentToReactComponents, Options } from '@contentful/rich-text-react-renderer';
import { CopyBlock, dracula } from "react-code-blocks";
type RichTextProps = {
	document: RichTextDocument | null;
};

const find = (array: any, condition: any) => {
	return array.find((item: any) => condition(item));
};
const renderOptions: Options = {
	renderNode: {
		[BLOCKS.PARAGRAPH]: (node: any, children: React.ReactNode) => {
			if (find(node.content[0].marks, (mark: { type: string; }) => mark.type === 'code')) {
				return <CopyBlock
					text={node.content[0].value}
					language={"tsx"}
					wrapLongLines={true}
					codeBlock={true}
					showLineNumbers={false}
					theme={dracula}
				/>
			}
			return <p className="my-8">{children}</p>
		},
		[BLOCKS.OL_LIST]: (node: any, children: React.ReactNode) => <ol className="ml-3 list-decimal">{children}</ol>,
		[BLOCKS.UL_LIST]: (node: any, children: React.ReactNode) => <ul key={node.data.id || JSON.stringify(node.data)} className="ml-3 list-disc">{children}</ul>,
		[BLOCKS.LIST_ITEM]: (node: any, children: React.ReactNode) => <li key={node.data.id || JSON.stringify(node.data)} className="my-2 [&>p]:my-0">{children}</li>,
		[BLOCKS.QUOTE]: (node: any, children: React.ReactNode) => <blockquote className="my-8 p-4 border-s-4 border-gray-300 bg-gray-50 dark:border-gray-500 dark:bg-gray-800">{children}</blockquote>,
		[BLOCKS.HEADING_1]: (node: any, children: React.ReactNode) => <h1 className="text-black dark:text-white text-medium font-medium my-4">{children}</h1>,
		[BLOCKS.HEADING_2]: (node: any, children: React.ReactNode) => <h2 className="text-black dark:text-white text-medium font-medium my-4">{children}</h2>,
		[BLOCKS.HEADING_3]: (node: any, children: React.ReactNode) => <h3 className="text-black dark:text-white text-medium font-medium my-4">{children}</h3>,
		[BLOCKS.HEADING_4]: (node: any, children: React.ReactNode) => <h4 className="text-black dark:text-white text-medium font-medium my-4">{children}</h4>,
		[BLOCKS.HEADING_5]: (node: any, children: React.ReactNode) => <h5 className="text-black dark:text-white text-medium font-medium my-4">{children}</h5>,
		[BLOCKS.HEADING_6]: (node: any, children: React.ReactNode) => <h6 className="text-black dark:text-white text-medium font-medium my-4">{children}</h6>,
		[INLINES.HYPERLINK]: (node, children) => (
			<a href={node.data.uri} className="font-medium underline hover:no-underline text-blue-600 dark:text-blue-500" target='_blank'>
				{children}
			</a>
		),

		[INLINES.EMBEDDED_ENTRY]: (node, children) => {
			return (
				<a href={`/blog/${node.data.target.fields.slug}`}>
					{node.data.target.fields.title}
				</a>
			);
		},
		[BLOCKS.EMBEDDED_ENTRY]: (node, children) => {

			if (node.data.target.sys.contentType.sys.id === "videoEmbed") {
				return (
					<iframe
						src={node.data.target.fields.embedUrl}
						height="100%"
						width="100%"
						frameBorder="0"
						scrolling="no"
						title={node.data.target.fields.title}
						allowFullScreen={true}
					/>
				);
			}

		},

		[BLOCKS.EMBEDDED_ASSET]: (node, children) => {
			return (
				<figure>
					<img
						className="h-auto mx-auto max-w-full rounded-lg"
						src={`https://${node.data.target.fields.file.url}`}
						height={node.data.target.fields.file.details.image.height}
						width={node.data.target.fields.file.details.image.width}
						alt={node.data.target.fields.title} />
					<figcaption className="mt-2 font-medium text-medium text-center text-gray-500 dark:text-gray-400">{node.data.target.fields.description}</figcaption>
				</figure>
			);
		},
	},
	renderMark: {
		[MARKS.BOLD]: (text) => <strong className='text-medium font-medium text-black dark:text-white'>{text}</strong>,
		[MARKS.ITALIC]: (text) => <em>{text}</em>,
		[MARKS.UNDERLINE]: (text) => <u>{text}</u>,
	},
	preserveWhitespace: true
};

const RichText: React.FC<RichTextProps> = ({ document }) => {
	if (!document) {
		return null;
	}

	return (
		<div className="text-justify text-muted-foreground dark:text-font-dark-mode">
			{documentToReactComponents(document, renderOptions)}
		</div>
	);
};

export default RichText;
