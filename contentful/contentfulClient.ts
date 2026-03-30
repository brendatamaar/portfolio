import { createClient } from 'contentful'

const client = createClient({
	space: import.meta.env.VITE_CONTENTFUL_SPACE_ID,
	accessToken: import.meta.env.VITE_CONTENTFUL_ACCESS_TOKEN,
})

const previewClient = createClient({
	space: import.meta.env.VITE_CONTENTFUL_SPACE_ID,
	accessToken: import.meta.env.VITE_CONTENTFUL_PREVIEW_ACCESS_TOKEN,
	host: 'preview.contentful.com',
})

export default function contentfulClient({ preview = false }) {
	if (preview) {
		return previewClient
	}

	return client
}
