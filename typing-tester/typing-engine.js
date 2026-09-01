class TypingEngine {
  constructor() {
    this.reset();
  }

  reset() {
    this.targetText = '';
    this.typedText = '';
    this.startTime = null;
    this.endTime = null;
    this.errors = 0;
    this.totalKeystrokes = 0;
    this.correctKeystrokes = 0;
    this.isRunning = false;
    this.isFinished = false;
    this.charStates = [];
  }

  setText(text) {
    this.reset();
    this.targetText = text;
    this.charStates = new Array(text.length).fill('pending');
  }

  start() {
    if (this.targetText && !this.isRunning) {
      this.isRunning = true;
      this.startTime = performance.now();
    }
  }

  handleKeyPress(char) {
    if (!this.isRunning || this.isFinished) return null;

    const pos = this.typedText.length;
    if (pos >= this.targetText.length) {
      this.finish();
      return { finished: true };
    }

    this.totalKeystrokes++;
    const expected = this.targetText[pos];

    if (char === expected) {
      this.typedText += char;
      this.correctKeystrokes++;
      this.charStates[pos] = 'correct';
    } else {
      this.typedText += char;
      this.errors++;
      this.charStates[pos] = 'incorrect';
    }

    this.updateCharStates();

    if (this.typedText.length >= this.targetText.length) {
      this.finish();
      return { finished: true, ...this.getStats() };
    }

    return { finished: false, ...this.getStats() };
  }

  handleBackspace() {
    if (!this.isRunning || this.isFinished) return null;

    if (this.typedText.length > 0) {
      const pos = this.typedText.length - 1;
      const wasCorrect = this.charStates[pos] === 'correct';
      this.typedText = this.typedText.slice(0, -1);
      this.charStates[pos] = 'pending';
      if (wasCorrect) this.correctKeystrokes--;
      else this.errors = Math.max(0, this.errors - 1);
    }

    return this.getStats();
  }

  updateCharStates() {
    for (let i = 0; i < this.typedText.length && i < this.targetText.length; i++) {
      if (this.typedText[i] === this.targetText[i]) {
        this.charStates[i] = 'correct';
      } else {
        this.charStates[i] = 'incorrect';
      }
    }
  }

  finish() {
    this.isRunning = false;
    this.isFinished = true;
    this.endTime = performance.now();
  }

  getStats() {
    const elapsed = this.startTime
      ? (this.endTime || performance.now()) - this.startTime
      : 0;
    const minutes = elapsed / 60000;
    const typedChars = this.typedText.length;
    const correctChars = this.charStates.filter(s => s === 'correct').length;

    const wpm = minutes > 0 ? Math.round((typedChars / 5) / minutes) : 0;
    const rawWpm = minutes > 0 ? Math.round((this.totalKeystrokes / 5) / minutes) : 0;
    const accuracy = this.totalKeystrokes > 0
      ? Math.round((this.correctKeystrokes / this.totalKeystrokes) * 100)
      : 100;

    return {
      wpm,
      rawWpm,
      accuracy,
      errors: this.errors,
      correctChars,
      totalChars: typedChars,
      targetLength: this.targetText.length,
      progress: Math.round((typedChars / this.targetText.length) * 100),
      elapsed: Math.round(elapsed / 1000),
      charStates: [...this.charStates],
      typedText: this.typedText,
      targetText: this.targetText,
      startTime: this.startTime,
      isRunning: this.isRunning,
      isFinished: this.isFinished
    };
  }

  getCurrentPosition() {
    return this.typedText.length;
  }

  isFinished() {
    return this.isFinished;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = TypingEngine;
}
