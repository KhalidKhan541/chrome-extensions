const FontLibrary = (() => {
  const GOOGLE_FONTS = [
    'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Source Sans Pro',
    'Nunito', 'Poppins', 'Raleway', 'PT Sans', 'Noto Sans',
    'Ubuntu', 'Merriweather', 'Playfair Display', 'Oswald', 'Muli',
    'Rubik', 'Work Sans', 'Karla', 'Fira Sans', 'Cabin',
    'Josefin Sans', 'Quicksand', 'Abel', 'Maven Pro', 'Questrial',
    'Lora', 'Crimson Text', 'Bitter', 'IBM Plex Sans', 'IBM Plex Serif',
    'Roboto Slab', 'Roboto Mono', 'Space Mono', 'Fira Code', 'JetBrains Mono',
    'Dancing Script', 'Pacifico', 'Satisfy', 'Great Vibes', 'Lobster',
    'Righteous', 'Bungee', 'Fredoka One', 'Comfortaa', 'Lilita One',
    'Alfa Slab One', 'Passion One', 'Titan One', 'Russo One', 'Bebas Neue',
    'Barlow', 'Manrope', 'Inter', 'Lexend', 'Outfit',
    'DM Sans', 'Sora', 'Space Grotesk', 'Plus Jakarta Sans', 'Urbanist'
  ];

  const FONT_CATEGORIES = {
    serif: ['Playfair Display', 'Merriweather', 'Lora', 'Crimson Text', 'Bitter',
            'Roboto Slab', 'Cabin', 'Libre Baskerville', 'EB Garamond', 'Cardo',
            'PT Serif', 'Noto Serif', 'Source Serif Pro', 'Cormorant Garamond'],
    sansSerif: ['Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Source Sans Pro',
                'Nunito', 'Poppins', 'Raleway', 'PT Sans', 'Noto Sans',
                'Ubuntu', 'Work Sans', 'Karla', 'Fira Sans', 'Inter',
                'DM Sans', 'Sora', 'Space Grotesk', 'Outfit', 'Manrope',
                'Barlow', 'Lexend', 'Plus Jakarta Sans', 'Urbanist'],
    display: ['Oswald', 'Bebas Neue', 'Raleway', 'Righteous', 'Bungee',
              'Fredoka One', 'Comfortaa', 'Lilita One', 'Alfa Slab One',
              'Passion One', 'Titan One', 'Russo One', 'Quicksand', 'Josefin Sans',
              'Abel', 'Maven Pro', 'Questrial', 'Muli'],
    handwriting: ['Dancing Script', 'Pacifico', 'Satisfy', 'Great Vibes', 'Lobster',
                   'Caveat', 'Sacramento', 'Kalam', 'Indie Flower', 'Patrick Hand',
                   'Shadows Into Light', 'Gloria Hallelujah', 'Architects Daughter'],
    monospace: ['Roboto Mono', 'Space Mono', 'Fira Code', 'JetBrains Mono',
                'Source Code Pro', 'Inconsolata', 'IBM Plex Mono', 'Fira Mono',
                'Courier New', 'Consolas', 'Monaco']
  };

  const FONT_PAIRINGS = [
    {
      heading: 'Playfair Display',
      body: 'Source Sans Pro',
      category: 'Classic Editorial'
    },
    {
      heading: 'Montserrat',
      body: 'Merriweather',
      category: 'Modern Professional'
    },
    {
      heading: 'Poppins',
      body: 'Lato',
      category: 'Clean & Friendly'
    },
    {
      heading: 'Raleway',
      body: 'Roboto',
      category: 'Elegant Minimal'
    },
    {
      heading: 'Oswald',
      body: 'Open Sans',
      category: 'Bold Impact'
    },
    {
      heading: 'Bebas Neue',
      body: 'Roboto Condensed',
      category: 'Strong & Readable'
    },
    {
      heading: 'Space Grotesk',
      body: 'Inter',
      category: 'Tech & Modern'
    },
    {
      heading: 'DM Sans',
      body: 'DM Serif Display',
      category: 'Sophisticated'
    },
    {
      heading: 'Outfit',
      body: 'Lora',
      category: 'Balanced'
    },
    {
      heading: 'Sora',
      body: 'Work Sans',
      category: 'Geometric Clean'
    },
    {
      heading: 'Manrope',
      body: 'Crimson Text',
      category: 'Contemporary Serif'
    },
    {
      heading: 'Josefin Sans',
      body: 'Lora',
      category: 'Vintage Modern'
    }
  ];

  function isGoogleFont(family) {
    const normalized = family.toLowerCase().trim();
    return GOOGLE_FONTS.some(f => f.toLowerCase() === normalized);
  }

  function isWebFont(family) {
    const systemFonts = [
      'Arial', 'Helvetica', 'Times New Roman', 'Times', 'Courier New', 'Courier',
      'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS', 'Trebuchet MS',
      'Impact', 'Lucida Console', 'Tahoma', 'Verdana', 'Geneva', 'Lucida Grande',
      'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif', 'serif',
      'monospace', 'cursive', 'fantasy'
    ];

    const normalized = family.toLowerCase().trim();
    if (systemFonts.some(f => f.toLowerCase() === normalized)) return false;

    const allKnownFonts = [...GOOGLE_FONTS, ...systemFonts];
    if (allKnownFonts.some(f => f.toLowerCase() === normalized)) return true;

    return document.fonts.check(`16px "${family}"`);
  }

  function getFontCategory(family) {
    const normalized = family.toLowerCase().trim();

    for (const [category, fonts] of Object.entries(FONT_CATEGORIES)) {
      if (fonts.some(f => f.toLowerCase() === normalized)) {
        return category;
      }
    }

    return 'other';
  }

  function getGoogleFontUrl(families, options = {}) {
    const { weights = [400, 700], styles = ['normal'] } = options;

    const params = families.map(family => {
      const encoded = encodeURIComponent(family);
      const weightStr = weights.join(';');
      const styleStr = styles.length > 1 ? `:ital,wght@${styles.map(s => `0,${weights[0]};1,${weights[0]}`).join(';')}` : `:wght@${weightStr}`;
      return `family=${encoded}${styleStr}`;
    }).join('&');

    return `https://fonts.googleapis.com/css2?${params}&display=swap`;
  }

  function getFontDownloadUrl(family) {
    const encoded = encodeURIComponent(family);
    return `https://fonts.google.com/specimen/${encoded}`;
  }

  function getFontPairingSuggestions(families) {
    const suggestions = [];

    families.forEach(family => {
      const matching = FONT_PAIRINGS.find(p =>
        p.heading.toLowerCase() === family.toLowerCase() ||
        p.body.toLowerCase() === family.toLowerCase()
      );

      if (matching) {
        suggestions.push(matching);
      }
    });

    if (suggestions.length === 0 && families.length > 0) {
      const category = getFontCategory(families[0]);
      const categoryPairings = FONT_PAIRINGS.filter(p => {
        const pHeadingCat = getFontCategory(p.heading);
        const pBodyCat = getFontCategory(p.body);
        return pHeadingCat === category || pBodyCat === category;
      });

      suggestions.push(...categoryPairings.slice(0, 3));
    }

    if (suggestions.length === 0) {
      suggestions.push(...FONT_PAIRINGS.slice(0, 3));
    }

    return suggestions.slice(0, 5);
  }

  function getSimilarFonts(family) {
    const category = getFontCategory(family);
    const categoryFonts = FONT_CATEGORIES[category] || [];
    return categoryFonts.filter(f => f.toLowerCase() !== family.toLowerCase()).slice(0, 5);
  }

  function getFontWeights(family) {
    const weights = [];
    const normalized = family.toLowerCase();

    const weightMap = {
      'thin': '100',
      'hairline': '100',
      'extralight': '200',
      'ultralight': '200',
      'light': '300',
      'regular': '400',
      'normal': '400',
      'medium': '500',
      'semibold': '600',
      'demibold': '600',
      'bold': '700',
      'extrabold': '800',
      'ultrabold': '800',
      'black': '900',
      'heavy': '900'
    };

    if (isGoogleFont(family)) {
      const availableWeights = {
        '100': ['Thin', 'Hairline'],
        '200': ['Extra Light', 'Ultra Light'],
        '300': ['Light'],
        '400': ['Regular', 'Normal'],
        '500': ['Medium'],
        '600': ['Semi Bold', 'Demi Bold'],
        '700': ['Bold'],
        '800': ['Extra Bold', 'Ultra Bold'],
        '900': ['Black', 'Heavy']
      };

      Object.entries(availableWeights).forEach(([weight, names]) => {
        weights.push({ weight, names });
      });
    }

    return weights;
  }

  function isVariableFont(family) {
    const fontFaces = FontAnalyzer.findFontFace(family);
    if (!fontFaces) return false;

    return fontFaces.some(face =>
      face.src.includes('format("woff2-variations")') ||
      face.src.includes('format("woff-variations")') ||
      face.src.includes('tech(variations)')
    );
  }

  return {
    isGoogleFont,
    isWebFont,
    getFontCategory,
    getGoogleFontUrl,
    getFontDownloadUrl,
    getFontPairingSuggestions,
    getSimilarFonts,
    getFontWeights,
    isVariableFont,
    GOOGLE_FONTS,
    FONT_CATEGORIES,
    FONT_PAIRINGS
  };
})();
