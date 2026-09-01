class BookmarkManager {
  constructor() {
    this.tagData = {};
    this.folderTree = [];
    this.allBookmarks = [];
  }

  async init() {
    const stored = await chrome.storage.local.get(['tagData']);
    this.tagData = stored.tagData || {};
  }

  async saveTagData() {
    await chrome.storage.local.set({ tagData: this.tagData });
  }

  async getAllBookmarks() {
    const tree = await chrome.bookmarks.getTree();
    this.allBookmarks = [];
    this.folderTree = [];
    this._flatten(tree[0], 0);
    return this.allBookmarks;
  }

  _flatten(node, depth) {
    if (node.children) {
      for (const child of node.children) {
        if (child.url) {
          this.allBookmarks.push({
            id: child.id,
            title: child.title || '',
            url: child.url,
            dateAdded: parseInt(child.dateAdded) || Date.now(),
            parentId: child.parentId,
            tags: this.tagData[child.id] || [],
            favicon: this._getFaviconUrl(child.url)
          });
        } else {
          this.folderTree.push({
            id: child.id,
            title: child.title || 'Untitled Folder',
            parentId: child.parentId || null,
            depth
          });
          this._flatten(child, depth + 1);
        }
      }
    }
  }

  _getFaviconUrl(url) {
    try {
      const u = new URL(url);
      return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=32`;
    } catch {
      return '';
    }
  }

  async addBookmark(title, url, parentId, tags = []) {
    const result = await chrome.bookmarks.create({ parentId, title, url });
    if (tags.length > 0) {
      this.tagData[result.id] = tags;
      await this.saveTagData();
    }
    return result;
  }

  async removeBookmark(id) {
    await chrome.bookmarks.remove(id);
    delete this.tagData[id];
    await this.saveTagData();
  }

  async removeFolder(id) {
    await chrome.bookmarks.removeTree(id);
    for (const key of Object.keys(this.tagData)) {
      const bm = this.allBookmarks.find(b => b.id === key);
      if (bm && bm.parentId === id) {
        delete this.tagData[key];
      }
    }
    await this.saveTagData();
  }

  async updateBookmark(id, changes) {
    await chrome.bookmarks.update(id, changes);
  }

  async moveBookmark(id, parentId) {
    await chrome.bookmarks.move(id, { parentId });
  }

  async createFolder(title, parentId) {
    return await chrome.bookmarks.create({ parentId, title });
  }

  async setTags(bookmarkId, tags) {
    this.tagData[bookmarkId] = tags;
    await this.saveTagData();
  }

  async addTag(bookmarkId, tag) {
    if (!this.tagData[bookmarkId]) this.tagData[bookmarkId] = [];
    if (!this.tagData[bookmarkId].includes(tag)) {
      this.tagData[bookmarkId].push(tag);
      await this.saveTagData();
    }
  }

  async removeTag(bookmarkId, tag) {
    if (this.tagData[bookmarkId]) {
      this.tagData[bookmarkId] = this.tagData[bookmarkId].filter(t => t !== tag);
      await this.saveTagData();
    }
  }

  async bulkDelete(ids) {
    for (const id of ids) {
      await chrome.bookmarks.remove(id);
      delete this.tagData[id];
    }
    await this.saveTagData();
  }

  async bulkMove(ids, parentId) {
    for (const id of ids) {
      await chrome.bookmarks.move(id, { parentId });
    }
  }

  async bulkTag(ids, tag) {
    for (const id of ids) {
      await this.addTag(id, tag);
    }
  }

  async duplicateCheck(url) {
    await this.getAllBookmarks();
    return this.allBookmarks.some(b => b.url === url);
  }

  async exportBookmarks() {
    await this.getAllBookmarks();
    const data = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      bookmarks: this.allBookmarks,
      folders: this.folderTree,
      tags: this.tagData
    };
    return JSON.stringify(data, null, 2);
  }

  async importBookmarks(jsonString) {
    const data = JSON.parse(jsonString);
    if (!data.bookmarks) throw new Error('Invalid import file');

    let imported = 0;
    let skipped = 0;
    const rootId = (await chrome.bookmarks.getTree())[0].children[0].id;

    for (const bm of data.bookmarks) {
      const exists = await this.duplicateCheck(bm.url);
      if (exists) {
        skipped++;
        continue;
      }
      await this.addBookmark(bm.title, bm.url, rootId, bm.tags || []);
      imported++;
    }

    return { imported, skipped };
  }

  getFolderTree() {
    return this.folderTree;
  }

  getBookmarksInFolder(folderId) {
    return this.allBookmarks.filter(b => b.parentId === folderId);
  }

  getAllTags() {
    const tagCount = {};
    for (const tags of Object.values(this.tagData)) {
      for (const tag of tags) {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      }
    }
    return tagCount;
  }
}

if (typeof module !== 'undefined') {
  module.exports = BookmarkManager;
}
