/**
 * Generate all missing image assets for GENIA Web Training
 * Usage: node scripts/generate-assets.mjs
 */
import sharp from 'sharp';
import { copyFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = resolve(__dirname, '..', 'public');
const LOGO_SRC = resolve(PUBLIC, 'logo', 'GENIA Logo.png');

// Brand colors
const VIOLET = '#7c3aed';
const BLUE = '#3b82f6';

async function ensureDir(dir) {
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
}

function svgGradientWithText(width, height, { title, subtitle, logoW, logoH }) {
  const titleSize = Math.round(width * 0.045);
  const subtitleSize = Math.round(width * 0.025);
  const logoY = Math.round(height * 0.15);
  const titleY = logoY + logoH + Math.round(height * 0.08);
  const subtitleY = titleY + Math.round(height * 0.08);

  return Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${VIOLET};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${BLUE};stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  ${title ? `<text x="50%" y="${titleY}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="bold" font-size="${titleSize}" fill="white">${title}</text>` : ''}
  ${subtitle ? `<text x="50%" y="${subtitleY}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="${subtitleSize}" fill="rgba(255,255,255,0.85)">${subtitle}</text>` : ''}
</svg>`);
}

function svgSolidWithCenterSpace(width, height) {
  return Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${VIOLET}"/>
</svg>`);
}

function svgPlaceholder(width, height, text) {
  const fontSize = Math.round(Math.min(width, height) * 0.04);
  return Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${VIOLET};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${BLUE};stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="Arial,Helvetica,sans-serif" font-weight="bold" font-size="${fontSize}" fill="white">${text}</text>
</svg>`);
}

async function run() {
  console.log('=== GENIA Asset Generator ===\n');

  // 1. Copy logo without spaces
  const logoTarget = resolve(PUBLIC, 'logo', 'genia-logo.png');
  await copyFile(LOGO_SRC, logoTarget);
  console.log('✓ Created public/logo/genia-logo.png');

  // 2. Create favicon.ico (32x32 PNG — Next.js accepts this)
  await sharp(LOGO_SRC)
    .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile(resolve(PUBLIC, 'favicon.ico'));
  console.log('✓ Created public/favicon.ico (32x32)');

  // 3. Create /public/logo.png (for emails)
  await copyFile(LOGO_SRC, resolve(PUBLIC, 'logo.png'));
  console.log('✓ Created public/logo.png');

  // 4. Create missing icons
  const icon128 = resolve(PUBLIC, 'icons', '128.png');
  const icon512 = resolve(PUBLIC, 'icons', '512.png');

  await sharp(icon128)
    .resize(96, 96, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile(resolve(PUBLIC, 'icons', '96.png'));
  console.log('✓ Created public/icons/96.png (96x96)');

  await sharp(icon512)
    .resize(384, 384, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile(resolve(PUBLIC, 'icons', '384.png'));
  console.log('✓ Created public/icons/384.png (384x384)');

  // 5. Create og-image.png (1200x630)
  const ogW = 1200, ogH = 630;
  const ogLogoW = 250, ogLogoH = 250;
  const ogLogoY = Math.round(ogH * 0.08);
  const ogLogoX = Math.round((ogW - ogLogoW) / 2);

  const ogLogoBuffer = await sharp(LOGO_SRC)
    .resize(ogLogoW, ogLogoH, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const ogBg = svgGradientWithText(ogW, ogH, {
    title: 'GENIA Web Training',
    subtitle: 'Formation au Prompt Engineering avec IA',
    logoW: ogLogoW,
    logoH: ogLogoH,
  });

  await sharp(ogBg)
    .composite([{ input: ogLogoBuffer, left: ogLogoX, top: ogLogoY }])
    .png()
    .toFile(resolve(PUBLIC, 'og-image.png'));
  console.log('✓ Created public/og-image.png (1200x630)');

  // 6. Create twitter-image.png (1200x600)
  const twW = 1200, twH = 600;
  const twLogoW = 220, twLogoH = 220;
  const twLogoY = Math.round(twH * 0.06);
  const twLogoX = Math.round((twW - twLogoW) / 2);

  const twLogoBuffer = await sharp(LOGO_SRC)
    .resize(twLogoW, twLogoH, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const twBg = svgGradientWithText(twW, twH, {
    title: 'GENIA Web Training',
    subtitle: 'Formation au Prompt Engineering avec IA',
    logoW: twLogoW,
    logoH: twLogoH,
  });

  await sharp(twBg)
    .composite([{ input: twLogoBuffer, left: twLogoX, top: twLogoY }])
    .png()
    .toFile(resolve(PUBLIC, 'twitter-image.png'));
  console.log('✓ Created public/twitter-image.png (1200x600)');

  // 7. Create splash screens
  await ensureDir(resolve(PUBLIC, 'splash'));
  const splashSizes = [
    [640, 1136],
    [750, 1334],
    [1242, 2208],
    [1125, 2436],
    [1242, 2688],
    [828, 1792],
  ];

  for (const [w, h] of splashSizes) {
    const logoSize = Math.round(w * 0.25);
    const logoX = Math.round((w - logoSize) / 2);
    const logoYS = Math.round((h - logoSize) / 2);

    const splashLogo = await sharp(LOGO_SRC)
      .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    const bg = svgSolidWithCenterSpace(w, h);

    await sharp(bg)
      .composite([{ input: splashLogo, left: logoX, top: logoYS }])
      .png()
      .toFile(resolve(PUBLIC, 'splash', `splash-${w}x${h}.png`));
    console.log(`✓ Created public/splash/splash-${w}x${h}.png`);
  }

  // 8. Create PWA screenshots
  await ensureDir(resolve(PUBLIC, 'screenshots'));

  await sharp(svgPlaceholder(1280, 720, 'GENIA Web Training — Dashboard'))
    .png()
    .toFile(resolve(PUBLIC, 'screenshots', 'dashboard.png'));
  console.log('✓ Created public/screenshots/dashboard.png (1280x720)');

  await sharp(svgPlaceholder(750, 1334, 'GENIA Web Training — Mobile'))
    .png()
    .toFile(resolve(PUBLIC, 'screenshots', 'mobile.png'));
  console.log('✓ Created public/screenshots/mobile.png (750x1334)');

  console.log('\n=== All assets generated successfully! ===');
}

run().catch((err) => {
  console.error('Asset generation failed:', err);
  process.exit(1);
});
