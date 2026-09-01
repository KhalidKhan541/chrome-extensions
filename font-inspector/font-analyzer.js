const FontAnalyzer = (() => {
  const SYSTEM_FONTS = [
    'Arial', 'Helvetica', 'Times New Roman', 'Times', 'Courier New', 'Courier',
    'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS', 'Trebuchet MS',
    'Impact', 'Lucida Console', 'Tahoma', 'Verdana', 'Geneva', 'Lucida Grande',
    'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans',
    'Droid Sans', 'Open Sans', 'Lato', 'Montserrat', 'Source Sans Pro',
    'Noto Sans', 'IBM Plex Sans', 'Inter', 'system-ui', '-apple-system',
    'BlinkMacSystemFont', 'sans-serif', 'serif', 'monospace', 'cursive', 'fantasy'
  ];

  function extractFontData(element) {
    const computed = window.getComputedStyle(element);
    const fontFamily = computed.fontFamily;
    const fontSize = computed.fontSize;
    const fontWeight = computed.fontWeight;
    const lineHeight = computed.lineHeight;
    const letterSpacing = computed.letterSpacing;
    const wordSpacing = computed.wordSpacing;
    const color = computed.color;
    const textAlign = computed.textAlign;

    return {
      fontFamily,
      fontSize,
      fontWeight,
      lineHeight,
      letterSpacing,
      wordSpacing,
      color: rgbToHex(color),
      textAlign,
      tag: element.tagName.toLowerCase(),
      className: element.className,
      id: element.id
    };
  }

  function rgbToHex(rgb) {
    if (rgb.startsWith('#')) return rgb;
    if (rgb === 'transparent' || rgb === 'inherit') return rgb;

    const match = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)$/);
    if (!match) return rgb;

    const r = parseInt(match[1], 10);
    const g = parseInt(match[2], 10);
    const b = parseInt(match[3], 10);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  function parseFontFamily(fontFamily) {
    return fontFamily
      .split(',')
      .map(f => f.trim().replace(/['"]/g, ''))
      .filter(f => f.length > 0);
  }

  function isSystemFont(family) {
    const normalized = family.toLowerCase().trim();
    return SYSTEM_FONTS.some(sf => sf.toLowerCase() === normalized);
  }

  function getAllPageFonts() {
    const fonts = new Map();
    const elements = document.querySelectorAll('*');

    elements.forEach(el => {
      const computed = window.getComputedStyle(el);
      const fontFamily = computed.fontFamily;
      const families = parseFontFamily(fontFamily);

      families.forEach(family => {
        if (!fonts.has(family)) {
          const fontFaces = findFontFace(family);
          fonts.set(family, {
            family,
            isSystem: isSystemFont(family),
            isLoaded: checkFontLoaded(family),
            sources: fontFaces ? fontFaces.map(ff => ff.src) : [],
            weight: fontFaces ? fontFaces.map(ff => ff.weight) : [],
            style: fontFaces ? fontFaces.map(ff => ff.style) : []
          });
        }
      });
    });

    return Array.from(fonts.values());
  }

  function findFontFace(family) {
    const fontFaces = [];

    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule instanceof CSSFontFaceRule) {
            const ruleFamily = rule.style.getPropertyValue('font-family').replace(/['"]/g, '').trim();
            if (ruleFamily.toLowerCase() === family.toLowerCase()) {
              fontFaces.push({
                family: ruleFamily,
                src: rule.style.getPropertyValue('src'),
                weight: rule.style.getPropertyValue('font-weight') || 'normal',
                style: rule.style.getPropertyValue('font-style') || 'normal',
                display: rule.style.getPropertyValue('font-display') || 'auto'
              });
            }
          }
        }
      } catch (e) {
        continue;
      }
    }

    return fontFaces.length > 0 ? fontFaces : null;
  }

  function checkFontLoaded(family) {
    return document.fonts.check(`16px "${family}"`);
  }

  function waitForFontLoad(family, timeout = 3000) {
    return new Promise((resolve) => {
      if (document.fonts.check(`16px "${family}"`)) {
        resolve(true);
        return;
      }

      const fontFace = [...document.fonts].find(f => f.family === family);
      if (fontFace) {
        fontFace.load().then(() => resolve(true)).catch(() => resolve(false));
        return;
      }

      const testElement = document.createElement('span');
      testElement.style.cssText = `
        position: absolute;
        left: -9999px;
        top: -9999px;
        font-family: "${family}";
        font-size: 72px;
        visibility: hidden;
      `;
      testElement.textContent = 'mmmmmmmmmmlli';
      document.body.appendChild(testElement);

      const baseline = testElement.getBoundingClientRect().width;

      let elapsed = 0;
      const interval = 50;

      const timer = setInterval(() => {
        elapsed += interval;
        const current = testElement.getBoundingClientRect().width;

        if (current !== baseline || elapsed >= timeout) {
          clearInterval(timer);
          testElement.remove();
          resolve(current !== baseline);
        }
      }, interval);
    });
  }

  function getFontSubsets(src) {
    const subsets = [];
    if (src.includes('latin')) subsets.push('latin');
    if (src.includes('latin-ext')) subsets.push('latin-ext');
    if (src.includes('cyrillic')) subsets.push('cyrillic');
    if (src.includes('cyrillic-ext')) subsets.push('cyrillic-ext');
    if (src.includes('greek')) subsets.push('greek');
    if (src.includes('greek-ext')) subsets.push('greek-ext');
    if (src.includes('vietnamese')) subsets.push('vietnamese');
    if (src.includes('chinese')) subsets.push('chinese');
    if (src.includes('japanese')) subsets.push('japanese');
    if (src.includes('korean')) subsets.push('korean');
    return subsets.length > 0 ? subsets : ['latin'];
  }

  function getFontVariations(family) {
    const variations = {
      weights: [],
      styles: []
    };

    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule instanceof CSSFontFaceRule) {
            const ruleFamily = rule.style.getPropertyValue('font-family').replace(/['"]/g, '').trim();
            if (ruleFamily.toLowerCase() === family.toLowerCase()) {
              const weight = rule.style.getPropertyValue('font-weight') || 'normal';
              const style = rule.style.getPropertyValue('font-style') || 'normal';

              if (!variations.weights.includes(weight)) {
                variations.weights.push(weight);
              }
              if (!variations.styles.includes(style)) {
                variations.styles.push(style);
              }
            }
          }
        }
      } catch (e) {
        continue;
      }
    }

    return variations;
  }

  return {
    extractFontData,
    parseFontFamily,
    isSystemFont,
    getAllPageFonts,
    findFontFace,
    checkFontLoaded,
    waitForFontLoad,
    getFontSubsets,
    getFontVariations
  };
})();
