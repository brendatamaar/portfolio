import { mkdirSync } from 'fs'
import { resolve } from 'path'

export const UPLOADS_DIR = resolve(process.env.UPLOADS_DIR ?? 'uploads')

mkdirSync(UPLOADS_DIR, { recursive: true })
