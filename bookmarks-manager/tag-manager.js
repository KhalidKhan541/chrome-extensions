class TagManager {
  constructor() {
    this.tags = {};
    this.colors = [
      '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
      '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
      '#06b6d4', '#10b981', '#84cc16', '#a855f7', '#d946ef'
    ];
  }

  async init() {
    const stored = await chrome.storage.local.get(['tagColors']);
    this.tags = stored.tagColors || {};
  }

  async save() {
    await chrome.storage.local.set({ tagColors: this.tags });
  }

  getTagColor(tag) {
    if (this.tags[tag]) return this.tags[tag];
    const idx = this._hashString(tag) % this.colors.length;
    return this.colors[idx];
  }

  async setTagColor(tag, color) {
    this.tags[tag] = color;
    await this.save();
  }

  async removeTagColor(tag) {
    delete this.tags[tag];
    await this.save();
  }

  _hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  }

  suggestTags(input, allTags) {
    if (!input) return [];
    const lower = input.toLowerCase();
    return allTags
      .filter(t => t.toLowerCase().includes(lower))
      .sort((a, b) => {
        const aStart = a.toLowerCase().startsWith(lower);
        const bStart = b.toLowerCase().startsWith(lower);
        if (aStart && !bStart) return -1;
        if (!aStart && bStart) return 1;
        return a.localeCompare(b);
      })
      .slice(0, 8);
  }

  getTagStats(bookmarks) {
    const stats = {};
    for (const bm of bookmarks) {
      for (const tag of (bm.tags || [])) {
        if (!stats[tag]) stats[tag] = { count: 0, bookmarks: [] };
        stats[tag].count++;
        stats[tag].bookmarks.push(bm.id);
      }
    }
    return stats;
  }

  getAllTagNames(bookmarks) {
    const tagSet = new Set();
    for (const bm of bookmarks) {
      for (const tag of (bm.tags || [])) {
        tagSet.add(tag);
      }
    }
    return [...tagSet].sort();
  }

  async renameTag(oldName, newName, tagDataRef) {
    for (const [bmId, tags] of Object.entries(tagDataRef)) {
      const idx = tags.indexOf(oldName);
      if (idx !== -1) {
        tags[idx] = newName;
      }
    }
    if (this.tags[oldName]) {
      this.tags[newName] = this.tags[oldName];
      delete this.tags[oldName];
    }
    await this.save();
  }

  async deleteTag(tag, tagDataRef) {
    for (const bmId of Object.keys(tagDataRef)) {
      tagDataRef[bmId] = tagDataRef[bmId].filter(t => t !== tag);
    }
    await this.removeTagColor(tag);
  }
}

if (typeof module !== 'undefined') {
  module.exports = TagManager;
}
