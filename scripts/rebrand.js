import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const directory = path.resolve(__dirname, '..');

const ignoreDirs = ['node_modules', '.git', '.next', 'out', 'scripts', '.vscode', '.husky'];
const ignoreExts = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.svg', '.mov', '.mp4'];

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (!ignoreDirs.includes(file)) {
        walkDir(fullPath);
      }
    } else {
      const ext = path.extname(fullPath).toLowerCase();
      if (!ignoreExts.includes(ext) && file !== 'package-lock.json' && file !== 'rebrand.js') {
        replaceInFile(fullPath);
      }
    }
  }
}

function replaceInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // Replace "PDFCraft" -> "K-PDF"
    content = content.replace(/PDFCraft/g, 'K-PDF');
    
    // Replace "pdfcraft" -> "k-pdf"
    content = content.replace(/pdfcraft/g, 'k-pdf');
    
    // Replace "PDFCRAFT" -> "K-PDF"
    content = content.replace(/PDFCRAFT/g, 'K-PDF');

    // Replace some github/social links immediately or we can do it manually.
    // For now, let's keep it to branding names.

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated: ${filePath.replace(directory, '')}`);
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
}

console.log('Starting rebranding replacement...');
walkDir(directory);
console.log('Rebranding complete.');
