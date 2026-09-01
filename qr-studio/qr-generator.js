class QRGenerator {
  static EC_LEVELS = { L: 0, M: 1, Q: 2, H: 3 };
  static EC_INDICATORS = [0x77, 0x71, 0x57, 0x43];
  static FORMAT_INFO = [
    0x5412, 0x5125, 0x5E7C, 0x5B4B, 0x45F9, 0x40CE, 0x4F97, 0x4AA0,
    0x77C4, 0x72F3, 0x7DAA, 0x789D, 0x662F, 0x6318, 0x6C41, 0x6976,
    0x1689, 0x13BE, 0x1CE7, 0x19D0, 0x0762, 0x0255, 0x0D0C, 0x083B,
    0x355F, 0x3068, 0x3F31, 0x3A06, 0x24B4, 0x2183, 0x2EDA, 0x2BED
  ];

  static POLYNOMIALS = {
    7: [0, 87, 229, 146, 149, 238, 102, 21],
    10: [0, 251, 67, 46, 61, 118, 70, 64, 94, 32, 45],
    13: [0, 74, 152, 176, 100, 86, 100, 106, 104, 130, 218, 206, 140, 78],
    15: [0, 8, 183, 61, 91, 202, 37, 51, 58, 58, 237, 140, 124, 5, 99, 105],
    16: [0, 120, 104, 107, 109, 102, 161, 76, 3, 91, 191, 147, 169, 182, 194, 225, 120],
    18: [0, 215, 234, 158, 94, 101, 152, 176, 57, 100, 97, 151, 135, 68, 82, 119, 164, 110, 145],
    20: [0, 210, 171, 247, 242, 193, 226, 175, 171, 145, 161, 107, 202, 98, 120, 101, 133, 78, 110, 132],
    22: [0, 17, 60, 79, 51, 113, 140, 108, 66, 68, 117, 143, 72, 168, 177, 169, 215, 141, 179, 90, 81],
    24: [0, 210, 171, 247, 242, 193, 226, 175, 171, 145, 161, 107, 202, 98, 120, 101, 133, 78, 110, 132, 122, 76, 66, 197],
    26: [0, 52, 54, 105, 101, 102, 116, 106, 103, 102, 98, 116, 99, 114, 107, 113, 108, 104, 105, 110, 99, 115, 115, 117, 110, 104],
    28: [0, 60, 94, 118, 106, 132, 108, 126, 112, 110, 100, 108, 102, 104, 108, 116, 112, 114, 100, 102, 104, 110, 106, 102, 100, 112, 104],
    30: [0, 182, 211, 231, 207, 163, 110, 198, 168, 156, 164, 178, 178, 170, 198, 164, 158, 148, 166, 142, 178, 174, 186, 156, 154, 154, 164, 152, 154, 164]
  };

  static getVersion(dataLength, ecLevel) {
    for (let v = 1; v <= 40; v++) {
      const capacity = this.getCapacity(v, ecLevel);
      if (dataLength <= capacity) return v;
    }
    return -1;
  }

  static getCapacity(version, ecLevel) {
    const ecIndex = this.EC_LEVELS[ecLevel];
    const totalCodewords = this.getTotalCodewords(version);
    const ecPerBlock = this.getEcPerBlock(version, ecIndex);
    const numBlocks = this.getNumBlocks(version, ecIndex);
    const dataPerBlock = Math.floor((totalCodewords - ecPerBlock * numBlocks) / numBlocks);
    const totalData = dataPerBlock * numBlocks;

    if (version <= 9) {
      const modeIndicatorBits = 4;
      const characterCountBits = this.getCharacterCountBits(version, 'byte');
      return Math.floor((totalData * 8 - modeIndicatorBits - characterCountBits) / 8);
    }
    return Math.floor((totalData * 8 - 4 - this.getCharacterCountBits(version, 'byte')) / 8);
  }

  static getCharacterCountBits(version, mode) {
    if (mode === 'byte') {
      if (version <= 9) return 8;
      if (version <= 26) return 16;
      return 24;
    }
    return 0;
  }

  static getTotalCodewords(version) {
    const size = version * 4 + 17;
    const totalModules = size * size;
    const functionModules = this.countFunctionModules(version);
    return Math.floor((totalModules - functionModules) / 8);
  }

  static countFunctionModules(version) {
    let count = 31;
    if (version >= 2) count += 10;
    if (version >= 7) count += 36;
    count += 15;
    count += (version * 4 + 1) * 2 - 15;
    return count;
  }

  static getEcPerBlock(version, ecIndex) {
    const table = [
      [7,10,13,17],[10,16,22,28],[15,26,18,22],[20,18,26,16],
      [26,24,18,22],[18,16,24,28],[20,18,26,28],[24,22,26,22],
      [30,22,24,24],[18,26,28,30],[20,24,28,24],[24,28,28,30],
      [26,28,28,28],[30,26,28,28],[22,24,28,30],[24,28,28,28],
      [28,28,28,28],[30,28,28,28],[28,28,28,28],[28,28,28,28]
    ];
    return table[version - 1] ? table[version - 1][ecIndex] : 30;
  }

  static getNumBlocks(version, ecIndex) {
    const table = [
      [1,1,1,1],[1,1,1,1],[1,1,2,2],[1,2,2,4],
      [1,2,4,4],[2,4,4,4],[2,4,6,5],[2,4,6,6],
      [2,5,8,8],[4,5,8,8],[4,5,8,8],[4,6,10,8],
      [3,8,10,10],[4,8,10,10],[4,9,12,10],[4,9,12,10],
      [4,10,12,10],[4,10,14,10],[4,11,14,10],[4,12,14,10]
    ];
    return table[version - 1] ? table[version - 1][ecIndex] : 10;
  }

  static encodeData(text, version, ecLevel) {
    const ecIndex = this.EC_LEVELS[ecLevel];
    const totalCodewords = this.getTotalCodewords(version);
    const ecPerBlock = this.getEcPerBlock(version, ecIndex);
    const numBlocks = this.getNumBlocks(version, ecIndex);
    const dataPerBlock = Math.floor((totalCodewords - ecPerBlock * numBlocks) / numBlocks);

    let bits = '0100';
    const charCountBits = this.getCharacterCountBits(version, 'byte');
    bits += text.length.toString(2).padStart(charCountBits, '0');

    for (let i = 0; i < text.length; i++) {
      bits += text.charCodeAt(i).toString(2).padStart(8, '0');
    }

    const totalDataBits = dataPerBlock * numBlocks * 8;
    const terminatorBits = Math.min(4, totalDataBits - bits.length);
    bits += '0'.repeat(terminatorBits);

    while (bits.length % 8 !== 0) bits += '0';
    while (bits.length < totalDataBits) {
      bits += '1110110000010001';
      if (bits.length < totalDataBits) {
        bits += '1110110000010001';
      }
    }

    const dataBytes = [];
    for (let i = 0; i < bits.length; i += 8) {
      dataBytes.push(parseInt(bits.substr(i, 8), 2));
    }

    return this.interleaveData(dataBytes, ecPerBlock, numBlocks, dataPerBlock);
  }

  static interleaveData(dataBytes, ecPerBlock, numBlocks, dataPerBlock) {
    const dataBlocks = [];
    const ecBlocks = [];

    for (let i = 0; i < numBlocks; i++) {
      const block = dataBytes.slice(i * dataPerBlock, (i + 1) * dataPerBlock);
      dataBlocks.push(block);
      ecBlocks.push(this.reedSolomonEncode(block, ecPerBlock));
    }

    const result = [];
    for (let i = 0; i < dataPerBlock; i++) {
      for (let j = 0; j < numBlocks; j++) {
        if (i < dataBlocks[j].length) {
          result.push(dataBlocks[j][i]);
        }
      }
    }

    for (let i = 0; i < ecPerBlock; i++) {
      for (let j = 0; j < numBlocks; j++) {
        if (i < ecBlocks[j].length) {
          result.push(ecBlocks[j][i]);
        }
      }
    }

    return result;
  }

  static reedSolomonEncode(data, ecCount) {
    const poly = this.POLYNOMIALS[ecCount] || this.generatePolynomial(ecCount);
    const result = new Array(ecCount).fill(0);

    for (let i = 0; i < data.length; i++) {
      const lead = data[i] ^ result[0];
      result.shift();
      result.push(0);
      for (let j = 0; j < ecCount; j++) {
        result[j] ^= this.galoisMul(poly[j + 1] || 1, lead);
      }
    }
    return result;
  }

  static generatePolynomial(degree) {
    let poly = [1];
    for (let i = 0; i < degree; i++) {
      const newPoly = new Array(poly.length + 1).fill(0);
      for (let j = 0; j < poly.length; j++) {
        newPoly[j] ^= poly[j];
        newPoly[j + 1] ^= this.galoisMul(poly[j], this.galoisPow(2, i));
      }
      poly = newPoly;
    }
    return poly.slice(1);
  }

  static galoisMul(a, b) {
    let result = 0;
    for (let i = 0; i < 8; i++) {
      if (b & 1) result ^= a;
      const carry = a & 0x80;
      a = (a << 1) & 0xFF;
      if (carry) a ^= 0x1B;
      b >>= 1;
    }
    return result;
  }

  static galoisPow(base, exp) {
    let result = 1;
    for (let i = 0; i < exp; i++) {
      result = this.galoisMul(result, base);
    }
    return result;
  }

  static createMatrix(version) {
    const size = version * 4 + 17;
    const matrix = Array.from({ length: size }, () => new Array(size).fill(null));
    const reserved = Array.from({ length: size }, () => new Array(size).fill(false));
    return { matrix, reserved, size };
  }

  static placeFunctionPatterns(qr, version) {
    this.placeFinderPattern(qr, 0, 0);
    this.placeFinderPattern(qr, qr.size - 7, 0);
    this.placeFinderPattern(qr, 0, qr.size - 7);
    this.placeSeparators(qr, version);
    this.placeAlignmentPatterns(qr, version);
    this.placeTimingPatterns(qr);
    this.placeDarkModule(qr, version);
  }

  static placeFinderPattern(qr, row, col) {
    const pattern = [
      [1,1,1,1,1,1,1],
      [1,0,0,0,0,0,1],
      [1,0,1,1,1,0,1],
      [1,0,1,1,1,0,1],
      [1,0,1,1,1,0,1],
      [1,0,0,0,0,0,1],
      [1,1,1,1,1,1,1]
    ];
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (row + r < qr.size && col + c < qr.size) {
          qr.matrix[row + r][col + c] = pattern[r][c];
          qr.reserved[row + r][col + c] = true;
        }
      }
    }
  }

  static placeSeparators(qr, version) {
    for (let i = 0; i < 8; i++) {
      this.setReserved(qr, 7, i, false);
      this.setReserved(qr, i, 7, false);
      this.setReserved(qr, qr.size - 8, i, false);
      this.setReserved(qr, i, qr.size - 8, false);
      this.setReserved(qr, 7, qr.size - 1 - i, false);
      this.setReserved(qr, qr.size - 1 - i, 7, false);
    }
  }

  static placeAlignmentPatterns(qr, version) {
    if (version < 2) return;
    const positions = this.getAlignmentPositions(version);
    for (const row of positions) {
      for (const col of positions) {
        if (qr.reserved[row - 2] && qr.reserved[row - 2][col - 2]) continue;
        this.placeSingleAlignment(qr, row - 2, col - 2);
      }
    }
  }

  static getAlignmentPositions(version) {
    if (version === 1) return [];
    const first = 6;
    const last = version * 4 + 10;
    const count = Math.floor(version / 7) + 2;
    const step = Math.round((last - first) / (count - 1));
    const positions = [first];
    for (let i = 1; i < count - 1; i++) {
      positions.push(first + step * i);
    }
    positions.push(last);
    return positions;
  }

  static placeSingleAlignment(qr, row, col) {
    const pattern = [
      [1,1,1,1,1],
      [1,0,0,0,1],
      [1,0,1,0,1],
      [1,0,0,0,1],
      [1,1,1,1,1]
    ];
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (row + r >= 0 && row + r < qr.size && col + c >= 0 && col + c < qr.size) {
          qr.matrix[row + r][col + c] = pattern[r][c];
          qr.reserved[row + r][col + c] = true;
        }
      }
    }
  }

  static placeTimingPatterns(qr) {
    for (let i = 8; i < qr.size - 8; i++) {
      if (!qr.reserved[6][i]) {
        qr.matrix[6][i] = i % 2 === 0 ? 1 : 0;
        qr.reserved[6][i] = true;
      }
      if (!qr.reserved[i][6]) {
        qr.matrix[i][6] = i % 2 === 0 ? 1 : 0;
        qr.reserved[i][6] = true;
      }
    }
  }

  static placeDarkModule(qr, version) {
    qr.matrix[4 * version + 9][8] = 1;
    qr.reserved[4 * version + 9][8] = true;
  }

  static setReserved(qr, row, col, value) {
    if (row >= 0 && row < qr.size && col >= 0 && col < qr.size) {
      qr.matrix[row][col] = value;
      qr.reserved[row][col] = true;
    }
  }

  static placeData(qr, dataBytes) {
    let bitIndex = 0;
    const totalBits = dataBytes.length * 8;
    let col = qr.size - 1;
    let upward = true;

    while (col >= 0) {
      if (col === 6) col--;
      for (let i = 0; i < qr.size; i++) {
        const row = upward ? qr.size - 1 - i : i;
        for (let c = 0; c < 2; c++) {
          const currentCol = col - c;
          if (currentCol >= 0 && !qr.reserved[row][currentCol]) {
            if (bitIndex < totalBits) {
              const byteIndex = Math.floor(bitIndex / 8);
              const bitPosition = 7 - (bitIndex % 8);
              qr.matrix[row][currentCol] = (dataBytes[byteIndex] >> bitPosition) & 1;
              bitIndex++;
            } else {
              qr.matrix[row][currentCol] = 0;
            }
          }
        }
      }
      upward = !upward;
      col -= 2;
    }
  }

  static applyMask(qr, maskIndex) {
    const masks = [
      (r, c) => (r + c) % 2 === 0,
      (r, c) => r % 2 === 0,
      (r, c) => c % 3 === 0,
      (r, c) => (r + c) % 3 === 0,
      (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
      (r, c) => ((r * c) % 2 + (r * c) % 3) === 0,
      (r, c) => ((r * c) % 2 + (r * c) % 3) % 2 === 0,
      (r, c) => ((r + c) % 2 + (r * c) % 3) % 2 === 0
    ];

    const maskFn = masks[maskIndex];
    for (let r = 0; r < qr.size; r++) {
      for (let c = 0; c < qr.size; c++) {
        if (!qr.reserved[r][c] && maskFn(r, c)) {
          qr.matrix[r][c] ^= 1;
        }
      }
    }
  }

  static placeFormatInfo(qr, ecLevel, maskIndex) {
    const ecIndex = this.EC_LEVELS[ecLevel];
    const formatIndex = (ecIndex << 3) | maskIndex;
    const formatInfo = this.FORMAT_INFO[formatIndex];

    const bits = [];
    for (let i = 14; i >= 0; i--) {
      bits.push((formatInfo >> i) & 1);
    }

    const positions1 = [
      [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
      [7, 8], [8, 8], [8, 7], [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0]
    ];

    const positions2 = [
      [8, qr.size - 1], [8, qr.size - 2], [8, qr.size - 3], [8, qr.size - 4],
      [8, qr.size - 5], [8, qr.size - 6], [8, qr.size - 7],
      [qr.size - 7, 8], [qr.size - 6, 8], [qr.size - 5, 8], [qr.size - 4, 8],
      [qr.size - 3, 8], [qr.size - 2, 8], [qr.size - 1, 8]
    ];

    for (let i = 0; i < 15; i++) {
      const [r1, c1] = positions1[i];
      qr.matrix[r1][c1] = bits[i];
      qr.reserved[r1][c1] = true;

      if (i < 8) {
        const [r2, c2] = positions2[i];
        qr.matrix[r2][c2] = bits[i];
        qr.reserved[r2][c2] = true;
      }
    }
  }

  static placeVersionInfo(qr, version) {
    if (version < 7) return;
    const versionInfo = this.getVersionInfo(version);
    for (let i = 0; i < 18; i++) {
      const bit = (versionInfo >> i) & 1;
      const row = Math.floor(i / 3);
      const col = i % 3;
      qr.matrix[row][qr.size - 11 + col] = bit;
      qr.reserved[row][qr.size - 11 + col] = true;
      qr.matrix[qr.size - 11 + col][row] = bit;
      qr.reserved[qr.size - 11 + col][row] = true;
    }
  }

  static getVersionInfo(version) {
    let result = version;
    for (let i = 0; i < 12; i++) {
      result = (result << 1) ^ ((result >> 11) * 0x1F25);
    }
    return (result << 12) | (version << 0);
  }

  static calculatePenalty(qr) {
    let penalty = 0;

    for (let r = 0; r < qr.size; r++) {
      let count = 1;
      for (let c = 1; c < qr.size; c++) {
        if (qr.matrix[r][c] === qr.matrix[r][c - 1]) {
          count++;
          if (count === 5) penalty += 3;
          else if (count > 5) penalty += 1;
        } else {
          count = 1;
        }
      }
    }

    for (let c = 0; c < qr.size; c++) {
      let count = 1;
      for (let r = 1; r < qr.size; r++) {
        if (qr.matrix[r][c] === qr.matrix[r - 1][c]) {
          count++;
          if (count === 5) penalty += 3;
          else if (count > 5) penalty += 1;
        } else {
          count = 1;
        }
      }
    }

    return penalty;
  }

  static selectBestMask(qr, ecLevel, dataBytes) {
    let bestMask = 0;
    let bestPenalty = Infinity;

    for (let mask = 0; mask < 8; mask++) {
      const testQr = {
        matrix: qr.matrix.map(row => [...row]),
        reserved: qr.reserved.map(row => [...row]),
        size: qr.size
      };

      this.placeData(testQr, dataBytes);
      this.applyMask(testQr, mask);
      this.placeFormatInfo(testQr, ecLevel, mask);

      const penalty = this.calculatePenalty(testQr);
      if (penalty < bestPenalty) {
        bestPenalty = penalty;
        bestMask = mask;
      }
    }

    return bestMask;
  }

  static generate(text, options = {}) {
    const {
      ecLevel = 'M',
      size = 256,
      foreground = '#000000',
      background = '#FFFFFF',
      margin = 4
    } = options;

    const dataBytes = this.encodeText(text);
    const version = this.getVersion(dataBytes.length, ecLevel);
    if (version === -1) throw new Error('Text too long for QR code');

    const qr = this.createMatrix(version);
    this.placeFunctionPatterns(qr, version);
    const ecIndex = this.EC_LEVELS[ecLevel];
    const ecPerBlock = this.getEcPerBlock(version, ecIndex);
    const numBlocks = this.getNumBlocks(version, ecIndex);
    const totalCodewords = this.getTotalCodewords(version);
    const dataPerBlock = Math.floor((totalCodewords - ecPerBlock * numBlocks) / numBlocks);

    const codewords = this.encodeData(text, version, ecLevel);
    const mask = this.selectBestMask(qr, ecLevel, codewords);

    const finalQr = this.createMatrix(version);
    this.placeFunctionPatterns(finalQr, version);
    this.placeData(finalQr, codewords);
    this.applyMask(finalQr, mask);
    this.placeFormatInfo(finalQr, ecLevel, mask);
    this.placeVersionInfo(finalQr, version);

    return this.renderToCanvas(finalQr, size, foreground, background, margin);
  }

  static encodeText(text) {
    const bytes = [];
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      if (code < 128) {
        bytes.push(code);
      } else if (code < 2048) {
        bytes.push(0xC0 | (code >> 6));
        bytes.push(0x80 | (code & 0x3F));
      } else if (code < 65536) {
        bytes.push(0xE0 | (code >> 12));
        bytes.push(0x80 | ((code >> 6) & 0x3F));
        bytes.push(0x80 | (code & 0x3F));
      } else {
        bytes.push(0xF0 | (code >> 18));
        bytes.push(0x80 | ((code >> 12) & 0x3F));
        bytes.push(0x80 | ((code >> 6) & 0x3F));
        bytes.push(0x80 | (code & 0x3F));
      }
    }
    return bytes;
  }

  static renderToCanvas(qr, outputSize, fg, bg, margin) {
    const canvas = document.createElement('canvas');
    const moduleSize = Math.floor((outputSize - margin * 2) / qr.size);
    const actualSize = moduleSize * qr.size + margin * 2;
    canvas.width = actualSize;
    canvas.height = actualSize;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, actualSize, actualSize);

    ctx.fillStyle = fg;
    for (let r = 0; r < qr.size; r++) {
      for (let c = 0; c < qr.size; c++) {
        if (qr.matrix[r][c] === 1) {
          ctx.fillRect(margin + c * moduleSize, margin + r * moduleSize, moduleSize, moduleSize);
        }
      }
    }

    return canvas;
  }

  static generateSVG(text, options = {}) {
    const {
      ecLevel = 'M',
      size = 256,
      foreground = '#000000',
      background = '#FFFFFF',
      margin = 4
    } = options;

    const dataBytes = this.encodeText(text);
    const version = this.getVersion(dataBytes.length, ecLevel);
    if (version === -1) throw new Error('Text too long for QR code');

    const qr = this.createMatrix(version);
    this.placeFunctionPatterns(qr, version);
    const ecIndex = this.EC_LEVELS[ecLevel];
    const ecPerBlock = this.getEcPerBlock(version, ecIndex);
    const numBlocks = this.getNumBlocks(version, ecIndex);
    const totalCodewords = this.getTotalCodewords(version);
    const dataPerBlock = Math.floor((totalCodewords - ecPerBlock * numBlocks) / numBlocks);

    const codewords = this.encodeData(text, version, ecLevel);
    const mask = this.selectBestMask(qr, ecLevel, codewords);

    const finalQr = this.createMatrix(version);
    this.placeFunctionPatterns(finalQr, version);
    this.placeData(finalQr, codewords);
    this.applyMask(finalQr, mask);
    this.placeFormatInfo(finalQr, ecLevel, mask);
    this.placeVersionInfo(finalQr, version);

    const moduleSize = Math.floor((size - margin * 2) / finalQr.size);
    const actualSize = moduleSize * finalQr.size + margin * 2;

    let paths = '';
    for (let r = 0; r < finalQr.size; r++) {
      for (let c = 0; c < finalQr.size; c++) {
        if (finalQr.matrix[r][c] === 1) {
          const x = margin + c * moduleSize;
          const y = margin + r * moduleSize;
          paths += `<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" fill="${foreground}"/>`;
        }
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${actualSize} ${actualSize}" width="${actualSize}" height="${actualSize}">
      <rect width="100%" height="100%" fill="${background}"/>
      ${paths}
    </svg>`;
  }

  static addLogo(canvas, logoUrl, callback) {
    const img = new Image();
    img.onload = () => {
      const ctx = canvas.getContext('2d');
      const logoSize = Math.floor(canvas.width * 0.2);
      const x = (canvas.width - logoSize) / 2;
      const y = (canvas.height - logoSize) / 2;

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(x - 4, y - 4, logoSize + 8, logoSize + 8);

      ctx.drawImage(img, x, y, logoSize, logoSize);
      callback(canvas);
    };
    img.src = logoUrl;
  }
}

if (typeof module !== 'undefined') {
  module.exports = QRGenerator;
}
