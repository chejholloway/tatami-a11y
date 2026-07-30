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

// Copy dist/index.js to surge/index.js
const distIndexPath = path.join(distDir, 'index.js');
const surgeIndexPath = path.join(surgeDir, 'index.js');
if (fs.existsSync(distIndexPath)) {
  fs.copyFileSync(distIndexPath, surgeIndexPath);
  console.log('✓ Copied dist/index.js to surge/index.js');
} else {
  console.warn('⚠ dist/index.js not found, skipping');
}

// Copy demo/favicon.ico to surge/favicon.ico
const icoPath = path.join(demoDir, 'favicon.ico');
const surgeIcoPath = path.join(surgeDir, 'favicon.ico');
if (fs.existsSync(icoPath)) {
  fs.copyFileSync(icoPath, surgeIcoPath);
  console.log('✓ Copied demo/favicon.ico to surge/favicon.ico');
} else {
  console.warn('⚠ demo/favicon.ico not found, skipping');
}

// Copy demo/style-modern.css to surge/style-modern.css
const cssPath = path.join(demoDir, 'style-modern.css');
const surgeCssPath = path.join(surgeDir, 'style-modern.css');
if (fs.existsSync(cssPath)) {
  fs.copyFileSync(cssPath, surgeCssPath);
  console.log('✓ Copied demo/style-modern.css to surge/style-modern.css');
} else {
  console.warn('⚠ demo/style-modern.css not found, skipping');
}


// Copy demo/index.html to surge/index.html and fix paths
const demoHtmlPath = path.join(demoDir, 'index.html');
const surgeHtmlPath = path.join(surgeDir, 'index.html');
if (fs.existsSync(demoHtmlPath)) {
  let htmlContent = fs.readFileSync(demoHtmlPath, 'utf-8');
  htmlContent = htmlContent.replace(/'\.\.\/dist\/index\.js'/g, "'./index.js'");
  fs.writeFileSync(surgeHtmlPath, htmlContent);
  console.log('✓ Copied demo/index.html to surge/index.html (fixed paths)');
} else {
  console.warn('⚠ demo/index.html not found, skipping');
}

console.log('✓ Surge folder ready for deployment');
