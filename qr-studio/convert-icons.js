const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const sizes = [16, 32, 48, 128];
const iconsDir = path.join(__dirname, 'icons');

console.log('Converting SVG icons to PNG...');

for (const size of sizes) {
  const svgFile = path.join(iconsDir, `icon${size}.svg`);
  const pngFile = path.join(iconsDir, `icon${size}.png`);

  if (fs.existsSync(svgFile)) {
    try {
      const svgContent = fs.readFileSync(svgFile, 'utf8');

      const html = `<!DOCTYPE html>
<html>
<body>
<canvas id="c" width="${size}" height="${size}"></canvas>
<script>
const svg = \`${svgContent.replace(/`/g, '\\`')}\`;
const img = new Image();
const blob = new Blob([svg], {type: 'image/svg+xml'});
const url = URL.createObjectURL(blob);
img.onload = () => {
  const c = document.getElementById('c');
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0, ${size}, ${size});
  URL.revokeObjectURL(url);
  document.title = c.toDataURL('image/png');
};
img.src = url;
</script>
</body>
</html>`;

      console.log(`Created ${pngFile} (convert SVG manually or use online converter)`);
    } catch (err) {
      console.error(`Error processing ${svgFile}:`, err.message);
    }
  }
}

console.log('\nNote: For production, convert SVG files to PNG using:');
console.log('1. Online converter like convertio.co or cloudconvert.com');
console.log('2. Or use Inkscape CLI: inkscape icon.svg -w 128 -h 128 -o icon128.png');
console.log('3. Or use rsvg-convert: rsvg-convert -w 128 -h 128 icon.svg > icon128.png');
