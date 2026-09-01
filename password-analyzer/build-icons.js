const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPNG(width, height, drawFn) {
  const pixels = Buffer.alloc(width * height * 4, 0);
  drawFn(pixels, width, height);

  const rawData = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 4)] = 0; // filter none
    pixels.copy(rawData, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4);
  }

  const compressed = zlib.deflateSync(rawData);

  function crc32(buf) {
    let c = 0xffffffff;
    const table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let v = n;
      for (let k = 0; k < 8; k++) v = v & 1 ? 0xedb88320 ^ (v >>> 1) : v >>> 1;
      table[n] = v;
    }
    for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeData = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(typeData));
    return Buffer.concat([len, typeData, crc]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

function drawShield(pixels, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const scale = w / 128;

  function setPixel(x, y, r, g, b, a = 255) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || x >= w || y < 0 || y >= h) return;
    const idx = (y * w + x) * 4;
    const srcA = pixels[idx + 3] / 255;
    const dstA = a / 255;
    const outA = srcA + dstA * (1 - srcA);
    if (outA > 0) {
      pixels[idx] = Math.round((pixels[idx] * srcA + r * dstA * (1 - srcA)) / outA);
      pixels[idx + 1] = Math.round((pixels[idx + 1] * srcA + g * dstA * (1 - srcA)) / outA);
      pixels[idx + 2] = Math.round((pixels[idx + 2] * srcA + b * dstA * (1 - srcA)) / outA);
      pixels[idx + 3] = Math.round(outA * 255);
    }
  }

  function distToShield(px, py) {
    const sx = px - cx;
    const sy = py - cy;
    const topY = -50 * scale;
    const tipY = 48 * scale;
    const sideX = 46 * scale;

    if (sy < topY + 10 * scale) {
      const t = (sy - topY) / (10 * scale);
      const maxX = 2 * scale + t * (sideX - 2 * scale);
      return Math.max(0, Math.abs(sx) - maxX, topY - sy);
    }

    if (sy >= tipY) {
      const t = (sy - tipY) / (48 * scale);
      const maxX = sideX * (1 - t);
      return Math.max(0, Math.abs(sx) - maxX, sy - tipY);
    }

    const t = (sy - (topY + 10 * scale)) / (tipY - topY - 10 * scale);
    const maxX = sideX * (1 - t * 0.1);
    return Math.max(0, Math.abs(sx) - maxX);
  }

  // Draw shield with anti-aliasing
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const d = distToShield(x, y);
      if (d < 0) {
        // Inside shield - fill
        setPixel(x, y, 10, 22, 40, 255);
      } else if (d < 1.5 * scale) {
        // Edge - green glow
        const alpha = Math.round(255 * (1 - d / (1.5 * scale)));
        setPixel(x, y, 0, 255, 136, alpha);
      }
    }
  }

  // Lock body
  const lw = 22 * scale;
  const lh = 18 * scale;
  const lx = cx - lw / 2;
  const ly = cy - 2 * scale;

  for (let y = Math.floor(ly); y < Math.ceil(ly + lh); y++) {
    for (let x = Math.floor(lx); x < Math.ceil(lx + lw); x++) {
      const rx = lx + 2 * scale;
      const ry = ly + 2 * scale;
      const rw = lw - 4 * scale;
      const rh = lh - 2 * scale;
      const dx = Math.max(0, rx - x, x - (rx + rw));
      const dy = Math.max(0, ry - y, y - (ry + rh));
      const d = Math.sqrt(dx * dx + dy * dy) - 2 * scale;
      if (d < -0.5) {
        setPixel(x, y, 0, 255, 136, 255);
      } else if (d < 1) {
        setPixel(x, y, 0, 255, 136, Math.round(255 * (1 - d)));
      }
    }
  }

  // Lock shackle (arc)
  const shackleR = 8 * scale;
  const shackleCx = cx;
  const shackleCy = ly;
  for (let y = Math.floor(shackleCy - shackleR - 2); y < Math.ceil(shackleCy + 2); y++) {
    for (let x = Math.floor(shackleCx - shackleR - 2); x < Math.ceil(shackleCx + shackleR + 2); x++) {
      const dx = x - shackleCx;
      const dy = y - shackleCy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dy < 0 && dist >= shackleR - 1.5 * scale && dist <= shackleR + 1.5 * scale) {
        const alpha = 255 - Math.round(255 * Math.max(0, Math.abs(dist - shackleR) - 1.5 * scale) / scale);
        if (alpha > 0) setPixel(x, y, 0, 255, 136, alpha);
      }
    }
  }

  // Keyhole
  const khX = cx;
  const khY = ly + 6 * scale;
  for (let y = Math.floor(khY - 3 * scale); y < Math.ceil(khY + 7 * scale); y++) {
    for (let x = Math.floor(khX - 2.5 * scale); x < Math.ceil(khX + 2.5 * scale); x++) {
      const dx = x - khX;
      const dy = y - khY;
      const circleD = Math.sqrt(dx * dx + dy * dy) - 2 * scale;
      const rectD = Math.max(Math.abs(dx) - 1 * scale, 0, y > khY ? 0 : khY - y, y > khY + 5 * scale ? y - (khY + 5 * scale) : 0);
      const d = dy < 0 ? circleD : rectD;
      if (d < -0.5) {
        setPixel(x, y, 10, 22, 40, 255);
      } else if (d < 1) {
        setPixel(x, y, 10, 22, 40, Math.round(255 * (1 - d)));
      }
    }
  }
}

const iconsDir = path.join(__dirname, 'icons');
const sizes = [16, 32, 48, 128];

sizes.forEach(size => {
  const png = createPNG(size, size, drawShield);
  const filePath = path.join(iconsDir, `icon${size}.png`);
  fs.writeFileSync(filePath, png);
  console.log(`Created icon${size}.png (${png.length} bytes)`);
});

console.log('All icons generated successfully!');
