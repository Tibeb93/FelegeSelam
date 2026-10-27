#!/usr/bin/env node

/**
 * verify-no-hardcoded-church.js
 * 
 * Scans the codebase for legacy hardcoded church names, cities, or placeholders.
 * Returns exit code 0 if clean, non-zero if violations are found.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

const SCAN_DIRS = [
  path.join(ROOT_DIR, 'api', 'src'),
  path.join(ROOT_DIR, 'web', 'src'),
  path.join(ROOT_DIR, 'web', 'public'),
];

// Patterns that MUST NOT appear as church/institution identity
const FORBIDDEN_PATTERNS = [
  { pattern: /ደብረ\s*ሰላም/i, name: 'ደብረ ሰላም (Legacy church name)' },
  { pattern: /Debre\s*Selam/i, name: 'Debre Selam (Legacy church name)' },
  { pattern: /ቅዱስ\s*እስጢፋኖስ/i, name: 'ቅዱስ እስጢፋኖስ (Legacy patron saint)' },
  { pattern: /Saint\s*Stephen/i, name: 'Saint Stephen (Legacy patron saint)' },
  { pattern: /St\.\s*Stephen/i, name: 'St. Stephen (Legacy patron saint)' },
  { pattern: /\+251\s*91\s*123\s*4567/, name: '+251 91 123 4567 (Placeholder phone)' },
  { pattern: /info@aemade\.org/, name: 'info@aemade.org (Placeholder email)' },
  { pattern: /አዲስ\s*አበባ/, name: 'አዲስ አበባ (Legacy city, should be ፍኖተ ሰላም / Finote Selam)' },
  { pattern: /Addis\s*Ababa/i, name: 'Addis Ababa (Legacy city, should be Finote Selam)' },
];

const IGNORE_FILES = [
  // seeds and i18n are allowed by specification
  'seed.ts',
  'am.json',
  'en.json',
  'verify-no-hardcoded-church.js',
];

const IGNORE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.ico', '.woff', '.woff2', '.ttf', '.pdf'];

let totalViolations = 0;

function scanDirectory(dir) {
  if (!fs.existsSync(dir)) return;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (
        entry.name === 'node_modules' ||
        entry.name === '.next' ||
        entry.name === 'dist' ||
        entry.name === 'build' ||
        entry.name === 'coverage' ||
        entry.name === 'backups' ||
        entry.name === '.git'
      ) {
        continue;
      }
      scanDirectory(fullPath);
    } else if (entry.isFile()) {
      if (IGNORE_FILES.includes(entry.name)) continue;
      const ext = path.extname(entry.name).toLowerCase();
      if (IGNORE_EXTENSIONS.includes(ext)) continue;

      checkFile(fullPath);
    }
  }
}

function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      for (const item of FORBIDDEN_PATTERNS) {
        if (item.pattern.test(line)) {
          console.error(
            `\x1b[31m[VIOLATION]\x1b[0m ${path.relative(ROOT_DIR, filePath)}:${index + 1}`
          );
          console.error(`  Matched: ${item.name}`);
          console.error(`  Line content: ${line.trim()}`);
          totalViolations++;
        }
      }
    });
  } catch (err) {
    // binary or unreadable file
  }
}

console.log('======================================================');
console.log('Scanning FelegeSelam for hardcoded church/location...');
console.log('Target Church: ፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል (Felegeselam Kidus Giyorgis Cathedral)');
console.log('Target Location: ፍኖተ ሰላም፣ ምዕራብ ጎጃም (Finote Selam, West Gojjam)');
console.log('======================================================\n');

for (const dir of SCAN_DIRS) {
  scanDirectory(dir);
}

if (totalViolations > 0) {
  console.error(`\n\x1b[31mFAILED:\x1b[0m Found ${totalViolations} forbidden pattern(s) in codebase.`);
  process.exit(1);
} else {
  console.log('\x1b[32mPASSED:\x1b[0m No hardcoded legacy church names or placeholders found!');
  process.exit(0);
}
