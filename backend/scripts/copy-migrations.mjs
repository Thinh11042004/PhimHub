#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const srcDir = path.resolve(process.cwd(), 'src', 'migrations');
const destDir = path.resolve(process.cwd(), 'dist', 'migrations');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copyMigrations() {
  if (!fs.existsSync(srcDir)) {
    console.log('No src/migrations directory found. Skipping copy.');
    return;
  }
  ensureDir(destDir);
  const files = fs.readdirSync(srcDir).filter(f => f.toLowerCase().endsWith('.sql'));
  for (const file of files) {
    fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
  }
  console.log(`Copied ${files.length} migration file(s) to dist/migrations`);
}

copyMigrations();