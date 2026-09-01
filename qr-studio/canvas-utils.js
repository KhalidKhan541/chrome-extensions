class CanvasUtils {
  static async canvasToPNG(canvas, quality = 1.0) {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/png', quality);
    });
  }

  static async canvasToDataURL(canvas, format = 'image/png', quality = 1.0) {
    return canvas.toDataURL(format, quality);
  }

  static async downloadCanvas(canvas, filename, format = 'png') {
    let blob;
    if (format === 'png') {
      blob = await this.canvasToPNG(canvas);
    } else if (format === 'jpeg') {
      blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.95);
      });
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  static async svgToFile(svgString, filename) {
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  static svgToCanvas(svgString, width, height) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      const img = new Image();
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(url);
        resolve(canvas);
      };

      img.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(err);
      };

      img.src = url;
    });
  }

  static resizeCanvas(sourceCanvas, newWidth, newHeight, maintainAspect = true) {
    const canvas = document.createElement('canvas');
    let width = newWidth;
    let height = newHeight;

    if (maintainAspect) {
      const ratio = sourceCanvas.width / sourceCanvas.height;
      if (newWidth / newHeight > ratio) {
        width = newHeight * ratio;
      } else {
        height = newWidth / ratio;
      }
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(sourceCanvas, 0, 0, width, height);

    return canvas;
  }

  static cropCanvas(sourceCanvas, x, y, width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(sourceCanvas, x, y, width, height, 0, 0, width, height);
    return canvas;
  }

  static addPadding(canvas, padding, color = '#FFFFFF') {
    const newCanvas = document.createElement('canvas');
    newCanvas.width = canvas.width + padding * 2;
    newCanvas.height = canvas.height + padding * 2;
    const ctx = newCanvas.getContext('2d');

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, newCanvas.width, newCanvas.height);
    ctx.drawImage(canvas, padding, padding);

    return newCanvas;
  }

  static invertColors(canvas) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i];
      data[i + 1] = 255 - data[i + 1];
      data[i + 2] = 255 - data[i + 2];
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  static applyOverlay(canvas, overlayCanvas, x = 0, y = 0, opacity = 1.0) {
    const ctx = canvas.getContext('2d');
    ctx.globalAlpha = opacity;
    ctx.drawImage(overlayCanvas, x, y);
    ctx.globalAlpha = 1.0;
    return canvas;
  }

  static createGradientCanvas(width, height, color1, color2, direction = 'vertical') {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    let gradient;
    if (direction === 'vertical') {
      gradient = ctx.createLinearGradient(0, 0, 0, height);
    } else {
      gradient = ctx.createLinearGradient(0, 0, width, 0);
    }

    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    return canvas;
  }

  static hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  static rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
      const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }

  static async loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  static async imageToCanvas(imageSource) {
    let img;
    if (typeof imageSource === 'string') {
      img = await this.loadImage(imageSource);
    } else {
      img = imageSource;
    }

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return canvas;
  }

  static mergeCanvases(canvases, direction = 'horizontal', gap = 0) {
    let totalWidth = 0;
    let totalHeight = 0;
    let maxWidth = 0;
    let maxHeight = 0;

    for (const canvas of canvases) {
      if (direction === 'horizontal') {
        totalWidth += canvas.width + gap;
        maxHeight = Math.max(maxHeight, canvas.height);
      } else {
        totalHeight += canvas.height + gap;
        maxWidth = Math.max(maxWidth, canvas.width);
      }
    }

    if (direction === 'horizontal') {
      totalWidth -= gap;
      totalHeight = maxHeight;
    } else {
      totalHeight -= gap;
      totalWidth = maxWidth;
    }

    const merged = document.createElement('canvas');
    merged.width = totalWidth;
    merged.height = totalHeight;
    const ctx = merged.getContext('2d');

    let offset = 0;
    for (const canvas of canvases) {
      if (direction === 'horizontal') {
        ctx.drawImage(canvas, offset, 0);
        offset += canvas.width + gap;
      } else {
        ctx.drawImage(canvas, 0, offset);
        offset += canvas.height + gap;
      }
    }

    return merged;
  }

  static createRoundedCanvas(canvas, radius) {
    const rounded = document.createElement('canvas');
    rounded.width = canvas.width;
    rounded.height = canvas.height;
    const ctx = rounded.getContext('2d');

    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(canvas.width - radius, 0);
    ctx.quadraticCurveTo(canvas.width, 0, canvas.width, radius);
    ctx.lineTo(canvas.width, canvas.height - radius);
    ctx.quadraticCurveTo(canvas.width, canvas.height, canvas.width - radius, canvas.height);
    ctx.lineTo(radius, canvas.height);
    ctx.quadraticCurveTo(0, canvas.height, 0, canvas.height - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(canvas, 0, 0);

    return rounded;
  }

  static getPixelData(canvas) {
    const ctx = canvas.getContext('2d');
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  static setPixelData(canvas, imageData) {
    const ctx = canvas.getContext('2d');
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  static createCheckerboard(size1, size2, color1, color2) {
    const canvas = document.createElement('canvas');
    canvas.width = size1 + size2;
    canvas.height = size1 + size2;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = color1;
    ctx.fillRect(0, 0, size1, size1);
    ctx.fillStyle = color2;
    ctx.fillRect(size1, 0, size2, size1);
    ctx.fillStyle = color2;
    ctx.fillRect(0, size1, size1, size2);
    ctx.fillStyle = color1;
    ctx.fillRect(size1, size1, size2, size2);

    return canvas;
  }
}

if (typeof module !== 'undefined') {
  module.exports = CanvasUtils;
}
