import sharp from 'sharp'
import { readdirSync, existsSync } from 'fs'
import { join, extname, basename } from 'path'
import { resolve } from 'path'

const UPLOADS_DIR = resolve(process.env.UPLOADS_DIR ?? 'uploads')
const WEBP_QUALITY = 80
const THUMB_WIDTH = 400
const THUMB_QUALITY = 75
const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.tiff', '.bmp'])

console.log(`Scanning ${UPLOADS_DIR}`)

const files = readdirSync(UPLOADS_DIR).filter((f) =>
  IMAGE_EXTS.has(extname(f).toLowerCase()),
)

console.log(`Found ${files.length} image(s)`)

let converted = 0
let skipped = 0
let failed = 0

for (const file of files) {
  const src = join(UPLOADS_DIR, file)
  const name = basename(file, extname(file))
  const webpPath = join(UPLOADS_DIR, `${name}.webp`)
  const thumbPath = join(UPLOADS_DIR, `${name}-thumb.webp`)

  const needsWebp = !existsSync(webpPath)
  const needsThumb = !existsSync(thumbPath)

  if (!needsWebp && !needsThumb) {
    skipped++
    continue
  }

  try {
    const img = sharp(src)

    if (needsWebp) {
      await img.clone().webp({ quality: WEBP_QUALITY }).toFile(webpPath)
    }

    if (needsThumb) {
      await img
        .clone()
        .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
        .webp({ quality: THUMB_QUALITY })
        .toFile(thumbPath)
    }

    console.log(
      `  ✓ ${file}${needsWebp ? ' → .webp' : ''}${needsThumb ? ' → -thumb.webp' : ''}`,
    )
    converted++
  } catch (err) {
    console.error(`  ✗ ${file}: ${err}`)
    failed++
  }
}

console.log(
  `\nDone — converted: ${converted}, skipped: ${skipped}, failed: ${failed}`,
)
if (failed > 0) process.exit(1)
