import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const magazines = [
  {
    id: '2748da68-fc3d-48ed-9ade-dfdd6a18e74f',
    title: 'September/October 2024',
    subtitle: 'Shark Tank Special'
  },
  {
    id: 'd3058cee-c22f-401d-852a-0be0af3b5ba1',
    title: 'May/June 2024',
    subtitle: 'Bethany Hamilton'
  },
  {
    id: '6a2a5319-b543-4a47-b355-cba1dca0b75a',
    title: 'March/April 2024',
    subtitle: 'Emily Calandrelli'
  }
];

async function createMagazineCover(mag: typeof magazines[0]) {
  const width = 400;
  const height = 600;

  // Create SVG with SUCCESS magazine branding
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad-${mag.id}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1a1a1a;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#2d2d2d;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#grad-${mag.id})"/>

      <!-- SUCCESS text -->
      <text x="50%" y="80" font-family="Arial Black, sans-serif" font-size="48" font-weight="bold"
            fill="#FFD700" text-anchor="middle" letter-spacing="2">SUCCESS</text>

      <!-- Magazine tag line -->
      <text x="50%" y="110" font-family="Arial, sans-serif" font-size="14"
            fill="#CCCCCC" text-anchor="middle">MAGAZINE</text>

      <!-- Issue title -->
      <text x="50%" y="300" font-family="Arial, sans-serif" font-size="28" font-weight="bold"
            fill="#FFFFFF" text-anchor="middle">${mag.title}</text>

      <!-- Subtitle/Featured -->
      <text x="50%" y="350" font-family="Arial, sans-serif" font-size="18"
            fill="#FFD700" text-anchor="middle">Featuring:</text>
      <text x="50%" y="380" font-family="Arial, sans-serif" font-size="20"
            fill="#FFFFFF" text-anchor="middle">${mag.subtitle}</text>

      <!-- Bottom accent -->
      <rect x="0" y="${height - 60}" width="${width}" height="60" fill="#FFD700" opacity="0.2"/>
      <text x="50%" y="${height - 25}" font-family="Arial, sans-serif" font-size="14" font-weight="bold"
            fill="#FFD700" text-anchor="middle">WWW.SUCCESS.COM</text>
    </svg>
  `;

  const outputPath = path.join(
    process.cwd(),
    'public',
    'images',
    'magazines',
    `${mag.id}.jpg`
  );

  await sharp(Buffer.from(svg))
    .jpeg({ quality: 90 })
    .toFile(outputPath);

  const stats = fs.statSync(outputPath);
  console.log(`✓ Created: ${mag.title} (${(stats.size / 1024).toFixed(2)} KB)`);
}

async function createAllCovers() {
  console.log('Creating magazine covers...\n');

  for (const mag of magazines) {
    await createMagazineCover(mag);
  }

  console.log('\nDone! Created 3 magazine covers.');
}

createAllCovers();
