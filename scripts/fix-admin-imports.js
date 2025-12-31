const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all .tsx files in pages/admin with adminAuth imports
const files = execSync('find pages/admin -name "*.tsx" -type f', { encoding: 'utf8' })
  .trim()
  .split('\n')
  .filter(file => {
    const content = fs.readFileSync(file, 'utf8');
    return content.includes('adminAuth');
  });

console.log(`Found ${files.length} files to fix\n`);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Calculate depth: count slashes after pages/admin/
  const relativePath = file.replace('pages/admin/', '');
  const depth = (relativePath.match(/\//g) || []).length + 1;
  const correctPath = '../'.repeat(depth) + 'lib/adminAuth';

  // Replace any existing adminAuth import with correct path
  const oldContent = content;
  content = content.replace(
    /from ['"]\.\.\/.*lib\/adminAuth['"]/g,
    `from '${correctPath}'`
  );

  if (content !== oldContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`✅ Fixed: ${file} → '${correctPath}'`);
  }
});

console.log('\n✨ All imports fixed!');
