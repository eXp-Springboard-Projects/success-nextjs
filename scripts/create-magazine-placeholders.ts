import { supabaseAdmin } from '../lib/supabase';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const magazines = [
  {
    id: '2748da68-fc3d-48ed-9ade-dfdd6a18e74f',
    name: 'SUCCESS Magazine',
    subtitle: 'September/October 2024',
    filename: '2748da68-fc3d-48ed-9ade-dfdd6a18e74f-placeholder.jpg'
  },
  {
    id: '6a2a5319-b543-4a47-b355-cba1dca0b75a',
    name: 'SUCCESS Magazine',
    subtitle: 'March/April 2024',
    filename: '6a2a5319-b543-4a47-b355-cba1dca0b75a-placeholder.jpg'
  },
  {
    id: 'd3058cee-c22f-401d-852a-0be0af3b5ba1',
    name: 'SUCCESS Magazine',
    subtitle: 'May/June 2024',
    filename: 'd3058cee-c22f-401d-852a-0be0af3b5ba1-placeholder.jpg'
  }
];

async function createPlaceholders() {
  const magazinesDir = path.join(process.cwd(), 'public', 'images', 'magazines');
  const supabase = supabaseAdmin();

  for (const mag of magazines) {
    const filepath = path.join(magazinesDir, mag.filename);

    // Create a simple magazine placeholder SVG with SUCCESS branding
    const svg = `
      <svg width="400" height="600" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#c53030;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#7d1f1f;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="400" height="600" fill="url(#grad)"/>
        <text x="50%" y="45%" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="#ffffff" text-anchor="middle" dy=".3em">SUCCESS</text>
        <text x="50%" y="55%" font-family="Arial, sans-serif" font-size="20" fill="#ffffff" text-anchor="middle" dy=".3em">${mag.subtitle}</text>
        <rect x="30" y="30" width="340" height="540" stroke="#ffffff" stroke-width="2" fill="none" opacity="0.3"/>
      </svg>
    `;

    // Convert SVG to JPEG
    await sharp(Buffer.from(svg))
      .jpeg({ quality: 90 })
      .toFile(filepath);

    console.log(`✓ Created placeholder: ${mag.filename}`);

    // Update database
    const { error } = await supabase
      .from('store_products')
      .update({ image: `/images/magazines/${mag.filename}` })
      .eq('id', mag.id);

    if (error) {
      console.error(`✗ Error updating database for ${mag.id}:`, error);
    } else {
      console.log(`✓ Updated database for ${mag.subtitle}`);
    }
  }

  console.log('\nDone! All placeholders created.');
}

createPlaceholders();
