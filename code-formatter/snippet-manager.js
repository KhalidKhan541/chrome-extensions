const SnippetManager = {
  STORAGE_KEY: 'code_formatter_snippets',

  async getSnippets() {
    return new Promise((resolve) => {
      chrome.storage.local.get(this.STORAGE_KEY, (result) => {
        resolve(result[this.STORAGE_KEY] || []);
      });
    });
  },

  async saveSnippets(snippets) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [this.STORAGE_KEY]: snippets }, resolve);
    });
  },

  async saveSnippet(name, code, language) {
    const snippets = await this.getSnippets();
    const snippet = {
      id: Date.now().toString(),
      name: name || `Snippet ${snippets.length + 1}`,
      code,
      language,
      createdAt: new Date().toISOString()
    };
    snippets.unshift(snippet);
    if (snippets.length > 50) {
      snippets.pop();
    }
    await this.saveSnippets(snippets);
    return snippet;
  },

  async deleteSnippet(id) {
    const snippets = await this.getSnippets();
    const filtered = snippets.filter(s => s.id !== id);
    await this.saveSnippets(filtered);
  },

  async updateSnippet(id, updates) {
    const snippets = await this.getSnippets();
    const index = snippets.findIndex(s => s.id === id);
    if (index !== -1) {
      snippets[index] = { ...snippets[index], ...updates };
      await this.saveSnippets(snippets);
    }
  },

  async exportSnippets() {
    const snippets = await this.getSnippets();
    return JSON.stringify(snippets, null, 2);
  },

  async importSnippets(jsonString) {
    try {
      const imported = JSON.parse(jsonString);
      if (!Array.isArray(imported)) {
        throw new Error('Invalid format');
      }
      const existing = await this.getSnippets();
      const merged = [...imported, ...existing];
      const unique = merged.filter((snippet, index, self) =>
        index === self.findIndex(s => s.id === snippet.id)
      );
      await this.saveSnippets(unique.slice(0, 100));
      return { success: true, count: imported.length };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
};

if (typeof window !== 'undefined') {
  window.SnippetManager = SnippetManager;
}
