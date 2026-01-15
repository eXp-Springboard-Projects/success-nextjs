import { supabaseAdmin } from '../lib/supabase';
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';

async function downloadImage(url: string, filepath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(filepath);

    protocol.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {}); // Delete the file on error
      reject(err);
    });
  });
}

async function fixMagazineImages() {
  const supabase = supabaseAdmin();

  // Get all magazine products
  const { data: magazines, error } = await supabase
    .from('store_products')
    .select('id, name, image')
    .eq('category', 'Magazines')
    .eq('is_active', true);

  if (error || !magazines) {
    console.error('Error fetching magazines:', error);
    return;
  }

  console.log(`Found ${magazines.length} magazine products to fix\n`);

  // Create public/images/magazines directory if it doesn't exist
  const magazinesDir = path.join(process.cwd(), 'public', 'images', 'magazines');
  if (!fs.existsSync(magazinesDir)) {
    fs.mkdirSync(magazinesDir, { recursive: true });
    console.log(`Created directory: ${magazinesDir}\n`);
  }

  for (const mag of magazines) {
    console.log(`Processing: ${mag.name}`);
    console.log(`Current image: ${mag.image}`);

    if (!mag.image || !mag.image.includes('mysuccessplus.com')) {
      console.log('  ✓ Already has valid image URL\n');
      continue;
    }

    try {
      // Extract filename from URL
      const urlParts = mag.image.split('/');
      const originalFilename = urlParts[urlParts.length - 1];
      const filename = `${mag.id}-${originalFilename}`;
      const localPath = path.join(magazinesDir, filename);
      const publicUrl = `/images/magazines/${filename}`;

      // Check if already downloaded
      if (fs.existsSync(localPath)) {
        console.log(`  ✓ Image already downloaded: ${filename}`);
      } else {
        console.log(`  Downloading...`);
        await downloadImage(mag.image, localPath);
        console.log(`  ✓ Downloaded: ${filename}`);
      }

      // Update database with new URL
      const { error: updateError } = await supabase
        .from('store_products')
        .update({ image: publicUrl })
        .eq('id', mag.id);

      if (updateError) {
        console.error(`  ✗ Error updating database:`, updateError);
      } else {
        console.log(`  ✓ Updated database with: ${publicUrl}`);
      }
    } catch (err) {
      console.error(`  ✗ Error processing image:`, err);
    }

    console.log('');
  }

  console.log('Done!');
}

fixMagazineImages();
