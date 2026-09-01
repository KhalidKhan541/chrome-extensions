const CSSInspector = (() => {
  function getComputedStyles(el) {
    const computed = getComputedStyle(el);
    const styles = [];
    for (let i = 0; i < computed.length; i++) {
      const prop = computed[i];
      const value = computed.getPropertyValue(prop);
      if (value && value !== '' && value !== 'none' && value !== 'normal' && value !== 'auto') {
        styles.push({ property: prop, value });
      }
    }
    return styles;
  }

  function getStylesheetRules(el) {
    const results = [];
    try {
      for (const sheet of document.styleSheets) {
        try {
          const rules = sheet.cssRules || sheet.rules;
          if (!rules) continue;
          for (const rule of rules) {
            if (rule.type === CSSRule.STYLE_RULE) {
              try {
                if (el.matches(rule.selectorText)) {
                  for (let i = 0; i < rule.style.length; i++) {
                    const prop = rule.style[i];
                    results.push({
                      property: prop,
                      value: rule.style.getPropertyValue(prop),
                      important: rule.style.getPropertyPriority(prop) === 'important',
                      selector: rule.selectorText,
                      source: sheet.href || 'inline'
                    });
                  }
                }
              } catch (e) { /* invalid selector */ }
            }
          }
        } catch (e) { /* cross-origin */ }
      }
    } catch (e) { /* no access */ }
    return results;
  }

  function getElementInfo(el) {
    return {
      tag: el.tagName.toLowerCase(),
      id: el.id || '',
      classes: typeof el.className === 'string' ? el.className.trim().split(/\s+/) : [],
      text: el.textContent ? el.textContent.trim().substring(0, 100) : '',
      childCount: el.children.length,
      attributes: Array.from(el.attributes).map(a => ({ name: a.name, value: a.value })),
      rect: el.getBoundingClientRect(),
      computed: {
        display: getComputedStyle(el).display,
        position: getComputedStyle(el).position,
        fontSize: getComputedStyle(el).fontSize,
        color: getComputedStyle(el).color,
        backgroundColor: getComputedStyle(el).backgroundColor,
        fontFamily: getComputedStyle(el).fontFamily
      }
    };
  }

  function getBoxModel(el) {
    const rect = el.getBoundingClientRect();
    const computed = getComputedStyle(el);
    const get = prop => parseFloat(computed.getPropertyValue(prop)) || 0;
    return {
      content: {
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      },
      padding: {
        top: get('padding-top'),
        right: get('padding-right'),
        bottom: get('padding-bottom'),
        left: get('padding-left')
      },
      border: {
        top: get('border-top-width'),
        right: get('border-right-width'),
        bottom: get('border-bottom-width'),
        left: get('border-left-width')
      },
      margin: {
        top: get('margin-top'),
        right: get('margin-right'),
        bottom: get('margin-bottom'),
        left: get('margin-left')
      }
    };
  }

  function formatBoxSide(side) {
    if (side.top === side.right && side.right === side.bottom && side.bottom === side.left) {
      return `${side.top}px`;
    }
    return `${side.top}px ${side.right}px ${side.bottom}px ${side.left}px`;
  }

  function categorizeStyles(styles) {
    const categories = { layout: [], typography: [], color: [], spacing: [], sizing: [], position: [], other: [] };
    styles.forEach(s => {
      const cat = CSSUtils.getPropertyCategory(s.property);
      categories[cat].push(s);
    });
    return categories;
  }

  function getActiveMediaQueries() {
    const queries = [
      { label: 'xs (<576px)', query: '(max-width: 575.98px)', width: 575 },
      { label: 'sm (≥576px)', query: '(min-width: 576px)', width: 576 },
      { label: 'md (≥768px)', query: '(min-width: 768px)', width: 768 },
      { label: 'lg (≥992px)', query: '(min-width: 992px)', width: 992 },
      { label: 'xl (≥1200px)', query: '(min-width: 1200px)', width: 1200 },
      { label: 'xxl (≥1400px)', query: '(min-width: 1400px)', width: 1400 },
    ];
    return queries.map(q => ({
      ...q,
      matches: window.matchMedia(q.query).matches
    }));
  }

  return {
    getComputedStyles,
    getStylesheetRules,
    getElementInfo,
    getBoxModel,
    formatBoxSide,
    categorizeStyles,
    getActiveMediaQueries
  };
})();
