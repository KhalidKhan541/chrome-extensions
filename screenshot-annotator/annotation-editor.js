class AnnotationEditor {
  constructor(canvas, previewCanvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.previewCanvas = previewCanvas;
    this.previewCtx = previewCanvas.getContext('2d');

    this.baseImage = null;
    this.annotations = [];
    this.undoStack = [];
    this.redoStack = [];

    this.currentTool = 'arrow';
    this.currentColor = '#ff0000';
    this.currentWidth = 3;
    this.currentFontSize = 18;

    this.isDrawing = false;
    this.startX = 0;
    this.startY = 0;
    this.currentPath = [];

    this._bindEvents();
  }

  _bindEvents() {
    this.canvas.addEventListener('mousedown', (e) => this._onMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this._onMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this._onMouseUp(e));
    this.canvas.addEventListener('mouseleave', (e) => this._onMouseUp(e));
  }

  _getCoords(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  _onMouseDown(e) {
    const { x, y } = this._getCoords(e);
    this.isDrawing = true;
    this.startX = x;
    this.startY = y;

    if (this.currentTool === 'pen') {
      this.currentPath = [{ x, y }];
    }

    if (this.currentTool === 'text') {
      this.isDrawing = false;
      this._addTextAnnotation(x, y);
    }
  }

  _onMouseMove(e) {
    if (!this.isDrawing) return;

    const { x, y } = this._getCoords(e);

    if (this.currentTool === 'pen') {
      this.currentPath.push({ x, y });
    }

    this._drawPreview(x, y);
  }

  _onMouseUp(e) {
    if (!this.isDrawing) return;
    this.isDrawing = false;

    const { x, y } = this._getCoords(e);

    if (this.currentTool === 'pen' && this.currentPath.length > 1) {
      this._addAnnotation({
        type: 'pen',
        points: [...this.currentPath],
        color: this.currentColor,
        width: this.currentWidth
      });
      this.currentPath = [];
    } else if (this.currentTool !== 'text' && this.currentTool !== 'pen') {
      const annotation = this._createShapeAnnotation(this.startX, this.startY, x, y);
      if (annotation) {
        this._addAnnotation(annotation);
      }
    }

    this.previewCtx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
    this._redraw();
  }

  _createShapeAnnotation(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;

    switch (this.currentTool) {
      case 'arrow':
        return {
          type: 'arrow',
          x1, y1, x2, y2,
          color: this.currentColor,
          width: this.currentWidth
        };
      case 'rectangle':
        return {
          type: 'rectangle',
          x: Math.min(x1, x2),
          y: Math.min(y1, y2),
          width: Math.abs(dx),
          height: Math.abs(dy),
          color: this.currentColor,
          width: this.currentWidth
        };
      case 'circle':
        return {
          type: 'circle',
          cx: (x1 + x2) / 2,
          cy: (y1 + y2) / 2,
          rx: Math.abs(dx) / 2,
          ry: Math.abs(dy) / 2,
          color: this.currentColor,
          width: this.currentWidth
        };
      case 'line':
        return {
          type: 'line',
          x1, y1, x2, y2,
          color: this.currentColor,
          width: this.currentWidth
        };
      case 'highlight':
        return {
          type: 'highlight',
          x: Math.min(x1, x2),
          y: Math.min(y1, y2),
          width: Math.abs(dx),
          height: Math.abs(dy),
          color: this.currentColor
        };
      default:
        return null;
    }
  }

  _addTextAnnotation(x, y) {
    const text = prompt('Enter text:');
    if (!text) return;

    this._addAnnotation({
      type: 'text',
      x, y,
      text,
      color: this.currentColor,
      fontSize: this.currentFontSize,
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
    });
    this._redraw();
  }

  _addAnnotation(annotation) {
    this.undoStack.push([...this.annotations]);
    this.redoStack = [];
    this.annotations.push(annotation);
    this._redraw();
  }

  _drawPreview(x, y) {
    this.previewCtx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
    this.previewCtx.strokeStyle = this.currentColor;
    this.previewCtx.lineWidth = this.currentWidth;
    this.previewCtx.fillStyle = this.currentColor;
    this.previewCtx.lineCap = 'round';
    this.previewCtx.lineJoin = 'round';

    switch (this.currentTool) {
      case 'arrow':
        this._drawArrow(this.previewCtx, this.startX, this.startY, x, y, this.currentColor, this.currentWidth);
        break;
      case 'rectangle':
        this.previewCtx.strokeRect(
          Math.min(this.startX, x),
          Math.min(this.startY, y),
          Math.abs(x - this.startX),
          Math.abs(y - this.startY)
        );
        break;
      case 'circle':
        this.previewCtx.beginPath();
        this.previewCtx.ellipse(
          (this.startX + x) / 2,
          (this.startY + y) / 2,
          Math.abs(x - this.startX) / 2,
          Math.abs(y - this.startY) / 2,
          0, 0, Math.PI * 2
        );
        this.previewCtx.stroke();
        break;
      case 'line':
        this.previewCtx.beginPath();
        this.previewCtx.moveTo(this.startX, this.startY);
        this.previewCtx.lineTo(x, y);
        this.previewCtx.stroke();
        break;
      case 'highlight':
        this.previewCtx.fillStyle = this.currentColor + '40';
        this.previewCtx.fillRect(
          Math.min(this.startX, x),
          Math.min(this.startY, y),
          Math.abs(x - this.startX),
          Math.abs(y - this.startY)
        );
        break;
      case 'pen':
        if (this.currentPath.length > 1) {
          this.previewCtx.beginPath();
          this.previewCtx.moveTo(this.currentPath[0].x, this.currentPath[0].y);
          for (let i = 1; i < this.currentPath.length; i++) {
            this.previewCtx.lineTo(this.currentPath[i].x, this.currentPath[i].y);
          }
          this.previewCtx.stroke();
        }
        break;
    }
  }

  _redraw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.baseImage) {
      this.ctx.drawImage(this.baseImage, 0, 0, this.canvas.width, this.canvas.height);
    }

    this.annotations.forEach(a => this._drawAnnotation(this.ctx, a));
  }

  _drawAnnotation(ctx, a) {
    ctx.save();
    ctx.strokeStyle = a.color;
    ctx.fillStyle = a.color;
    ctx.lineWidth = a.width || 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (a.type) {
      case 'arrow':
        this._drawArrow(ctx, a.x1, a.y1, a.x2, a.y2, a.color, a.width);
        break;
      case 'rectangle':
        ctx.strokeRect(a.x, a.y, a.width, a.height);
        break;
      case 'circle':
        ctx.beginPath();
        ctx.ellipse(a.cx, a.cy, a.rx, a.ry, 0, 0, Math.PI * 2);
        ctx.stroke();
        break;
      case 'line':
        ctx.beginPath();
        ctx.moveTo(a.x1, a.y1);
        ctx.lineTo(a.x2, a.y2);
        ctx.stroke();
        break;
      case 'text':
        ctx.font = `${a.fontSize}px ${a.fontFamily}`;
        ctx.fillText(a.text, a.x, a.y);
        break;
      case 'highlight':
        ctx.fillStyle = a.color + '40';
        ctx.fillRect(a.x, a.y, a.width, a.height);
        break;
      case 'pen':
        if (a.points && a.points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(a.points[0].x, a.points[0].y);
          for (let i = 1; i < a.points.length; i++) {
            ctx.lineTo(a.points[i].x, a.points[i].y);
          }
          ctx.stroke();
        }
        break;
    }

    ctx.restore();
  }

  _drawArrow(ctx, x1, y1, x2, y2, color, width) {
    const headLen = Math.max(width * 4, 12);
    const angle = Math.atan2(y2 - y1, x2 - x1);

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(
      x2 - headLen * Math.cos(angle - Math.PI / 6),
      y2 - headLen * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      x2 - headLen * Math.cos(angle + Math.PI / 6),
      y2 - headLen * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
  }

  loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.baseImage = img;

        const maxW = 390;
        const maxH = 250;
        let w = img.width;
        let h = img.height;

        if (w > maxW || h > maxH) {
          const ratio = Math.min(maxW / w, maxH / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }

        this.canvas.width = w;
        this.canvas.height = h;
        this.previewCanvas.width = w;
        this.previewCanvas.height = h;
        this.previewCanvas.style.width = w + 'px';
        this.previewCanvas.style.height = h + 'px';

        this.annotations = [];
        this.undoStack = [];
        this.redoStack = [];
        this._redraw();
        resolve();
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  setTool(tool) {
    this.currentTool = tool;
  }

  setColor(color) {
    this.currentColor = color;
  }

  setWidth(width) {
    this.currentWidth = parseInt(width);
  }

  setFontSize(size) {
    this.currentFontSize = parseInt(size);
  }

  undo() {
    if (this.undoStack.length === 0) return;
    this.redoStack.push([...this.annotations]);
    this.annotations = this.undoStack.pop();
    this._redraw();
  }

  redo() {
    if (this.redoStack.length === 0) return;
    this.undoStack.push([...this.annotations]);
    this.annotations = this.redoStack.pop();
    this._redraw();
  }

  clear() {
    if (this.annotations.length === 0) return;
    this.undoStack.push([...this.annotations]);
    this.annotations = [];
    this.redoStack = [];
    this._redraw();
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  toDataURL(format = 'png') {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = this.baseImage ? this.baseImage.width : this.canvas.width;
    exportCanvas.height = this.baseImage ? this.baseImage.height : this.canvas.height;
    const exportCtx = exportCanvas.getContext('2d');

    if (this.baseImage) {
      exportCtx.drawImage(this.baseImage, 0, 0, exportCanvas.width, exportCanvas.height);
    }

    const scaleX = exportCanvas.width / this.canvas.width;
    const scaleY = exportCanvas.height / this.canvas.height;

    exportCtx.save();
    exportCtx.scale(scaleX, scaleY);
    this.annotations.forEach(a => this._drawAnnotation(exportCtx, a));
    exportCtx.restore();

    const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
    const quality = format === 'jpg' ? 0.92 : undefined;
    return exportCanvas.toDataURL(mimeType, quality);
  }

  getCursorForTool() {
    switch (this.currentTool) {
      case 'text': return 'text';
      case 'pen': return 'crosshair';
      case 'arrow':
      case 'line': return 'crosshair';
      case 'rectangle':
      case 'circle':
      case 'highlight': return 'crosshair';
      default: return 'default';
    }
  }

  updateCursor() {
    this.canvas.style.cursor = this.getCursorForTool();
  }
}
