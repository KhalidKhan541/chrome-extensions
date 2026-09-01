#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const { validateManifest } = require('./validate-manifest.js');

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;

  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

function getExtensionFiles(extPath) {
  const files = [];
  const extDir = fs.readdirSync(extPath);

  for (const entry of extDir) {
    const fullPath = path.join(extPath, entry);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (entry.startsWith('.') || entry === 'node_modules' || entry === 'dist' || entry === 'tests') {
        continue;
      }
      const subFiles = getExtensionFiles(fullPath);
      files.push(...subFiles);
    } else {
      const ext = path.extname(entry).toLowerCase();
      const validExts = ['.json', '.html', '.js', '.css', '.png', '.svg', '.jpg', '.jpeg', '.gif', '.webp', '.woff', '.woff2', '.ttf', '.eot', '.map', '.txt', '.md', '.ico'];
      const excludeFiles = ['package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', '.gitignore', '.prettierrc', 'babel.config.js', 'jest.config.js', 'tsconfig.json', 'webpack.config.js', 'rollup.config.js', 'vite.config.js', 'README.md', 'CHANGELOG.md', 'LICENSE', 'SECURITY.md', 'CONTRIBUTING.md', 'CODE_OF_CONDUCT.md'];
      if (validExts.includes(ext) || entry === 'manifest.json') {
        if (!excludeFiles.includes(entry)) {
          files.push(fullPath);
        }
      }
    }
  }

  return files;
}

function createZip(distDir, zipName) {
  const zipPath = path.join(distDir, zipName);
  const cmd = process.platform === 'win32'
    ? `powershell -Command "Compress-Archive -Path '${distDir}\\*' -DestinationPath '${zipPath}' -Force"`
    : `cd "${distDir}" && zip -r "${zipName}" .`;

  try {
    execSync(cmd, { stdio: 'inherit' });
    return zipPath;
  } catch (e) {
    throw new Error(`Failed to create zip: ${e.message}`);
  }
}

function buildExtension(extName) {
  const rootDir = process.cwd();
  const extPath = path.join(rootDir, extName);
  const distDir = path.join(rootDir, 'dist', extName);

  console.log(`\n🔨 Building extension: ${extName}\n`);

  if (!fs.existsSync(extPath)) {
    console.error(`❌ Extension folder not found: ${extPath}`);
    process.exit(1);
  }

  const manifestPath = path.join(extPath, 'manifest.json');
  console.log('📋 Validating manifest...');
  const validation = validateManifest(manifestPath);

  if (!validation.valid) {
    console.error('\n❌ Manifest validation failed:');
    for (const err of validation.errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  for (const warn of validation.warnings) {
    console.warn(`  ⚠️  ${warn}`);
  }

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  } catch (e) {
    console.error(`❌ Failed to parse manifest: ${e.message}`);
    process.exit(1);
  }

  const version = manifest.version || '1.0.0';
  const zipName = `${extName}-v${version}.zip`;

  console.log('\n📁 Creating dist folder...');
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true });
  }
  fs.mkdirSync(distDir, { recursive: true });

  console.log('📦 Copying files...');
  const files = getExtensionFiles(extPath);
  let copied = 0;

  for (const file of files) {
    const relativePath = path.relative(extPath, file);
    const destPath = path.join(distDir, relativePath);
    const destDir = path.dirname(destPath);

    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    fs.copyFileSync(file, destPath);
    copied++;
    console.log(`  ✓ ${relativePath}`);
  }

  console.log(`\n📦 Creating zip: ${zipName}...`);
  const zipPath = createZip(distDir, zipName);

  const stats = fs.statSync(zipPath);
  const sizeKB = (stats.size / 1024).toFixed(2);

  console.log('\n' + '='.repeat(50));
  console.log('📊 BUILD SUMMARY');
  console.log('='.repeat(50));
  console.log(`Extension:      ${extName}`);
  console.log(`Version:        ${version}`);
  console.log(`Name:           ${manifest.name}`);
  console.log(`Description:    ${manifest.description || 'N/A'}`);
  console.log(`Files copied:   ${copied}`);
  console.log(`Output zip:     ${zipPath}`);
  console.log(`Zip size:       ${sizeKB} KB`);
  console.log(`Manifest valid: ✅ Yes`);
  console.log('='.repeat(50) + '\n');

  return { extName, version, zipPath, filesCopied: copied };
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: node build-extension.js <extension-folder-name>');
    console.error('\nAvailable extensions:');
    const rootDir = process.cwd();
    for (const entry of fs.readdirSync(rootDir)) {
      const fullPath = path.join(rootDir, entry);
      if (fs.statSync(fullPath).isDirectory() && fs.existsSync(path.join(fullPath, 'manifest.json'))) {
        console.error(`  - ${entry}`);
      }
    }
    process.exit(1);
  }

  const extName = args[0];
  buildExtension(extName);
}

if (require.main === module) {
  main();
}

module.exports = { buildExtension, getExtensionFiles };