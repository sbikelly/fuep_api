#!/usr/bin/env node

import { existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths
const assetsDir = join(__dirname, '../assets/badges');
const publicDir = join(__dirname, '../public');
const sourceLogo = join(assetsDir, 'fuep_badge.png');

// Ensure public directory exists
if (!existsSync(publicDir)) {
  mkdirSync(publicDir, { recursive: true });
}

async function generateIcons() {
  try {
    console.log('🎨 Generating icons from fuep_badge.png...');

    if (!existsSync(sourceLogo)) {
      throw new Error(`Source logo not found: ${sourceLogo}`);
    }

    // Read the source logo
    const logoBuffer = await sharp(sourceLogo).png().toBuffer();

    // Create a square canvas with the logo centered
    const createSquareIcon = async (size, padding = 0.1) => {
      const paddingPixels = Math.floor(size * padding);
      const logoSize = size - paddingPixels * 2;

      // Resize the logo to fit within the canvas
      const resizedLogo = await sharp(logoBuffer)
        .resize(logoSize, logoSize, { fit: 'inside', withoutEnlargement: true })
        .png()
        .toBuffer();

      return sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        },
      })
        .composite([
          {
            input: resizedLogo,
            top: paddingPixels,
            left: paddingPixels,
          },
        ])
        .png();
    };

    // Generate favicon.ico (16x16, 32x32, 48x48)
    console.log('📱 Generating favicon.ico...');
    const favicon16 = await createSquareIcon(16);
    const favicon32 = await createSquareIcon(32);
    const favicon48 = await createSquareIcon(48);

    // For now, we'll create individual PNG files since .ico requires special handling
    await favicon16.toFile(join(publicDir, 'favicon-16x16.png'));
    await favicon32.toFile(join(publicDir, 'favicon-32x32.png'));
    await favicon48.toFile(join(publicDir, 'favicon-48x48.png'));

    // Copy the 32x32 as the main favicon
    await favicon32.toFile(join(publicDir, 'favicon.png'));

    // Generate apple-touch-icon.png (180x180)
    console.log('🍎 Generating apple-touch-icon.png...');
    const appleIcon = await createSquareIcon(180);
    await appleIcon.toFile(join(publicDir, 'apple-touch-icon.png'));

    // Generate android-chrome icons
    console.log('🤖 Generating android-chrome icons...');
    const android192 = await createSquareIcon(192);
    await android192.toFile(join(publicDir, 'android-chrome-192x192.png'));
    const android512 = await createSquareIcon(512);
    await android512.toFile(join(publicDir, 'android-chrome-512x512.png'));

    // Generate maskable icon (512x512 with safe zone)
    console.log('🎭 Generating maskable icon...');
    const maskableIcon = await createSquareIcon(512, 0.15);
    await maskableIcon.toFile(join(publicDir, 'maskable-icon-512x512.png'));

    console.log('✅ All icons generated successfully!');
    console.log('📁 Icons saved to:', publicDir);
  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    process.exit(1);
  }
}

generateIcons();
