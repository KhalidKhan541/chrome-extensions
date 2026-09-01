const StorageManager = {
  async getExpenses() {
    const data = await chrome.storage.local.get('expenses');
    return data.expenses || [];
  },

  async addExpense(expense) {
    const expenses = await this.getExpenses();
    expense.id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    expense.createdAt = new Date().toISOString();
    expenses.unshift(expense);
    await chrome.storage.local.set({ expenses });
    return expense;
  },

  async updateExpense(id, updates) {
    const expenses = await this.getExpenses();
    const idx = expenses.findIndex(e => e.id === id);
    if (idx !== -1) {
      expenses[idx] = { ...expenses[idx], ...updates, updatedAt: new Date().toISOString() };
      await chrome.storage.local.set({ expenses });
      return expenses[idx];
    }
    return null;
  },

  async deleteExpense(id) {
    let expenses = await this.getExpenses();
    expenses = expenses.filter(e => e.id !== id);
    await chrome.storage.local.set({ expenses });
    return expenses;
  },

  async getBudget() {
    const data = await chrome.storage.local.get('budget');
    return data.budget || { monthly: 0, weekly: 0 };
  },

  async setBudget(budget) {
    await chrome.storage.local.set({ budget });
  },

  async getExpensesByDateRange(startDate, endDate) {
    const expenses = await this.getExpenses();
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return expenses.filter(e => {
      const d = new Date(e.date);
      return d >= start && d <= end;
    });
  },

  async getThisMonthExpenses() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return this.getExpensesByDateRange(start, end);
  },

  async getThisWeekExpenses() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - dayOfWeek);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return this.getExpensesByDateRange(start, end);
  },

  async getTodayExpenses() {
    const now = new Date();
    return this.getExpensesByDateRange(now, now);
  },

  async getMonthlySummary() {
    const expenses = await this.getThisMonthExpenses();
    const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const byCategory = {};
    expenses.forEach(e => {
      byCategory[e.category] = (byCategory[e.category] || 0) + parseFloat(e.amount);
    });
    return { total, count: expenses.length, byCategory, expenses };
  },

  async getDailyTotals(days = 7) {
    const expenses = await this.getExpenses();
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);
      const dayExpenses = expenses.filter(e => {
        const ed = new Date(e.date);
        return ed >= dayStart && ed <= dayEnd;
      });
      const total = dayExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
      result.push({
        date: d.toISOString().split('T')[0],
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        total
      });
    }
    return result;
  },

  async getWeeklyTotals(weeks = 4) {
    const expenses = await this.getExpenses();
    const result = [];
    for (let i = weeks - 1; i >= 0; i--) {
      const now = new Date();
      const weekEnd = new Date(now);
      weekEnd.setDate(now.getDate() - (i * 7));
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekEnd.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);
      weekEnd.setHours(23, 59, 59, 999);
      const weekExpenses = expenses.filter(e => {
        const ed = new Date(e.date);
        return ed >= weekStart && ed <= weekEnd;
      });
      const total = weekExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
      result.push({
        weekStart: weekStart.toISOString().split('T')[0],
        label: `W${weeks - i}`,
        total
      });
    }
    return result;
  },

  async exportData(format = 'json') {
    const expenses = await this.getExpenses();
    const categories = await getCategories();
    const budget = await this.getBudget();
    return { expenses, categories, budget, exportedAt: new Date().toISOString() };
  },

  async importData(data) {
    if (data.expenses) await chrome.storage.local.set({ expenses: data.expenses });
    if (data.categories) await saveCategories(data.categories);
    if (data.budget) await this.setBudget(data.budget);
  },

  async clearAllData() {
    await chrome.storage.local.clear();
  },

  async migrateData() {
    const data = await chrome.storage.local.get(null);
    if (!data.version) {
      await chrome.storage.local.set({ version: 1 });
    }
  }
};

StorageManager.migrateData();