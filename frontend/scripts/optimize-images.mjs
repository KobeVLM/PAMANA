import { readFile, readdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const IMAGES_DIR = path.resolve('public/images')
const MAX_EDGE = 1024
const KEEP_FULL_SIZE = new Set([
  'Farm.png',
  'Garden.png',
  'House.png',
  'Kitchen.png',
  'LandingPage1.png',
  'TrailMap.png',
])
const fmt = (n) => `${(n / 1024 / 1024).toFixed(2)} MB`

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...(await walk(full)))
    else if (entry.name.toLowerCase().endsWith('.png')) files.push(full)
  }
  return files
}

async function bestEncoding(input, needsResize) {
  const pipeline = () => {
    const instance = sharp(input)
    return needsResize
      ? instance.resize({
          width: MAX_EDGE,
          height: MAX_EDGE,
          fit: 'inside',
          withoutEnlargement: true,
        })
      : instance
  }
  const lossless = await pipeline()
    .png({ compressionLevel: 9, effort: 10 })
    .toBuffer()
  const paletted = await pipeline()
    .png({ compressionLevel: 9, effort: 10, palette: true, quality: 85 })
    .toBuffer()
  return paletted.length < lossless.length ? paletted : lossless
}

const files = await walk(IMAGES_DIR)
let before = 0
let after = 0
let changed = 0

for (const file of files) {
  const input = await readFile(file)
  before += input.length

  const meta = await sharp(input).metadata()
  const maxEdge = Math.max(meta.width ?? 0, meta.height ?? 0)
  const needsResize =
    maxEdge > MAX_EDGE && !KEEP_FULL_SIZE.has(path.basename(file))

  const best = await bestEncoding(input, needsResize)
  if (best.length < input.length) {
    await writeFile(file, best)
    changed += 1
    after += best.length
    const resizeNote = needsResize ? ` (resized ${maxEdge}px -> ${MAX_EDGE}px)` : ''
    console.log(
      `${path.relative(IMAGES_DIR, file)}: ${fmt(input.length)} -> ${fmt(best.length)}${resizeNote}`
    )
  } else {
    after += input.length
    console.log(`${path.relative(IMAGES_DIR, file)}: kept (no gain)`)
  }
}

console.log('')
console.log(`Files: ${files.length}, changed: ${changed}`)
console.log(`Total: ${fmt(before)} -> ${fmt(after)} (saved ${fmt(before - after)})`)
