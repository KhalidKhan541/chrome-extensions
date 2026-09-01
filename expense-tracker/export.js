const ExportManager = {
  async toCSV(expenses, categories) {
    const catMap = {};
    categories.forEach(c => catMap[c.id] = c.name);

    const headers = ['Date', 'Category', 'Amount', 'Description', 'Created At'];
    const rows = expenses.map(e => [
      e.date,
      catMap[e.category] || e.category,
      parseFloat(e.amount).toFixed(2),
      `"${(e.description || '').replace(/"/g, '""')}"`,
      e.createdAt || ''
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    return csv;
  },

  async toJSON(expenses, categories, budget) {
    return JSON.stringify({
      expenses,
      categories,
      budget,
      exportedAt: new Date().toISOString()
    }, null, 2);
  },

  async generateMonthlyReport(expenses, categories) {
    const catMap = {};
    categories.forEach(c => catMap[c.id] = c);

    const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const byCategory = {};
    expenses.forEach(e => {
      if (!byCategory[e.category]) byCategory[e.category] = { total: 0, count: 0 };
      byCategory[e.category].total += parseFloat(e.amount);
      byCategory[e.category].count++;
    });

    const now = new Date();
    const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    let report = `Monthly Expense Report - ${monthName}\n`;
    report += '='.repeat(40) + '\n\n';
    report += `Total Expenses: $${total.toFixed(2)}\n`;
    report += `Number of Transactions: ${expenses.length}\n`;
    report += `Average per Transaction: $${(total / (expenses.length || 1)).toFixed(2)}\n\n`;
    report += 'Category Breakdown:\n';
    report += '-'.repeat(30) + '\n';

    Object.entries(byCategory)
      .sort((a, b) => b[1].total - a[1].total)
      .forEach(([catId, data]) => {
        const cat = catMap[catId] || { name: catId, icon: '📦' };
        const pct = ((data.total / total) * 100).toFixed(1);
        report += `${cat.icon} ${cat.name}: $${data.total.toFixed(2)} (${pct}%) - ${data.count} items\n`;
      });

    report += '\nTop 5 Expenses:\n';
    report += '-'.repeat(30) + '\n';
    const top5 = [...expenses].sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount)).slice(0, 5);
    top5.forEach((e, i) => {
      const cat = catMap[e.category] || { name: e.category, icon: '📦' };
      report += `${i + 1}. $${parseFloat(e.amount).toFixed(2)} - ${cat.name} (${e.description || 'No description'})\n`;
    });

    return report;
  },

  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  async exportCSV() {
    const expenses = await StorageManager.getExpenses();
    const categories = await getCategories();
    const csv = await this.toJSON(expenses, categories);
    const now = new Date();
    const filename = `expenses_${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}.csv`;
    this.downloadFile(await this.toCSV(expenses, categories), filename, 'text/csv');
    return filename;
  },

  async exportJSON() {
    const data = await StorageManager.exportData();
    const json = await this.toJSON(data.expenses, data.categories, data.budget);
    const now = new Date();
    const filename = `expenses_backup_${now.toISOString().split('T')[0]}.json`;
    this.downloadFile(json, filename, 'application/json');
    return filename;
  },

  async exportMonthlyReport() {
    const expenses = await StorageManager.getThisMonthExpenses();
    const categories = await getCategories();
    const report = await this.generateMonthlyReport(expenses, categories);
    const now = new Date();
    const filename = `expense_report_${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}.txt`;
    this.downloadFile(report, filename, 'text/plain');
    return filename;
  },

  async exportDateRange(startDate, endDate) {
    const expenses = await StorageManager.getExpensesByDateRange(startDate, endDate);
    const categories = await getCategories();
    const csv = await this.toCSV(expenses, categories);
    const filename = `expenses_${startDate}_to_${endDate}.csv`;
    this.downloadFile(csv, filename, 'text/csv');
    return filename;
  }
};