const ColorHarmony = (() => {
  function complementary(hex) {
    const { h, s, l } = hexToHsl(hex);
    return [
      hslToHex(h, s, l),
      hslToHex((h + 180) % 360, s, l),
      hslToHex(h, s, Math.max(l - 20, 10)),
      hslToHex(h, s, Math.min(l + 20, 90)),
      hslToHex((h + 180) % 360, s, Math.max(l - 20, 10)),
      hslToHex((h + 180) % 360, s, Math.min(l + 20, 90))
    ];
  }

  function analogous(hex) {
    const { h, s, l } = hexToHsl(hex);
    return [
      hslToHex(h, s, l),
      hslToHex((h + 30) % 360, s, l),
      hslToHex((h + 60) % 360, s, l),
      hslToHex((h - 30 + 360) % 360, s, l),
      hslToHex((h - 60 + 360) % 360, s, l),
      hslToHex((h + 15) % 360, s, l)
    ];
  }

  function triadic(hex) {
    const { h, s, l } = hexToHsl(hex);
    return [
      hslToHex(h, s, l),
      hslToHex((h + 120) % 360, s, l),
      hslToHex((h + 240) % 360, s, l),
      hslToHex(h, s, Math.max(l - 15, 10)),
      hslToHex((h + 120) % 360, s, Math.max(l - 15, 10)),
      hslToHex((h + 240) % 360, s, Math.max(l - 15, 10))
    ];
  }

  function splitComplementary(hex) {
    const { h, s, l } = hexToHsl(hex);
    return [
      hslToHex(h, s, l),
      hslToHex((h + 150) % 360, s, l),
      hslToHex((h + 210) % 360, s, l),
      hslToHex(h, s, Math.max(l - 20, 10)),
      hslToHex((h + 150) % 360, s, Math.min(l + 15, 90)),
      hslToHex((h + 210) % 360, s, Math.min(l + 15, 90))
    ];
  }

  function tetradic(hex) {
    const { h, s, l } = hexToHsl(hex);
    return [
      hslToHex(h, s, l),
      hslToHex((h + 90) % 360, s, l),
      hslToHex((h + 180) % 360, s, l),
      hslToHex((h + 270) % 360, s, l),
      hslToHex(h, s, Math.max(l - 20, 10)),
      hslToHex((h + 180) % 360, s, Math.min(l + 20, 90))
    ];
  }

  function generate(hex, type) {
    switch (type) {
      case 'complementary': return complementary(hex);
      case 'analogous': return analogous(hex);
      case 'triadic': return triadic(hex);
      case 'split': return splitComplementary(hex);
      case 'tetradic': return tetradic(hex);
      default: return complementary(hex);
    }
  }

  function hexToHsl(hex) {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

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

    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  }

  function hslToHex(h, s, l) {
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

    return '#' + [r, g, b].map(x => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }

  return { generate, complementary, analogous, triadic, splitComplementary, tetradic };
})();
