/**
 * Convert SVG icons to PNG using canvas.
 * Run this script in a browser console or Node.js with canvas package.
 * 
 * For Chrome extensions, you need actual PNG files.
 * Easiest approach: open each SVG in a browser, right-click > Save as PNG.
 * 
 * Or use an online converter like: https://convertio.co/svg-png/
 * 
 * Files needed:
 *   icons/icon16.png
 *   icons/icon32.png
 *   icons/icon48.png
 *   icons/icon128.png
 */

const sizes = [16, 32, 48, 128];

// Quick browser-based conversion if run in console:
if (typeof document !== 'undefined') {
  sizes.forEach(size => {
    const svg = document.querySelector('svg');
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const svgBlob = new Blob([svg.outerHTML], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      const link = document.createElement('a');
      link.download = `icon${size}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}
