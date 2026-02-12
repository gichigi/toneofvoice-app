#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

/**
 * Generate OG image (1200x630) from Group 22.svg with product name and tagline
 */
async function generateOgImage() {
  try {
    const publicDir = path.join(process.cwd(), 'public')
    const logoPath = path.join(publicDir, 'Group 22.svg')
    const outputPath = path.join(publicDir, 'og-image.png')

    if (!fs.existsSync(logoPath)) {
      throw new Error('Group 22.svg not found in public/')
    }

    const logoBuffer = fs.readFileSync(logoPath)
    const logoResized = await sharp(logoBuffer)
      .resize(200, 200)
      .png()
      .toBuffer()

    // Build full SVG: logo + text (Sharp renders SVG with system fonts)
    const svg = `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#ffffff"/>
  <image href="data:image/png;base64,${logoResized.toString('base64')}" x="500" y="120" width="200" height="200"/>
  <text x="600" y="380" text-anchor="middle" font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" font-size="48" font-weight="700" fill="#111111">Tone of Voice App</text>
  <text x="600" y="425" text-anchor="middle" font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" font-size="22" fill="#6b7280">Define your brand's tone of voice</text>
</svg>
`
    const svgBuffer = Buffer.from(svg)

    await sharp(svgBuffer)
      .png()
      .toFile(outputPath)

    console.log('✅ Generated og-image.png (1200x630)')
  } catch (error) {
    console.error('❌ Error generating OG image:', error)
    process.exit(1)
  }
}

generateOgImage()
