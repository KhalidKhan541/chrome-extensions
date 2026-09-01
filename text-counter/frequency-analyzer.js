const FrequencyAnalyzer = {
  getCharacterFrequency(text) {
    const freq = {};
    
    for (const char of text) {
      if (char === ' ') continue;
      freq[char] = (freq[char] || 0) + 1;
    }
    
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);
  },

  getWordFrequency(text, minLength = 2) {
    const stopWords = new Set([
      'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
      'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
      'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
      'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
      'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
      'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
      'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see',
      'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over',
      'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work',
      'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these',
      'give', 'day', 'most', 'us', 'is', 'am', 'are', 'was', 'were', 'been',
      'being', 'has', 'had', 'did', 'does', 'doing', 'done', 'should', 'may',
      'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'to',
      'from', 'by', 'on', 'off', 'over', 'under', 'again', 'further', 'then',
      'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'both',
      'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor',
      'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't',
      'don', 'now'
    ]);
    
    const words = text.toLowerCase().match(/[a-z']+/g) || [];
    const freq = {};
    
    for (const word of words) {
      if (word.length >= minLength && !stopWords.has(word)) {
        freq[word] = (freq[word] || 0) + 1;
      }
    }
    
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);
  },

  getNGrams(text, n = 2) {
    const cleanText = text.toLowerCase().replace(/[^a-z]/g, '');
    const ngrams = {};
    
    for (let i = 0; i <= cleanText.length - n; i++) {
      const gram = cleanText.slice(i, i + n);
      ngrams[gram] = (ngrams[gram] || 0) + 1;
    }
    
    return Object.entries(ngrams)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  },

  getMostCommonWords(text, count = 10) {
    return this.getWordFrequency(text, 2).slice(0, count);
  },

  getLeastCommonWords(text, count = 10) {
    const words = text.toLowerCase().match(/[a-z']+/g) || [];
    const freq = {};
    
    for (const word of words) {
      freq[word] = (freq[word] || 0) + 1;
    }
    
    return Object.entries(freq)
      .filter(([word]) => word.length >= 3)
      .sort((a, b) => a[1] - b[1])
      .slice(0, count);
  },

  getCharTypeDistribution(text) {
    const letters = (text.match(/[a-zA-Z]/g) || []).length;
    const digits = (text.match(/[0-9]/g) || []).length;
    const spaces = (text.match(/\s/g) || []).length;
    const special = (text.match(/[^a-zA-Z0-9\s]/g) || []).length;
    const total = text.length || 1;
    
    return [
      { label: 'Letters', value: letters, percent: Math.round((letters / total) * 100) },
      { label: 'Digits', value: digits, percent: Math.round((digits / total) * 100) },
      { label: 'Spaces', value: spaces, percent: Math.round((spaces / total) * 100) },
      { label: 'Special', value: special, percent: Math.round((special / total) * 100) }
    ];
  },

  getLetterFrequency(text) {
    const freq = {};
    const letters = text.toLowerCase().match(/[a-z]/g) || [];
    
    for (const letter of letters) {
      freq[letter] = (freq[letter] || 0) + 1;
    }
    
    const result = [];
    for (let i = 97; i <= 122; i++) {
      const letter = String.fromCharCode(i);
      result.push([letter, freq[letter] || 0]);
    }
    
    return result.sort((a, b) => b[1] - a[1]);
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = FrequencyAnalyzer;
}
