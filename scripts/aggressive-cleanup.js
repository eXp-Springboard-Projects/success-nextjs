#!/usr/bin/env node
/**
 * AGGRESSIVE Console Statement Remover
 * 
 * This removes ALL console.log/error/warn/info/debug statements
 * from production code (pages/, lib/, components/)
 */

const fs = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run');

// Production directories only
const DIRS = ['pages', 'lib', 'components'];

// Skip these
const SKIP = [
  'node_modules',
  '.next',
  'scripts/',
  'lib/logger.ts', // Keep the logger itself
];

let stats = { files: 0, modified: 0, removed: 0 };

function shouldSkip(p) {
  return SKIP.some(s => p.includes(s));
}

function removeConsoleStatements(content, filePath) {
  let removed = 0;
  let result = content;
  
  // Pattern to match console.X( ... ); including multi-line
  // This is aggressive - matches console.log/error/warn/info/debug
  const patterns = [
    // Single line console statements
    /^\s*console\.(log|error|warn|info|debug)\([^)]*\);\s*$/gm,
    // Multi-line console statements (handles most cases)
    /^\s*console\.(log|error|warn|info|debug)\([^;]*;\s*$/gm,
    // console.X('msg', var);
    /^\s*console\.(log|error|warn|info|debug)\(['"`][^'"]*['"`]\s*,\s*\w+\);\s*$/gm,
    // console.X('msg:', var);
    /^\s*console\.(log|error|warn|info|debug)\(['"`][^'"]*:?\s*['"`]\s*,\s*[^)]+\);\s*$/gm,
  ];
  
  // First pass - count how many we'll remove
  const allConsole = content.match(/console\.(log|error|warn|info|debug)\(/g) || [];
  const originalCount = allConsole.length;
  
  // More aggressive approach - line by line removal
  const lines = result.split('\n');
  const newLines = [];
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Check if this line starts a console statement
    if (/^\s*console\.(log|error|warn|info|debug)\(/.test(line)) {
      // Check if it ends on same line
      if (/\);\s*$/.test(line)) {
        // Single line - skip it
        removed++;
        i++;
        continue;
      }
      
      // Multi-line - find the end
      let fullStatement = line;
      let parenCount = (line.match(/\(/g) || []).length - (line.match(/\)/g) || []).length;
      let j = i + 1;
      
      while (j < lines.length && parenCount > 0) {
        fullStatement += '\n' + lines[j];
        parenCount += (lines[j].match(/\(/g) || []).length;
        parenCount -= (lines[j].match(/\)/g) || []).length;
        j++;
      }
      
      // Skip all lines of this statement
      removed++;
      i = j;
      continue;
    }
    
    newLines.push(line);
    i++;
  }
  
  result = newLines.join('\n');
  
  // Clean up excessive blank lines
  result = result.replace(/\n{3,}/g, '\n\n');
  
  return { result, removed };
}

function processFile(filePath) {
  if (shouldSkip(filePath)) return;
  if (!/\.(js|jsx|ts|tsx)$/.test(filePath)) return;
  
  stats.files++;
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { result, removed } = removeConsoleStatements(content, filePath);
    
    if (removed > 0) {
      stats.modified++;
      stats.removed += removed;
      const rel = filePath.replace(process.cwd() + '/', '');
      console.log(`${DRY_RUN ? '[DRY] ' : '✓ '}${rel} (-${removed})`);
      
      if (!DRY_RUN) {
        fs.writeFileSync(filePath, result, 'utf8');
      }
    }
  } catch (e) {
    console.error(`Error: ${filePath}: ${e.message}`);
  }
}

function processDir(dir) {
  if (!fs.existsSync(dir)) return;
  
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (shouldSkip(full)) continue;
    
    if (entry.isDirectory()) {
      processDir(full);
    } else {
      processFile(full);
    }
  }
}

console.log('🔥 AGGRESSIVE Console Statement Remover');
console.log(DRY_RUN ? '   Mode: DRY RUN\n' : '\n');

const root = process.cwd();
for (const dir of DIRS) {
  console.log(`Processing ${dir}/...`);
  processDir(path.join(root, dir));
}

console.log('\n📊 Results:');
console.log(`   Files scanned: ${stats.files}`);
console.log(`   Files modified: ${stats.modified}`);
console.log(`   Statements removed: ${stats.removed}`);

if (DRY_RUN) {
  console.log('\n💡 Run without --dry-run to apply');
}

