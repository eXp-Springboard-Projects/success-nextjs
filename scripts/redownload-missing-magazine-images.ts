import https from 'https';
import fs from 'fs';
import path from 'path';

// URLs for the missing/corrupted images
const imagesToFix = [
  {
    filename: '2748da68-fc3d-48ed-9ade-dfdd6a18e74f-SUCCESS-SeptOct-2024-Shark-Tank-Digital-Cover.jpg',
    url: 'https://mysuccessplus.com/wp-content/uploads/2024/09/SUCCESS-SeptOct-2024-Shark-Tank-Digital-Cover.jpg'
  },
  {
    filename: '6a2a5319-b543-4a47-b355-cba1dca0b75a-SUCCESS-MarApr-2024-Emily-Calandrelli-Digital-Cover.jpg',
    url: 'https://mysuccessplus.com/wp-content/uploads/2024/03/SUCCESS-MarApr-2024-Emily-Calandrelli-Digital-Cover.jpg'
  },
  {
    filename: 'd3058cee-c22f-401d-852a-0be0af3b5ba1-SUCCESS-MayJun-2024-Bethany-Hamilton-Digital-Cover.jpg',
    url: 'https://mysuccessplus.com/wp-content/uploads/2024/05/SUCCESS-MayJun-2024-Bethany-Hamilton-Digital-Cover.jpg'
  }
];

async function downloadImage(url: string, filepath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);

    https.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        fs.unlinkSync(filepath);

        const redirectUrl = response.headers.location;
        if (!redirectUrl) {
          reject(new Error('Redirect without location header'));
          return;
        }

        console.log(`Following redirect to: ${redirectUrl}`);
        downloadImage(redirectUrl, filepath).then(resolve).catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(filepath);
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        console.log(`✓ Downloaded: ${path.basename(filepath)}`);
        resolve();
      });

      file.on('error', (err) => {
        fs.unlinkSync(filepath);
        reject(err);
      });
    }).on('error', (err) => {
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      reject(err);
    });
  });
}

async function redownloadImages() {
  const magazinesDir = path.join(process.cwd(), 'public', 'images', 'magazines');

  for (const img of imagesToFix) {
    const filepath = path.join(magazinesDir, img.filename);

    // Delete existing file if it exists
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      console.log(`Deleted corrupted: ${img.filename}`);
    }

    try {
      console.log(`Downloading: ${img.filename}...`);
      await downloadImage(img.url, filepath);

      // Verify file size
      const stats = fs.statSync(filepath);
      console.log(`Size: ${(stats.size / 1024).toFixed(2)} KB\n`);
    } catch (err) {
      console.error(`✗ Error downloading ${img.filename}:`, err);
    }
  }

  console.log('Done!');
}

redownloadImages();
