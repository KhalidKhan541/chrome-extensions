const ExportFormatter = (() => {
  function toCSS(palette, name = 'palette') {
    const lines = palette.map((c, i) => `  --${name}-${i + 1}: ${c.hex};`);
    return `:root {\n${lines.join('\n')}\n}`;
  }

  function toTailwind(palette, name = 'brand') {
    const colors = {};
    palette.forEach((c, i) => { colors[(i + 1) * 100] = c.hex; });
    return `module.exports = {\n  theme: {\n    extend: {\n      colors: {\n        '${name}': ${JSON.stringify(colors, null, 10).replace(/^/gm, '        ').trim()}\n      }\n    }\n  }\n}`;
  }

  function toSCSS(palette, name = 'palette') {
    return palette.map((c, i) => `$${name}-${i + 1}: ${c.hex};`).join('\n');
  }

  function toJSON(palette, name = 'palette') {
    return JSON.stringify({
      name,
      colors: palette.map((c, i) => ({
        name: `color-${i + 1}`,
        hex: c.hex,
        rgb: `rgb(${c.r}, ${c.g}, ${c.b})`,
        hsl: `hsl(${c.hsl.h}, ${c.hsl.s}%, ${c.hsl.l}%)`
      }))
    }, null, 2);
  }

  function toText(palette) {
    return palette.map(c => c.hex).join('\n');
  }

  function format(palette, type, name) {
    switch (type) {
      case 'css': return toCSS(palette, name);
      case 'tailwind': return toTailwind(palette, name);
      case 'scss': return toSCSS(palette, name);
      case 'json': return toJSON(palette, name);
      case 'text': return toText(palette);
      default: return toText(palette);
    }
  }

  return { format, toCSS, toTailwind, toSCSS, toJSON, toText };
})();
