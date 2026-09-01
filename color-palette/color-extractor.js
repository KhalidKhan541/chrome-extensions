const ColorExtractor = (() => {
  function extractFromImage(image, numColors = 6) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const maxSize = 200;
      let w = image.naturalWidth || image.width;
      let h = image.naturalHeight || image.height;

      if (w > maxSize || h > maxSize) {
        const ratio = Math.min(maxSize / w, maxSize / h);
        w = Math.floor(w * ratio);
        h = Math.floor(h * ratio);
      }

      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(image, 0, 0, w, h);

      const imageData = ctx.getImageData(0, 0, w, h);
      const pixels = imageData.data;
      const colorMap = {};

      for (let i = 0; i < pixels.length; i += 4) {
        const r = Math.round(pixels[i] / 16) * 16;
        const g = Math.round(pixels[i + 1] / 16) * 16;
        const b = Math.round(pixels[i + 2] / 16) * 16;
        const a = pixels[i + 3];

        if (a < 128) continue;
        if (r > 240 && g > 240 && b > 240) continue;
        if (r < 15 && g < 15 && b < 15) continue;

        const key = `${r},${g},${b}`;
        colorMap[key] = (colorMap[key] || 0) + 1;
      }

      const colors = Object.entries(colorMap)
        .map(([key, count]) => {
          const [r, g, b] = key.split(',').map(Number);
          return { r, g, b, count };
        })
        .sort((a, b) => b.count - a.count);

      const quantized = medianCut(colors, numColors);
      const result = quantized.map(c => ({
        hex: rgbToHex(c.r, c.g, c.b),
        r: c.r,
        g: c.g,
        b: c.b,
        hsl: rgbToHsl(c.r, c.g, c.b)
      }));

      resolve(result);
    });
  }

  function medianCut(colors, numColors) {
    if (colors.length === 0) return [];
    if (numColors <= 1) return [averageColor(colors)];

    let buckets = [colors];

    while (buckets.length < numColors) {
      let longestBucket = 0;
      let longestRange = 0;

      buckets.forEach((bucket, i) => {
        const range = getColorRange(bucket);
        if (range.max - range.min > longestRange) {
          longestRange = range.max - range.min;
          longestBucket = i;
        }
      });

      const bucket = buckets.splice(longestBucket, 1)[0];
      const range = getColorRange(bucket);
      const channel = range.channel;

      bucket.sort((a, b) => a[channel] - b[channel]);

      const mid = Math.floor(bucket.length / 2);
      buckets.push(bucket.slice(0, mid), bucket.slice(mid));
    }

    return buckets.map(averageColor);
  }

  function getColorRange(colors) {
    const ranges = ['r', 'g', 'b'].map(ch => {
      const values = colors.map(c => c[ch]);
      return {
        channel: ch,
        min: Math.min(...values),
        max: Math.max(...values)
      };
    });

    return ranges.reduce((a, b) =>
      (b.max - b.min > a.max - a.min) ? b : a
    );
  }

  function averageColor(colors) {
    const total = colors.reduce((sum, c) => sum + c.count, 0);
    const r = Math.round(colors.reduce((sum, c) => sum + c.r * c.count, 0) / total);
    const g = Math.round(colors.reduce((sum, c) => sum + c.g * c.count, 0) / total);
    const b = Math.round(colors.reduce((sum, c) => sum + c.b * c.count, 0) / total);
    return { r, g, b, count: total };
  }

  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
      const hex = Math.max(0, Math.min(255, x)).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }

  function hslToRgb(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }

  return { extractFromImage, rgbToHex, rgbToHsl, hslToRgb };
})();
