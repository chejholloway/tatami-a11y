import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const surgeDir = path.join(rootDir, 'surge');
const distDir = path.join(rootDir, 'dist');
const demoDir = path.join(rootDir, 'demo');

// Create surge directory if it doesn't exist
if (!fs.existsSync(surgeDir)) {
  fs.mkdirSync(surgeDir, { recursive: true });
}

// Copy dist folder
if (fs.existsSync(distDir)) {
  const surgeDistDir = path.join(surgeDir, 'dist');
  copyDirectory(distDir, surgeDistDir);
  console.log('✓ Copied dist to surge folder');
} else {
  console.warn('⚠ dist folder not found, skipping');
}

// Copy demo folder
if (fs.existsSync(demoDir)) {
  const surgeDemoDir = path.join(surgeDir, 'demo');
  copyDirectory(demoDir, surgeDemoDir);
  console.log('✓ Copied demo to surge folder');
} else {
  console.warn('⚠ demo folder not found, skipping');
}

console.log('✓ Surge folder ready for deployment');

function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
