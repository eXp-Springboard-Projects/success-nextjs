const fs = require('fs');

const imageMap = {
  'Glenn Sanford': '/images/team/glenn-sanford.png',
  'Kerrie Lee Brown': '/images/team/kerrie-lee-brown.jpg',
  'Courtland Warren': '/images/team/courtland-warren.png',
  'Rachel Nead': '/images/team/rachel-nead.png',
  'Lauren Kerrigan': '/images/team/lauren-kerrigan.jpg',
  'Talitha Brumwell': '/images/team/talitha-brumwell.jpg',
  'Tyler Clayton': '/images/team/tyler-clayton.jpg',
  'Shawana Crayton': '/images/team/shawana-crayton.jpg',
  'Carlos Gutierrez': '/images/team/carlos-gutierrez.jpeg',
  'Harmony Heslop': '/images/team/harmony-heslop.png',
  'Emily Holombek': '/images/team/emily-holombek.jpg',
  'Elly Kang': '/images/team/elly-kang.jpg',
  'Sarah Kuta': '/images/team/sarah-kuta.jpg',
  'Virginia Le': '/images/team/virginia-le.jpg',
  'Denise Long': '/images/team/denise-long.jpg',
  'Jamie Lyons': '/images/team/jamie-lyons.jpg',
  'Rena Machani': '/images/team/rena-machani.png',
  'Kristen McMahon': '/images/team/kristen-mcmahon.jpg',
  'Belle Mitchum': '/images/team/belle-mitchum.jpg',
  'Hugh Murphy': '/images/team/hugh-murphy.jpg',
  "Emily O'Brien": '/images/team/emily-obrien.jpg',
  'Destinie Orndoff': '/images/team/destinie-orndoff.jpeg',
  'Staci Parks': '/images/team/staci-parks.jpeg',
  'Jazzlyn Torres': '/images/team/jazzlyn-torres.png',
  'Emily Tvelia': '/images/team/emily-tvelia.jpg'
};

let content = fs.readFileSync('pages/about.tsx', 'utf8');

// Replace each image URL
for (const [name, localPath] of Object.entries(imageMap)) {
  const nameEscaped = name.replace(/'/g, "\\'");
  const oldPattern = new RegExp(`name: ['"]${nameEscaped}['"],\\s*title:[^}]+image: ['"]https://successcom[^'"]+['"]`, 'g');

  content = content.replace(oldPattern, (match) => {
    return match.replace(/image: ['"]https:\/\/successcom[^'"]+['"]/, `image: '${localPath}'`);
  });

  // Also try to match /images/team paths that might already be there
  content = content.replace(/image: ['"]\/images\/team\/[^'"]+['"]/g, (match) => {
    if (match.includes(name.toLowerCase().replace(/[']/g, '').replace(/ /g, '-').replace(/o'brien/i, 'obrien'))) {
      return `image: '${localPath}'`;
    }
    return match;
  });
}

fs.writeFileSync('pages/about.tsx', content);
console.log('✅ Updated all image paths to local files!');
