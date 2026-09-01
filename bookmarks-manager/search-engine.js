class SearchEngine {
  constructor() {
    this.searchHistory = [];
    this.savedSearches = [];
    this.maxHistory = 20;
  }

  async init() {
    const stored = await chrome.storage.local.get(['searchHistory', 'savedSearches']);
    this.searchHistory = stored.searchHistory || [];
    this.savedSearches = stored.savedSearches || [];
  }

  async save() {
    await chrome.storage.local.set({
      searchHistory: this.searchHistory,
      savedSearches: this.savedSearches
    });
  }

  search(bookmarks, query, options = {}) {
    if (!query || query.trim() === '') return bookmarks;

    const q = query.toLowerCase().trim();
    const words = q.split(/\s+/);

    let results = bookmarks.filter(bm => {
      return words.every(word => this._matchesBookmark(bm, word));
    });

    if (options.sortBy) {
      results = this._sortResults(results, options.sortBy, options.sortDir);
    }

    this._addToHistory(query);
    return results;
  }

  _matchesBookmark(bm, word) {
    const title = (bm.title || '').toLowerCase();
    const url = (bm.url || '').toLowerCase();
    const tags = (bm.tags || []).join(' ').toLowerCase();

    if (title.includes(word)) return true;
    if (url.includes(word)) return true;
    if (tags.includes(word)) return true;
    if (this._fuzzyMatch(title, word)) return true;
    return false;
  }

  _fuzzyMatch(text, pattern) {
    let pi = 0;
    for (let ti = 0; ti < text.length && pi < pattern.length; ti++) {
      if (text[ti] === pattern[pi]) pi++;
    }
    return pi === pattern.length;
  }

  _sortResults(results, sortBy, sortDir = 'asc') {
    const sorted = [...results];
    sorted.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'name':
          cmp = (a.title || '').localeCompare(b.title || '');
          break;
        case 'date':
          cmp = (b.dateAdded || 0) - (a.dateAdded || 0);
          break;
        case 'url':
          cmp = (a.url || '').localeCompare(b.url || '');
          break;
        default:
          cmp = 0;
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return sorted;
  }

  searchByTags(bookmarks, tags) {
    if (!tags || tags.length === 0) return bookmarks;
    return bookmarks.filter(bm => {
      const bmTags = (bm.tags || []).map(t => t.toLowerCase());
      return tags.every(t => bmTags.includes(t.toLowerCase()));
    });
  }

  searchByFolder(bookmarks, folderId) {
    if (!folderId) return bookmarks;
    return bookmarks.filter(bm => bm.parentId === folderId);
  }

  filterByDateRange(bookmarks, startDate, endDate) {
    return bookmarks.filter(bm => {
      const d = bm.dateAdded || 0;
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    });
  }

  async saveSearch(name, query) {
    this.savedSearches.push({ name, query, date: Date.now() });
    await this.save();
  }

  async removeSavedSearch(index) {
    this.savedSearches.splice(index, 1);
    await this.save();
  }

  getSavedSearches() {
    return this.savedSearches;
  }

  _addToHistory(query) {
    this.searchHistory = this.searchHistory.filter(h => h.query !== query);
    this.searchHistory.unshift({ query, date: Date.now() });
    if (this.searchHistory.length > this.maxHistory) {
      this.searchHistory = this.searchHistory.slice(0, this.maxHistory);
    }
    this.save();
  }

  getSearchHistory() {
    return this.searchHistory;
  }

  async clearHistory() {
    this.searchHistory = [];
    await this.save();
  }

  getRecentSuggestions(query) {
    if (!query) return this.searchHistory.slice(0, 5).map(h => h.query);
    const q = query.toLowerCase();
    return this.searchHistory
      .filter(h => h.query.toLowerCase().includes(q))
      .map(h => h.query)
      .slice(0, 5);
  }
}

if (typeof module !== 'undefined') {
  module.exports = SearchEngine;
}
