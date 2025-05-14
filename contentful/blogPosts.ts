import { TypePersonalBlogSkeleton } from './types'
import { Entry } from 'contentful'
import { Document as RichTextDocument } from '@contentful/rich-text-types'
import contentfulClient from './contentfulClient'

type ISO8601DateTimeString = `${number}-${number}-${number}T${number}:${number}:${number}Z`;
type BlogPostEntry = Entry<TypePersonalBlogSkeleton, undefined, string>

export interface BlogPost {
	title: string
	slug: string
	date: ISO8601DateTimeString
	body: RichTextDocument | null
	tags: string[];
}

export function parseContentfulBlogPost(blogPostEntry?: BlogPostEntry): BlogPost | null {
	if (!blogPostEntry) {
		return null
	}

	// Extracting tags from metadata
	const tags = blogPostEntry.metadata?.tags.map(tag => tag.sys.id) || [];

	return {
		title: blogPostEntry.fields.title || '',
		slug: blogPostEntry.fields.slug || '',
		date: blogPostEntry.fields.date,
		body: blogPostEntry.fields.body || null,
		tags: tags
	}
}

interface FetchBlogPostsOptions {
	preview: boolean
}
export async function fetchBlogPosts({ preview }: FetchBlogPostsOptions): Promise<BlogPost[]> {
	const contentful = contentfulClient({ preview })

	const blogPostsResult = await contentful.getEntries<TypePersonalBlogSkeleton>({
		content_type: 'personalBlog',
		include: 2,
		order: ['fields.date'],
	})
	
	return blogPostsResult.items.map((blogPostEntry) => parseContentfulBlogPost(blogPostEntry) as BlogPost)
}

interface FetchBlogPostOptions {
	slug: string
	preview: boolean
}
export async function fetchBlogPost({ slug, preview }: FetchBlogPostOptions): Promise<BlogPost | null> {
	const contentful = contentfulClient({ preview })

	const blogPostsResult = await contentful.getEntries<TypePersonalBlogSkeleton>({
		content_type: 'personalBlog',
		"fields.slug": slug,
		include: 2,
	})

	return parseContentfulBlogPost(blogPostsResult.items[0])
}
