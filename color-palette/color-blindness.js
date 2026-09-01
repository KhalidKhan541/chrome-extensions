const ColorBlindness = (() => {
  const matrices = {
    protanopia: [
      [0.152286, 1.052583, -0.204868],
      [0.114503, 0.786281, 0.099216],
      [-0.003882, -0.048116, 1.051998]
    ],
    deuteranopia: [
      [0.367322, 0.860646, -0.227968],
      [0.280085, 0.672501, 0.047413],
      [-0.011820, 0.042940, 0.968881]
    ],
    tritanopia: [
      [1.255528, -0.076749, -0.178779],
      [-0.078411, 0.930809, 0.147602],
      [0.004733, 0.691367, 0.303900]
    ],
    achromatopsia: [
      [0.2126, 0.7152, 0.0722],
      [0.2126, 0.7152, 0.0722],
      [0.2126, 0.7152, 0.0722]
    ]
  };

  function simulate(hex, type) {
    const matrix = matrices[type];
    if (!matrix) return hex;

    const r = parseInt(hex.substring(1, 3), 16) / 255;
    const g = parseInt(hex.substring(3, 5), 16) / 255;
    const b = parseInt(hex.substring(5, 7), 16) / 255;

    const sr = matrix[0][0] * r + matrix[0][1] * g + matrix[0][2] * b;
    const sg = matrix[1][0] * r + matrix[1][1] * g + matrix[1][2] * b;
    const sb = matrix[2][0] * r + matrix[2][1] * g + matrix[2][2] * b;

    const clamp = v => Math.max(0, Math.min(255, Math.round(v * 255)));

    return '#' + [clamp(sr), clamp(sg), clamp(sb)]
      .map(v => v.toString(16).padStart(2, '0')).join('');
  }

  function simulatePalette(palette, type) {
    return palette.map(c => ({
      hex: simulate(c.hex, type),
      original: c.hex
    }));
  }

  return { simulate, simulatePalette };
})();
