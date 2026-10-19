import path from 'node:path'
import sharp from 'sharp'

const publicDir = path.join(process.cwd(), 'public')
const source = path.join(publicDir, 'images', 'PAMANA_logo.png')

const transparent = { r: 0, g: 0, b: 0, alpha: 0 }
const brandGreen = { r: 5, g: 46, b: 22, alpha: 1 } // #052e16

const resized = (size) =>
  sharp(source)
    .resize(size, size, { fit: 'contain', background: transparent })
    .png({ compressionLevel: 9 })

await resized(192).toFile(path.join(publicDir, 'pwa-192x192.png'))
await resized(512).toFile(path.join(publicDir, 'pwa-512x512.png'))
await resized(180).toFile(path.join(publicDir, 'apple-touch-icon.png'))
await resized(32).toFile(path.join(publicDir, 'favicon-32x32.png'))
await resized(16).toFile(path.join(publicDir, 'favicon-16x16.png'))

// Maskable icon: logo kept inside the 80% safe zone on an opaque brand background.
const inner = await sharp(source)
  .resize(400, 400, { fit: 'contain', background: transparent })
  .png()
  .toBuffer()

await sharp({
  create: { width: 512, height: 512, channels: 4, background: brandGreen },
})
  .composite([{ input: inner, top: 56, left: 56 }])
  .png({ compressionLevel: 9 })
  .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'))

console.log('PWA icons written to public/')
