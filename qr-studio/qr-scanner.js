class QRScanner {
  constructor() {
    this.video = null;
    this.canvas = null;
    this.ctx = null;
    this.stream = null;
    this.scanning = false;
    this.onDetect = null;
    this.animationFrame = null;
  }

  async init(videoElement, onDetect) {
    this.video = videoElement;
    this.onDetect = onDetect;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    return this;
  }

  async start() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      this.video.srcObject = this.stream;
      await this.video.play();
      this.scanning = true;
      this.scan();
      return true;
    } catch (err) {
      console.error('Camera access denied:', err);
      return false;
    }
  }

  stop() {
    this.scanning = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
    }
  }

  scan() {
    if (!this.scanning) return;

    if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
      this.canvas.width = this.video.videoWidth;
      this.canvas.height = this.video.videoHeight;
      this.ctx.drawImage(this.video, 0, 0);

      const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      const result = this.detectQR(imageData);

      if (result && this.onDetect) {
        this.onDetect(result);
      }
    }

    this.animationFrame = requestAnimationFrame(() => this.scan());
  }

  detectQR(imageData) {
    const { data, width, height } = imageData;
    const gray = new Uint8Array(width * height);

    for (let i = 0; i < gray.length; i++) {
      const offset = i * 4;
      gray[i] = Math.floor(data[offset] * 0.299 + data[offset + 1] * 0.587 + data[offset + 2] * 0.114);
    }

    const threshold = this.otsuThreshold(gray);
    const binary = new Uint8Array(gray.length);
    for (let i = 0; i < gray.length; i++) {
      binary[i] = gray[i] > threshold ? 1 : 0;
    }

    const patterns = this.findFinderPatterns(binary, width, height);
    if (patterns.length < 3) return null;

    const decoded = this.decodeFromPatterns(patterns, binary, width, height);
    return decoded;
  }

  otsuThreshold(gray) {
    const histogram = new Array(256).fill(0);
    for (let i = 0; i < gray.length; i++) {
      histogram[gray[i]]++;
    }

    let sum = 0;
    for (let i = 0; i < 256; i++) sum += i * histogram[i];

    let sumB = 0;
    let wB = 0;
    let maxVariance = 0;
    let threshold = 0;

    for (let i = 0; i < 256; i++) {
      wB += histogram[i];
      if (wB === 0) continue;
      const wF = gray.length - wB;
      if (wF === 0) break;

      sumB += i * histogram[i];
      const mB = sumB / wB;
      const mF = (sum - sumB) / wF;
      const variance = wB * wF * (mB - mF) * (mB - mF);

      if (variance > maxVariance) {
        maxVariance = variance;
        threshold = i;
      }
    }

    return threshold;
  }

  findFinderPatterns(binary, width, height) {
    const patterns = [];
    const minSize = 21;

    for (let y = 0; y < height - minSize; y += 3) {
      for (let x = 0; x < width - minSize; x += 3) {
        if (this.isFinderPattern(binary, x, y, width, height)) {
          const size = this.measureFinderPattern(binary, x, y, width, height);
          if (size >= 7) {
            patterns.push({ x: x + size / 2, y: y + size / 2, size });
          }
        }
      }
    }

    return this.removeDuplicates(patterns);
  }

  isFinderPattern(binary, x, y, width, height) {
    const size = this.measureFinderPattern(binary, x, y, width, height);
    if (size < 7) return false;

    const ratios = [1, 1, 3, 1, 1];
    let currentRatio = 0;
    let count = 0;
    let lastValue = binary[y * width + x];

    for (let i = 0; i < size; i++) {
      const value = binary[y * width + Math.min(x + i, width - 1)];
      if (value === lastValue) {
        count++;
      } else {
        const expected = ratios[currentRatio] * (size / 7);
        if (Math.abs(count - expected) > expected * 0.5) return false;
        currentRatio++;
        count = 1;
        lastValue = value;
      }
    }

    return currentRatio >= 4;
  }

  measureFinderPattern(binary, startX, startY, width, height) {
    let size = 1;
    const firstValue = binary[startY * width + startX];

    for (let x = startX + 1; x < width; x++) {
      if (binary[startY * width + x] === firstValue) {
        size++;
      } else {
        break;
      }
    }

    return size;
  }

  removeDuplicates(patterns) {
    const unique = [];
    const minDistance = 20;

    for (const p of patterns) {
      let isDuplicate = false;
      for (const u of unique) {
        const dist = Math.sqrt((p.x - u.x) ** 2 + (p.y - u.y) ** 2);
        if (dist < minDistance) {
          isDuplicate = true;
          break;
        }
      }
      if (!isDuplicate) unique.push(p);
    }

    return unique;
  }

  decodeFromPatterns(patterns, binary, width, height) {
    if (patterns.length < 3) return null;

    const p1 = patterns[0];
    const p2 = patterns[1];
    const p3 = patterns[2];

    const size = Math.max(
      Math.abs(p2.x - p1.x),
      Math.abs(p3.x - p1.x),
      Math.abs(p2.y - p1.y),
      Math.abs(p3.y - p1.y)
    );

    const moduleSize = Math.floor(size / 21);
    if (moduleSize < 1) return null;

    const gridX = Math.floor((p1.x + p2.x + p3.x) / 3);
    const gridY = Math.floor((p1.y + p2.y + p3.y) / 3);

    const result = this.extractData(binary, gridX, gridY, moduleSize, width, height);
    return result;
  }

  extractData(binary, centerX, centerY, moduleSize, width, height) {
    const modules = 21;
    const startX = centerX - Math.floor(modules * moduleSize / 2);
    const startY = centerY - Math.floor(modules * moduleSize / 2);

    const grid = [];
    for (let y = 0; y < modules; y++) {
      grid[y] = [];
      for (let x = 0; x < modules; x++) {
        const px = startX + x * moduleSize + Math.floor(moduleSize / 2);
        const py = startY + y * moduleSize + Math.floor(moduleSize / 2);
        if (px >= 0 && px < width && py >= 0 && py < height) {
          grid[y][x] = binary[py * width + px];
        } else {
          grid[y][x] = 0;
        }
      }
    }

    const ecLevel = this.readFormatInfo(grid);
    const dataBits = this.readData(grid, modules);

    return {
      data: this.decodeBits(dataBits),
      ecLevel: ecLevel,
      modules: grid
    };
  }

  readFormatInfo(grid) {
    const formatBits = [];
    for (let i = 0; i < 6; i++) formatBits.push(grid[8][i]);
    formatBits.push(grid[8][7]);
    formatBits.push(grid[8][8]);
    formatBits.push(grid[7][8]);

    let format = 0;
    for (let i = 0; i < formatBits.length; i++) {
      format = (format << 1) | formatBits[i];
    }

    const ecIndex = (format >> 3) & 0x03;
    const levels = ['L', 'M', 'Q', 'H'];
    return levels[ecIndex] || 'M';
  }

  readData(grid, size) {
    const bits = [];
    let col = size - 1;
    let upward = true;

    while (col >= 0) {
      if (col === 6) col--;
      for (let i = 0; i < size; i++) {
        const row = upward ? size - 1 - i : i;
        for (let c = 0; c < 2; c++) {
          const currentCol = col - c;
          if (currentCol >= 0) {
            bits.push(grid[row][currentCol]);
          }
        }
      }
      upward = !upward;
      col -= 2;
    }

    return bits;
  }

  decodeBits(bits) {
    let result = '';
    let index = 0;

    if (bits.length < 4) return result;

    const mode = (bits[0] << 3) | (bits[1] << 2) | (bits[2] << 1) | bits[3];
    index = 4;

    if (mode === 0x04) {
      if (bits.length >= 12) {
        const length = (bits[4] << 7) | (bits[5] << 6) | (bits[6] << 5) |
                       (bits[7] << 4) | (bits[8] << 3) | (bits[9] << 2) |
                       (bits[10] << 1) | bits[11];
        index = 12;

        for (let i = 0; i < length && index + 8 <= bits.length; i++) {
          let byte = 0;
          for (let j = 0; j < 8; j++) {
            byte = (byte << 1) | bits[index + j];
          }
          result += String.fromCharCode(byte);
          index += 8;
        }
      }
    } else if (mode === 0x02) {
      if (bits.length >= 10) {
        let length = 0;
        for (let i = 0; i < 10; i++) {
          length = (length << 1) | bits[4 + i];
        }
        index = 14;

        for (let i = 0; i < length && index + 11 <= bits.length; i++) {
          let charCode = 0;
          for (let j = 0; j < 11; j++) {
            charCode = (charCode << 1) | bits[index + j];
          }
          const alphaTable = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';
          if (charCode < alphaTable.length) {
            result += alphaTable[charCode];
          }
          index += 11;
        }
      }
    } else if (mode === 0x01) {
      if (bits.length >= 10) {
        let length = 0;
        for (let i = 0; i < 10; i++) {
          length = (length << 1) | bits[4 + i];
        }
        index = 14;

        for (let i = 0; i < length && index + 10 <= bits.length; i++) {
          let num = 0;
          for (let j = 0; j < 10; j++) {
            num = (num << 1) | bits[index + j];
          }
          result += num.toString();
          index += 10;
        }
      }
    }

    return result;
  }

  static async scanImage(imageSource) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const scanner = new QRScanner();
        const result = scanner.detectQR(imageData);
        resolve(result);
      };
      img.onerror = () => resolve(null);
      img.src = imageSource;
    });
  }
}

if (typeof module !== 'undefined') {
  module.exports = QRScanner;
}
