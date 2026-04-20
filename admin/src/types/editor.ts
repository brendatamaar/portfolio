export type Mode = 'split' | 'editor' | 'preview'

export type StatusFilter = 'all' | 'draft' | 'published'

export type AuthState = 'checking' | 'authenticated' | 'unauthenticated'

export type UploadedImage = { id: number; url: string; filename: string }
