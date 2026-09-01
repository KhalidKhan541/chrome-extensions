(() => {
  const uploadArea = document.getElementById('uploadArea');
  const fileInput = document.getElementById('fileInput');
  const previewImage = document.getElementById('previewImage');
  const extractBtn = document.getElementById('extractBtn');
  const paletteSection = document.getElementById('paletteSection');
  const paletteDisplay = document.getElementById('paletteDisplay');
  const harmonySection = document.getElementById('harmonySection');
  const harmonyPalette = document.getElementById('harmonyPalette');
  const manualColor = document.getElementById('manualColor');
  const pickerLabel = document.getElementById('pickerLabel');
  const addManualBtn = document.getElementById('addManualBtn');
  const paletteName = document.getElementById('paletteName');
  const saveBtn = document.getElementById('saveBtn');
  const savedList = document.getElementById('savedList');
  const exportSection = document.getElementById('exportSection');
  const exportPreview = document.getElementById('exportPreview');
  const copyExport = document.getElementById('copyExport');
  const blindnessSection = document.getElementById('blindnessSection');
  const blindnessPalette = document.getElementById('blindnessPalette');

  let currentPalette = [];
  let selectedFormat = 'css';

  // Upload handlers
  uploadArea.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', handleFileSelect);

  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) loadImage(file);
  });

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) loadImage(file);
  }

  function loadImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImage.src = e.target.result;
      previewImage.classList.remove('hidden');
      uploadArea.querySelector('.upload-content').classList.add('hidden');
      extractBtn.disabled = false;
    };
    reader.readAsDataURL(file);
  }

  // Extract colors
  extractBtn.addEventListener('click', async () => {
    if (!previewImage.src) return;
    extractBtn.textContent = 'Extracting...';
    extractBtn.disabled = true;

    try {
      const colors = await ColorExtractor.extractFromImage(previewImage, 6);
      currentPalette = colors;
      renderPalette(colors);
      paletteSection.classList.remove('hidden');
      harmonySection.classList.remove('hidden');
      exportSection.classList.remove('hidden');
      blindnessSection.classList.remove('hidden');
      updateExport();
    } catch (err) {
      console.error('Extraction failed:', err);
    }

    extractBtn.textContent = 'Extract Colors';
    extractBtn.disabled = false;
  });

  function renderPalette(colors, container = paletteDisplay) {
    container.innerHTML = '';
    colors.forEach(c => {
      const div = document.createElement('div');
      div.className = 'palette-color';
      div.style.backgroundColor = c.hex;
      div.innerHTML = `<span class="color-label">${c.hex}</span>`;
      div.addEventListener('click', () => copyToClipboard(c.hex));
      container.appendChild(div);
    });
  }

  // Harmony
  document.querySelectorAll('.harmony-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.harmony-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const type = btn.dataset.harmony;
      const baseColor = currentPalette[0]?.hex || '#4ECDC4';
      const harmonyColors = ColorHarmony.generate(baseColor, type);

      harmonyPalette.innerHTML = '';
      harmonyColors.forEach(hex => {
        const div = document.createElement('div');
        div.className = 'harmony-color';
        div.style.backgroundColor = hex;
        div.innerHTML = `<span class="color-label">${hex}</span>`;
        div.addEventListener('click', () => copyToClipboard(hex));
        harmonyPalette.appendChild(div);
      });
    });
  });

  // Manual picker
  manualColor.addEventListener('input', (e) => {
    pickerLabel.textContent = e.target.value.toUpperCase();
  });

  addManualBtn.addEventListener('click', () => {
    const hex = manualColor.value.toUpperCase();
    currentPalette.push({
      hex,
      r: parseInt(hex.slice(1, 3), 16),
      g: parseInt(hex.slice(3, 5), 16),
      b: parseInt(hex.slice(5, 7), 16),
      hsl: ColorExtractor.rgbToHsl(
        parseInt(hex.slice(1, 3), 16),
        parseInt(hex.slice(3, 5), 16),
        parseInt(hex.slice(5, 7), 16)
      )
    });
    renderPalette(currentPalette);
    paletteSection.classList.remove('hidden');
    exportSection.classList.remove('hidden');
    blindnessSection.classList.remove('hidden');
    updateExport();
  });

  // Color blindness
  document.querySelectorAll('.blindness-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.blindness-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const type = btn.dataset.type;
      const simulated = ColorBlindness.simulatePalette(currentPalette, type);

      blindnessPalette.innerHTML = '';
      simulated.forEach(c => {
        const div = document.createElement('div');
        div.className = 'blindness-color';
        div.style.backgroundColor = c.hex;
        div.title = `Original: ${c.original}`;
        div.innerHTML = `<span class="color-label">${c.hex}</span>`;
        div.addEventListener('click', () => copyToClipboard(c.hex));
        blindnessPalette.appendChild(div);
      });
    });
  });

  // Export
  document.querySelectorAll('.btn-export').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-export').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedFormat = btn.dataset.format;
      updateExport();
    });
  });

  function updateExport() {
    if (currentPalette.length === 0) return;
    const name = paletteName.value || 'palette';
    exportPreview.textContent = ExportFormatter.format(currentPalette, selectedFormat, name);
  }

  copyExport.addEventListener('click', () => {
    copyToClipboard(exportPreview.textContent);
  });

  paletteName.addEventListener('input', updateExport);

  // Save / load palettes
  saveBtn.addEventListener('click', () => {
    if (currentPalette.length === 0) return;
    const name = paletteName.value.trim() || 'Untitled Palette';

    const palettes = JSON.parse(localStorage.getItem('colorPalettes') || '[]');
    palettes.unshift({
      id: Date.now(),
      name,
      colors: currentPalette.map(c => c.hex),
      date: new Date().toISOString()
    });
    localStorage.setItem('colorPalettes', JSON.stringify(palettes));
    paletteName.value = '';
    loadSavedPalettes();
    showToast('Palette saved!');
  });

  function loadSavedPalettes() {
    const palettes = JSON.parse(localStorage.getItem('colorPalettes') || '[]');

    if (palettes.length === 0) {
      savedList.innerHTML = '<p class="empty-state">No saved palettes yet.</p>';
      return;
    }

    savedList.innerHTML = '';
    palettes.forEach(palette => {
      const div = document.createElement('div');
      div.className = 'saved-palette';
      div.innerHTML = `
        <div class="saved-palette-header">
          <span class="saved-palette-name">${palette.name}</span>
          <button class="saved-palette-delete" data-id="${palette.id}">x</button>
        </div>
        <div class="saved-palette-colors">
          ${palette.colors.map(c => `<div style="background:${c}"></div>`).join('')}
        </div>
      `;

      div.querySelector('.saved-palette-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        deletePalette(palette.id);
      });

      div.addEventListener('click', () => {
        currentPalette = palette.colors.map(hex => ({
          hex,
          r: parseInt(hex.slice(1, 3), 16),
          g: parseInt(hex.slice(3, 5), 16),
          b: parseInt(hex.slice(5, 7), 16),
          hsl: ColorExtractor.rgbToHsl(
            parseInt(hex.slice(1, 3), 16),
            parseInt(hex.slice(3, 5), 16),
            parseInt(hex.slice(5, 7), 16)
          )
        }));
        renderPalette(currentPalette);
        paletteSection.classList.remove('hidden');
        harmonySection.classList.remove('hidden');
        exportSection.classList.remove('hidden');
        blindnessSection.classList.remove('hidden');
        updateExport();
      });

      savedList.appendChild(div);
    });
  }

  function deletePalette(id) {
    let palettes = JSON.parse(localStorage.getItem('colorPalettes') || '[]');
    palettes = palettes.filter(p => p.id !== id);
    localStorage.setItem('colorPalettes', JSON.stringify(palettes));
    loadSavedPalettes();
    showToast('Palette deleted');
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(`Copied ${text}`);
    });
  }

  function showToast(msg) {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 1500);
  }

  // Context menu listener
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'extractColorsFromContext') {
      previewImage.src = message.imageUrl;
      previewImage.classList.remove('hidden');
      uploadArea.querySelector('.upload-content').classList.add('hidden');
      extractBtn.disabled = false;
      extractBtn.click();
    }
  });

  // Init
  loadSavedPalettes();
})();
