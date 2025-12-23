const fs = require('fs');

const imageMap = {
  'Glenn Sanford': 'https://successcom.wpenginepowered.com/wp-content/uploads/2025/10/GlennSquare.png',
  'Kerrie Lee Brown': 'https://successcom.wpenginepowered.com/wp-content/uploads/2025/10/kerrielee2_square_no_blackbar.jpg',
  'Courtland Warren': 'https://successcom.wpenginepowered.com/wp-content/uploads/2025/10/courtland-crop.png',
  'Rachel Nead': 'https://successcom.wpenginepowered.com/wp-content/uploads/2025/11/Rachel2.png',
  'Lauren Kerrigan': 'https://successcom.wpenginepowered.com/wp-content/uploads/2025/12/Lauren-scaled.jpg',
  'Talitha Brumwell': 'https://successcom.wpenginepowered.com/wp-content/uploads/2025/12/1D271D21-172F-47EB-9EF8-485F571736FB-scaled.jpg',
  'Tyler Clayton': 'https://successcom.wpenginepowered.com/wp-content/uploads/2025/03/Tyler-Clayton.jpg',
  'Shawana Crayton': 'https://successcom.wpenginepowered.com/wp-content/uploads/2024/03/staff_shawana-crayton.jpg',
  'Carlos Gutierrez': 'https://successcom.wpenginepowered.com/wp-content/uploads/2025/12/IMG_8459.jpeg',
  'Harmony Heslop': 'https://successcom.wpenginepowered.com/wp-content/uploads/2025/12/edited-photo.png',
  'Emily Holombek': 'https://successcom.wpenginepowered.com/wp-content/uploads/2025/03/Emily-Holombek.jpg',
  'Elly Kang': 'https://successcom.wpenginepowered.com/wp-content/uploads/2025/03/Elly-Kang.jpg',
  'Sarah Kuta': 'https://successcom.wpenginepowered.com/wp-content/uploads/2025/12/Sarah.Kuta-1.jpg',
  'Virginia Le': 'https://successcom.wpenginepowered.com/wp-content/uploads/2025/11/staff_virginia-le-2023_r1.jpg',
  'Denise Long': 'https://successcom.wpenginepowered.com/wp-content/uploads/2025/03/Denise-Long.jpg',
  'Jamie Lyons': 'https://successcom.wpenginepowered.com/wp-content/uploads/2025/03/Jamie-Lyons.jpg',
  'Rena Machani': 'https://successcom.wpenginepowered.com/wp-content/uploads/2024/04/IMG_2752-1.png',
  'Kristen McMahon': 'https://successcom.wpenginepowered.com/wp-content/uploads/2025/12/IMG_1686-1.jpg',
  'Belle Mitchum': 'https://successcom.wpenginepowered.com/wp-content/uploads/2025/12/Belle-Mitchum-Headshot-1.jpg',
  'Hugh Murphy': 'https://successcom.wpenginepowered.com/wp-content/uploads/2024/03/staff_hugh-murphy-2023.jpg',
  "Emily O'Brien": 'https://successcom.wpenginepowered.com/wp-content/uploads/2024/03/staff_emily-obrien.jpg',
  'Destinie Orndoff': 'https://successcom.wpenginepowered.com/wp-content/uploads/2025/12/headshot.jpeg',
  'Staci Parks': 'https://successcom.wpenginepowered.com/wp-content/uploads/2025/12/Staci-Parks-Headshot.jpeg',
  'Jazzlyn Torres': 'https://successcom.wpenginepowered.com/wp-content/uploads/2025/12/edited-photo-1.png',
  'Emily Tvelia': 'https://successcom.wpenginepowered.com/wp-content/uploads/2025/03/Emily-Tvelia.jpg'
};

let content = fs.readFileSync('pages/about.tsx', 'utf8');

// Replace each image URL
for (const [name, url] of Object.entries(imageMap)) {
  const nameEscaped = name.replace(/'/g, "\\'");
  const oldPattern = new RegExp(`name: ['"]${nameEscaped}['"],\\s*title:[^}]+image: ['"]https://successcom[^'"]+['"]`, 'g');

  content = content.replace(oldPattern, (match) => {
    return match.replace(/image: ['"]https:\/\/successcom[^'"]+['"]/, `image: '${url}'`);
  });
}

fs.writeFileSync('pages/about.tsx', content);
console.log('✅ Updated all image URLs!');
