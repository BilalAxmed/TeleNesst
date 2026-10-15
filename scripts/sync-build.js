import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');
const publicAppBuildDir = path.resolve('public/app-build');

if (!fs.existsSync(distDir)) {
  console.error('[sync-build] dist directory not found.');
  process.exit(1);
}

const htmlPath = path.join(distDir, 'index.html');
if (!fs.existsSync(htmlPath)) {
  console.error('[sync-build] dist/index.html not found.');
  process.exit(1);
}

// Clean up any nested app-build folder
const nestedDistAppBuild = path.join(distDir, 'app-build');
if (fs.existsSync(nestedDistAppBuild)) {
  fs.rmSync(nestedDistAppBuild, { recursive: true, force: true });
}

// Clean up any stale pre-packaged downloads in dist and public so only live dynamic packaging is used
const staleDownloads = [
  path.join(distDir, 'downloads', 'TeleNest-Portable.zip'),
  path.join(distDir, 'downloads', 'TeleNest-Offline-SingleFile.html'),
  path.join(path.resolve('public'), 'downloads', 'TeleNest-Portable.zip'),
  path.join(path.resolve('public'), 'downloads', 'TeleNest-Offline-SingleFile.html'),
];
for (const p of staleDownloads) {
  if (fs.existsSync(p)) {
    fs.rmSync(p, { force: true });
  }
}

const html = fs.readFileSync(htmlPath, 'utf-8');
const assetsDir = path.join(distDir, 'assets');
const assetFiles = fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir) : [];

const assets = {};
const assetList = [];

for (const file of assetFiles) {
  const fullPath = path.join(assetsDir, file);
  if (fs.statSync(fullPath).isFile()) {
    if (file.endsWith('.js') || file.endsWith('.css') || file.endsWith('.svg') || file.endsWith('.ico') || file.endsWith('.json')) {
      const relPath = 'assets/' + file;
      assetList.push(relPath);
      assets[relPath] = fs.readFileSync(fullPath, 'utf-8');
    }
  }
}

// 1. Generate clean manifest.json
const manifest = {
  html: 'index.html',
  assets: assetList,
  buildTime: new Date().toISOString(),
};
fs.writeFileSync(path.join(distDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

// 2. Generate atomic bundle.json
const bundle = {
  success: true,
  html,
  assets,
  buildTime: new Date().toISOString(),
};
fs.writeFileSync(path.join(distDir, 'bundle.json'), JSON.stringify(bundle));

// 3. Clean and populate public/app-build
if (fs.existsSync(publicAppBuildDir)) {
  fs.rmSync(publicAppBuildDir, { recursive: true, force: true });
}
fs.mkdirSync(publicAppBuildDir, { recursive: true });

// Copy only top-level files and assets
fs.copyFileSync(htmlPath, path.join(publicAppBuildDir, 'index.html'));
fs.copyFileSync(path.join(distDir, 'manifest.json'), path.join(publicAppBuildDir, 'manifest.json'));
fs.copyFileSync(path.join(distDir, 'bundle.json'), path.join(publicAppBuildDir, 'bundle.json'));

const publicAssetsDir = path.join(publicAppBuildDir, 'assets');
fs.mkdirSync(publicAssetsDir, { recursive: true });
for (const file of assetFiles) {
  const fullPath = path.join(assetsDir, file);
  if (fs.statSync(fullPath).isFile()) {
    fs.copyFileSync(fullPath, path.join(publicAssetsDir, file));
  }
}

console.log(`[sync-build] Successfully synchronized clean dist into public/app-build (${assetList.length} assets).`);
