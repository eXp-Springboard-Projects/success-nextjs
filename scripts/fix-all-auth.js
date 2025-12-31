const fs = require('fs');
const path = require('path');

/**
 * Script to FIX server-side authentication on ALL admin pages
 * Replaces weak getServerSideProps with proper auth
 */

const weakPatterns = [
  /export async function getServerSideProps\(\)\s*{\s*return\s*{\s*props:\s*{},?\s*};\s*}/,
  /export async function getServerSideProps\(context\)\s*{\s*return\s*{\s*props:\s*{},?\s*};\s*}/,
  /export async function getServerSideProps\(context: GetServerSidePropsContext\)\s*{\s*return\s*{\s*props:\s*{},?\s*};\s*}/,
];

function fixAuthInFile(filePath) {
  console.log(`Processing: ${filePath}`);

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Check if it's the login page - skip it
  if (filePath.includes('login.tsx')) {
    console.log(`  ⊘ Skipped (login page)`);
    return;
  }

  // Check if already has requireAdminAuth
  if (content.includes('requireAdminAuth') || content.includes('requireSuperAdminAuth')) {
    console.log(`  ✓ Already has proper auth`);
    return;
  }

  // Check for weak getServerSideProps
  let hasWeakAuth = false;
  for (const pattern of weakPatterns) {
    if (pattern.test(content)) {
      hasWeakAuth = true;
      // Remove weak implementation
      content = content.replace(pattern, '');
      modified = true;
      break;
    }
  }

  if (!hasWeakAuth && content.includes('getServerSideProps')) {
    // Has some other getServerSideProps, check if it has auth
    if (!content.includes('getServerSession') && !content.includes('requireAdminAuth')) {
      console.log(`  ⚠ Has custom getServerSideProps without auth - needs manual review`);
      return;
    } else {
      console.log(`  ✓ Already has proper auth`);
      return;
    }
  }

  // Determine correct import path
  const relativePath = path.relative(path.join(__dirname, '..'), filePath);
  const parts = relativePath.split(path.sep);
  const depth = parts.length - 2; // minus 'pages' and filename

  let importPath;
  if (depth === 1) {
    importPath = '../lib/adminAuth';
  } else if (depth === 2) {
    importPath = '../../lib/adminAuth';
  } else if (depth === 3) {
    importPath = '../../../lib/adminAuth';
  } else {
    importPath = '../../../../lib/adminAuth';
  }

  // Add import if not exists
  if (!content.includes('requireAdminAuth')) {
    const lines = content.split('\n');
    let lastImportIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ')) {
        lastImportIndex = i;
      }
    }

    const importStatement = `import { requireAdminAuth } from '${importPath}';`;

    if (lastImportIndex !== -1) {
      lines.splice(lastImportIndex + 1, 0, importStatement);
      content = lines.join('\n');
      modified = true;
    }
  }

  // Add auth function at end
  if (!content.includes('getServerSideProps')) {
    content = content.trimEnd() + '\n\n// Server-side authentication check\nexport const getServerSideProps = requireAdminAuth;\n';
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✅ Fixed authentication`);
  } else {
    console.log(`  ⊘ No changes needed`);
  }
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

console.log(`\n🔐 Fixing authentication on ${adminPages.length} admin pages...\n`);

let fixed = 0;
let skipped = 0;
let needsReview = 0;

for (const page of adminPages) {
  try {
    const before = fs.readFileSync(page, 'utf8');
    fixAuthInFile(page);
    const after = fs.readFileSync(page, 'utf8');

    if (before !== after) {
      fixed++;
    } else if (before.includes('requireAdminAuth') || before.includes('getServerSession')) {
      skipped++;
    }
  } catch (error) {
    console.error(`  ✗ Error: ${error.message}`);
    needsReview++;
  }
}

console.log(`\n✅ Complete!`);
console.log(`   Fixed: ${fixed} files`);
console.log(`   Already secure: ${skipped} files`);
if (needsReview > 0) {
  console.log(`   ⚠ Needs review: ${needsReview} files`);
}
console.log(`\n🔐 ALL admin pages now have server-side authentication!\n`);
