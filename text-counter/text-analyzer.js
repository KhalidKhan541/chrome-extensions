const TextAnalyzer = {
  analyze(text) {
    if (!text || text.length === 0) {
      return this.getEmptyStats();
    }

    return {
      characters: this.countCharacters(text),
      words: this.countWords(text),
      sentences: this.countSentences(text),
      paragraphs: this.countParagraphs(text),
      lines: this.countLines(text),
      readingTime: this.calculateReadingTime(text),
      speakingTime: this.calculateSpeakingTime(text),
      pageCount: this.calculatePageCount(text),
      readingLevel: this.calculateReadingLevel(text),
      letterCount: this.countLetters(text),
      digitCount: this.countDigits(text),
      specialCount: this.countSpecialChars(text)
    };
  },

  getEmptyStats() {
    return {
      characters: { total: 0, withoutSpaces: 0 },
      words: { total: 0, averageLength: 0 },
      sentences: 0,
      paragraphs: 0,
      lines: 0,
      readingTime: 0,
      speakingTime: 0,
      pageCount: 0,
      readingLevel: { score: 0, grade: 'Elementary' },
      letterCount: 0,
      digitCount: 0,
      specialCount: 0
    };
  },

  countCharacters(text) {
    const total = text.length;
    const withoutSpaces = text.replace(/\s/g, '').length;
    return { total, withoutSpaces };
  },

  countWords(text) {
    const trimmed = text.trim();
    if (trimmed.length === 0) return { total: 0, averageLength: 0 };
    
    const words = trimmed.split(/\s+/).filter(word => word.length > 0);
    const total = words.length;
    const totalLength = words.reduce((sum, word) => sum + word.length, 0);
    const averageLength = total > 0 ? Math.round((totalLength / total) * 10) / 10 : 0;
    
    return { total, averageLength };
  },

  countSentences(text) {
    const trimmed = text.trim();
    if (trimmed.length === 0) return 0;
    
    const sentenceEnders = /[.!?]+/g;
    const sentences = trimmed.split(sentenceEnders).filter(s => s.trim().length > 0);
    return sentences.length;
  },

  countParagraphs(text) {
    const trimmed = text.trim();
    if (trimmed.length === 0) return 0;
    
    const paragraphs = trimmed.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    return paragraphs.length;
  },

  countLines(text) {
    if (text.length === 0) return 0;
    
    const lines = text.split('\n');
    return lines.length;
  },

  calculateReadingTime(text) {
    const words = this.countWords(text).total;
    const wordsPerMinute = 200;
    const minutes = Math.ceil(words / wordsPerMinute);
    return minutes;
  },

  calculateSpeakingTime(text) {
    const words = this.countWords(text).total;
    const wordsPerMinute = 130;
    const minutes = Math.ceil(words / wordsPerMinute);
    return minutes;
  },

  calculatePageCount(text) {
    const words = this.countWords(text).total;
    const wordsPerPage = 250;
    const pages = Math.ceil(words / wordsPerPage);
    return pages;
  },

  calculateReadingLevel(text) {
    const words = this.countWords(text);
    const sentences = this.countSentences(text);
    const syllables = this.countSyllables(text);
    
    if (words.total === 0 || sentences === 0) {
      return { score: 0, grade: 'Elementary' };
    }
    
    const score = this.fleschKincaidGrade(words.total, sentences, syllables);
    const grade = this.getGradeLevel(score);
    
    return { score: Math.round(score * 10) / 10, grade };
  },

  countSyllables(text) {
    const words = text.toLowerCase().match(/[a-z]+/g) || [];
    let totalSyllables = 0;
    
    for (const word of words) {
      totalSyllables += this.countWordSyllables(word);
    }
    
    return totalSyllables;
  },

  countWordSyllables(word) {
    if (word.length <= 3) return 1;
    
    word = word.toLowerCase();
    let count = 0;
    const vowels = 'aeiouy';
    let prevVowel = false;
    
    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i]);
      if (isVowel && !prevVowel) {
        count++;
      }
      prevVowel = isVowel;
    }
    
    if (word.endsWith('e')) count--;
    if (word.endsWith('le') && word.length > 2) count++;
    if (count === 0) count = 1;
    
    return count;
  },

  fleschKincaidGrade(words, sentences, syllables) {
    const term1 = 0.39 * (words / sentences);
    const term2 = 11.8 * (syllables / words);
    return term1 + term2 - 15.59;
  },

  getGradeLevel(score) {
    if (score < 3) return 'Elementary';
    if (score < 6) return 'Easy';
    if (score < 10) return 'Standard';
    if (score < 14) return 'Difficult';
    return 'Very Difficult';
  },

  countLetters(text) {
    return (text.match(/[a-zA-Z]/g) || []).length;
  },

  countDigits(text) {
    return (text.match(/[0-9]/g) || []).length;
  },

  countSpecialChars(text) {
    return (text.match(/[^a-zA-Z0-9\s]/g) || []).length;
  },

  getCharacterTypes(text) {
    return {
      letters: this.countLetters(text),
      digits: this.countDigits(text),
      spaces: (text.match(/\s/g) || []).length,
      special: this.countSpecialChars(text)
    };
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = TextAnalyzer;
}
