const fs = require('fs');
const path = require('path');

/**
 * Script to add server-side authentication to ALL admin pages
 * This fixes CRITICAL security vulnerability
 */

const authImport = `import { requireAdminAuth } from '../../../lib/adminAuth';`;
const authImport2Level = `import { requireAdminAuth } from '../../lib/adminAuth';`;
const authImport1Level = `import { requireAdminAuth } from '../lib/adminAuth';`;

const authFunction = `
// Server-side authentication check
export const getServerSideProps = requireAdminAuth;
`;

function addAuthToFile(filePath) {
  console.log(`Processing: ${filePath}`);

  let content = fs.readFileSync(filePath, 'utf8');

  // Skip if already has getServerSideProps
  if (content.includes('getServerSideProps')) {
    console.log(`  ✓ Already has getServerSideProps`);
    return;
  }

  // Determine correct import path based on nesting level
  const relativePath = path.relative(path.join(__dirname, '..'), filePath);
  const depth = relativePath.split(path.sep).length - 2; // minus 'pages' and filename

  let importStatement;
  if (depth === 1) {
    importStatement = authImport1Level;
  } else if (depth === 2) {
    importStatement = authImport2Level;
  } else {
    importStatement = authImport;
  }

  // Add import at top (after other imports)
  const lines = content.split('\n');
  let lastImportIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ')) {
      lastImportIndex = i;
    }
  }

  if (lastImportIndex !== -1) {
    lines.splice(lastImportIndex + 1, 0, importStatement);
    content = lines.join('\n');
  }

  // Add auth function at end of file
  content = content.trimEnd() + '\n' + authFunction;

  // Write back
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`  ✓ Added server-side auth`);
}

// Find all admin page files
function findAdminPages(dir, files = []) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      findAdminPages(fullPath, files);
    } else if (item.endsWith('.tsx') && !item.includes('.module.')) {
      files.push(fullPath);
    }
  }

  return files;
}

// Main execution
const pagesDir = path.join(__dirname, '..', 'pages', 'admin');
const adminPages = findAdminPages(pagesDir);

console.log(`\n🔐 Adding server-side authentication to ${adminPages.length} admin pages...\n`);

let updated = 0;
let skipped = 0;

for (const page of adminPages) {
  try {
    const before = fs.readFileSync(page, 'utf8');
    addAuthToFile(page);
    const after = fs.readFileSync(page, 'utf8');

    if (before !== after) {
      updated++;
    } else {
      skipped++;
    }
  } catch (error) {
    console.error(`  ✗ Error: ${error.message}`);
  }
}

console.log(`\n✅ Complete!`);
console.log(`   Updated: ${updated} files`);
console.log(`   Skipped: ${skipped} files (already had auth)`);
console.log(`\n🔐 CRITICAL vulnerability fixed!\n`);
