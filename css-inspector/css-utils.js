const CSSUtils = (() => {
  const tempEl = document.createElement('div');
  document.documentElement.appendChild(tempEl);

  function rgbToHex(r, g, b) {
    const toHex = c => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
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

  function parseColor(str) {
    if (!str || str === 'transparent' || str === 'rgba(0, 0, 0, 0)' || str === 'rgb(0, 0, 0)') return null;
    tempEl.style.color = str;
    const computed = getComputedStyle(tempEl).color;
    const m = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!m) return null;
    return { r: +m[1], g: +m[2], b: +m[3], a: m[4] !== undefined ? +m[4] : 1 };
  }

  function colorToHex(str) {
    const c = parseColor(str);
    if (!c) return str;
    return rgbToHex(c.r, c.g, c.b);
  }

  function colorToRgb(str) {
    const c = parseColor(str);
    if (!c) return str;
    return c.a < 1 ? `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a})` : `rgb(${c.r}, ${c.g}, ${c.b})`;
  }

  function colorToHsl(str) {
    const c = parseColor(str);
    if (!c) return str;
    const hsl = rgbToHsl(c.r, c.g, c.b);
    return c.a < 1 ? `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${c.a})` : `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
  }

  function convertColor(str, format) {
    if (!parseColor(str)) return str;
    switch (format) {
      case 'hex': return colorToHex(str);
      case 'rgb': return colorToRgb(str);
      case 'hsl': return colorToHsl(str);
      default: return str;
    }
  }

  function parseUnit(str) {
    if (!str || str === 'auto' || str === 'normal') return { value: 0, unit: '' };
    const m = str.match(/^(-?[\d.]+)(px|em|rem|%|vh|vw|pt|cm|mm|in|ex|ch|vmin|vmax)?$/);
    if (!m) return { value: 0, unit: str };
    return { value: parseFloat(m[1]), unit: m[2] || 'px' };
  }

  function convertUnit(value, fromUnit, toUnit, basePx) {
    basePx = basePx || 16;
    let px = value;
    if (fromUnit === 'em' || fromUnit === 'rem') px = value * basePx;
    else if (fromUnit === '%') px = value * basePx / 100;
    else if (fromUnit === 'pt') px = value * 96 / 72;
    else if (fromUnit === 'cm') px = value * 96 / 2.54;
    else if (fromUnit === 'mm') px = value * 96 / 25.4;
    else if (fromUnit === 'in') px = value * 96;
    else if (fromUnit === 'vw') px = value * window.innerWidth / 100;
    else if (fromUnit === 'vh') px = value * window.innerHeight / 100;

    if (toUnit === 'px') return px;
    if (toUnit === 'em' || toUnit === 'rem') return px / basePx;
    if (toUnit === '%') return px / basePx * 100;
    if (toUnit === 'pt') return px * 72 / 96;
    return px;
  }

  function getPropertyCategory(prop) {
    const layout = ['display', 'position', 'top', 'right', 'bottom', 'left', 'float', 'clear',
      'flex', 'flex-direction', 'flex-wrap', 'flex-grow', 'flex-shrink', 'flex-basis',
      'justify-content', 'align-items', 'align-self', 'align-content',
      'grid', 'grid-template', 'grid-gap', 'grid-column', 'grid-row',
      'order', 'overflow', 'overflow-x', 'overflow-y', 'gap', 'row-gap', 'column-gap',
      'z-index', 'visibility', 'opacity', 'clip-path', 'mask'];
    const typography = ['font', 'font-family', 'font-size', 'font-weight', 'font-style', 'font-variant',
      'line-height', 'letter-spacing', 'word-spacing', 'text-align', 'text-decoration',
      'text-transform', 'text-indent', 'text-overflow', 'text-shadow', 'white-space',
      'word-break', 'word-wrap', 'color', '-webkit-text-fill-color', 'vertical-align',
      'list-style', 'quotes', 'direction', 'writing-mode'];
    const colors = ['color', 'background', 'background-color', 'border-color', 'outline-color',
      'box-shadow', 'text-shadow', 'fill', 'stroke', 'stop-color',
      'caret-color', 'column-rule-color', 'flood-color', 'lighting-color'];
    const spacing = ['margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
      'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
      'border-spacing', 'column-gap', 'row-gap', 'gap'];
    const sizing = ['width', 'min-width', 'max-width', 'height', 'min-height', 'max-height',
      'box-sizing', 'object-fit', 'resize', 'columns', 'column-width'];
    const position = ['position', 'top', 'right', 'bottom', 'left', 'inset',
      'transform', 'transform-origin', 'perspective', 'perspective-origin',
      'transition', 'animation', 'cursor', 'pointer-events', 'user-select'];

    const p = prop.toLowerCase();
    if (layout.includes(p)) return 'layout';
    if (typography.includes(p)) return 'typography';
    if (colors.includes(p)) return 'color';
    if (spacing.includes(p)) return 'spacing';
    if (sizing.includes(p)) return 'sizing';
    if (position.includes(p)) return 'position';
    return 'other';
  }

  const SHORTHANDS = {
    'margin': ['margin-top', 'margin-right', 'margin-bottom', 'margin-left'],
    'padding': ['padding-top', 'padding-right', 'padding-bottom', 'padding-left'],
    'border': ['border-width', 'border-style', 'border-color'],
    'border-width': ['border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width'],
    'border-style': ['border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style'],
    'border-color': ['border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color'],
    'border-radius': ['border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius'],
    'background': ['background-image', 'background-position', 'background-size', 'background-repeat', 'background-origin', 'background-clip', 'background-attachment', 'background-color'],
    'font': ['font-style', 'font-variant', 'font-weight', 'font-size', 'line-height', 'font-family'],
    'flex': ['flex-grow', 'flex-shrink', 'flex-basis'],
    'transition': ['transition-property', 'transition-duration', 'transition-timing-function', 'transition-delay'],
    'animation': ['animation-name', 'animation-duration', 'animation-timing-function', 'animation-delay', 'animation-iteration-count', 'animation-direction', 'animation-fill-mode', 'animation-play-state'],
    'outline': ['outline-color', 'outline-style', 'outline-width'],
    'overflow': ['overflow-x', 'overflow-y'],
    'text-decoration': ['text-decoration-line', 'text-decoration-style', 'text-decoration-color', 'text-decoration-thickness'],
    'transform': ['transform'],
    'gap': ['row-gap', 'column-gap'],
  };

  function expandShorthand(prop, value) {
    if (SHORTHANDS[prop]) {
      return SHORTHANDS[prop].map(long => ({
        property: long,
        value: value,
        isShorthandPart: true,
        parent: prop
      }));
    }
    return [{ property: prop, value: value }];
  }

  function isShorthand(prop) {
    return prop in SHORTHANDS;
  }

  function getLonghands(prop) {
    return SHORTHANDS[prop] || null;
  }

  const CSS_INHERITED = new Set([
    'color', 'font', 'font-family', 'font-size', 'font-weight', 'font-style',
    'line-height', 'letter-spacing', 'word-spacing', 'text-align', 'text-decoration',
    'text-transform', 'text-indent', 'text-shadow', 'white-space', 'word-break',
    'word-wrap', 'cursor', 'direction', 'visibility', 'tab-size', 'quotes',
    'list-style', 'list-style-type', 'list-style-position', 'list-style-image',
    'border-collapse', 'border-spacing', 'empty-cells', 'caption-side',
    'table-layout', 'vertical-align', 'writing-mode'
  ]);

  function isInherited(prop) {
    return CSS_INHERITED.has(prop.toLowerCase());
  }

  function calculateSpecificity(selector) {
    let a = 0, b = 0, c = 0;
    const idMatches = selector.match(/#[a-zA-Z0-9_-]+/g);
    if (idMatches) a = idMatches.length;
    const classMatches = selector.match(/\.[a-zA-Z0-9_-]+/g);
    if (classMatches) b = classMatches.length;
    const attrMatches = selector.match(/\[[^\]]+\]/g);
    if (attrMatches) b += attrMatches.length;
    const pseudoClassMatches = selector.match(/:[a-zA-Z0-9_-]+/g);
    if (pseudoClassMatches) b += pseudoClassMatches.length;
    const elementMatches = selector.match(/(^|[\s>+~])([a-zA-Z][a-zA-Z0-9]*)/g);
    if (elementMatches) c = elementMatches.length;
    return { a, b, c, str: `${a}-${b}-${c}` };
  }

  function generateSelector(el) {
    if (el.id) return `#${el.id}`;
    const parts = [];
    let current = el;
    while (current && current !== document.documentElement && parts.length < 5) {
      let part = current.tagName.toLowerCase();
      if (current.id) {
        parts.unshift(`#${current.id}`);
        break;
      }
      if (current.className && typeof current.className === 'string') {
        const classes = current.className.trim().split(/\s+/).slice(0, 3);
        if (classes.length) {
          part += '.' + classes.join('.');
        }
      }
      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(c => c.tagName === current.tagName);
        if (siblings.length > 1) {
          const idx = siblings.indexOf(current) + 1;
          part += `:nth-of-type(${idx})`;
        }
      }
      parts.unshift(part);
      current = current.parentElement;
    }
    return parts.join(' > ');
  }

  function generateSelectors(el) {
    const selectors = [];
    if (el.id) {
      selectors.push(`#${el.id}`);
    }
    const main = generateSelector(el);
    if (!selectors.includes(main)) selectors.push(main);
    if (el.className && typeof el.className === 'string') {
      const classes = el.className.trim().split(/\s+/);
      if (classes.length) {
        selectors.push(el.tagName.toLowerCase() + '.' + classes.join('.'));
        classes.forEach(cls => {
          const s = el.tagName.toLowerCase() + '.' + cls;
          if (!selectors.includes(s)) selectors.push(s);
        });
      }
    }
    return selectors.filter(s => s && s.length > 0);
  }

  function getCategoryLabel(cat) {
    const labels = {
      layout: 'L', typography: 'T', color: 'C',
      spacing: 'S', sizing: 'Z', position: 'P', other: 'O'
    };
    return labels[cat] || '?';
  }

  return {
    parseColor, convertColor, colorToHex, colorToRgb, colorToHsl,
    parseUnit, convertUnit,
    getPropertyCategory, getCategoryLabel,
    expandShorthand, isShorthand, getLonghands,
    isInherited, calculateSpecificity,
    generateSelector, generateSelectors,
    SHORTHANDS
  };
})();
