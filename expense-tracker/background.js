chrome.alarms.create('dailySummary', { periodInMinutes: 1440 });
chrome.alarms.create('weeklySummary', { periodInMinutes: 10080 });
chrome.alarms.create('backupReminder', { periodInMinutes: 43200 });

chrome.alarms.onAlarm.addListener(async alarm => {
  if (alarm.name === 'dailySummary') {
    const expenses = await getTodayExpensesFromStorage();
    const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    if (total > 0) {
      chrome.notifications.create('dailySummary', {
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Daily Expense Summary',
        message: `You spent $${total.toFixed(2)} today across ${expenses.length} transactions.`
      });
    }
    checkBudgetAlerts();
  }

  if (alarm.name === 'weeklySummary') {
    const expenses = await getWeekExpensesFromStorage();
    const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    chrome.notifications.create('weeklySummary', {
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Weekly Expense Summary',
      message: `This week: $${total.toFixed(2)} across ${expenses.length} transactions.`
    });
  }

  if (alarm.name === 'backupReminder') {
    chrome.notifications.create('backupReminder', {
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Data Backup Reminder',
      message: 'Consider exporting your expense data for backup.'
    });
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('dailySummary', { periodInMinutes: 1440 });
  chrome.alarms.create('weeklySummary', { periodInMinutes: 10080 });
  chrome.alarms.create('backupReminder', { periodInMinutes: 43200 });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_SUMMARY') {
    handleGetSummary(message.period).then(sendResponse);
    return true;
  }
  if (message.type === 'CHECK_BUDGET') {
    checkBudgetAlerts().then(sendResponse);
    return true;
  }
  if (message.type === 'EXPORT_DATA') {
    handleExport(message.format).then(sendResponse);
    return true;
  }
});

async function handleGetSummary(period) {
  const expenses = await getExpensesFromStorage();
  const now = new Date();
  let filtered = [];

  if (period === 'today') {
    const today = now.toISOString().split('T')[0];
    filtered = expenses.filter(e => e.date === today);
  } else if (period === 'week') {
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    filtered = expenses.filter(e => new Date(e.date) >= weekAgo);
  } else if (period === 'month') {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    filtered = expenses.filter(e => new Date(e.date) >= monthStart);
  }

  const total = filtered.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  return { total, count: filtered.length, expenses: filtered };
}

async function checkBudgetAlerts() {
  const data = await chrome.storage.local.get('budget');
  const budget = data.budget || { monthly: 0 };
  if (budget.monthly <= 0) return null;

  const expenses = await getMonthExpensesFromStorage();
  const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const remaining = budget.monthly - total;
  const pctUsed = (total / budget.monthly) * 100;

  if (pctUsed >= 100) {
    chrome.notifications.create('budgetExceeded', {
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Budget Exceeded!',
      message: `You've exceeded your monthly budget by $${Math.abs(remaining).toFixed(2)}!`
    });
  } else if (pctUsed >= 80) {
    chrome.notifications.create('budgetWarning', {
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Budget Warning',
      message: `You've used ${pctUsed.toFixed(0)}% of your monthly budget. $${remaining.toFixed(2)} remaining.`
    });
  }

  return { total, remaining, pctUsed, budget: budget.monthly };
}

async function handleExport(format) {
  const expenses = await getExpensesFromStorage();
  const data = await chrome.storage.local.get('categories');
  const categories = data.categories || [];

  if (format === 'csv') {
    const headers = ['Date', 'Category', 'Amount', 'Description'];
    const rows = expenses.map(e => [e.date, e.category, e.amount, `"${e.description || ''}"`]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }
  return JSON.stringify({ expenses, categories }, null, 2);
}

async function getExpensesFromStorage() {
  const data = await chrome.storage.local.get('expenses');
  return data.expenses || [];
}

async function getTodayExpensesFromStorage() {
  const expenses = await getExpensesFromStorage();
  const today = new Date().toISOString().split('T')[0];
  return expenses.filter(e => e.date === today);
}

async function getWeekExpensesFromStorage() {
  const expenses = await getExpensesFromStorage();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  return expenses.filter(e => new Date(e.date) >= weekAgo);
}

async function getMonthExpensesFromStorage() {
  const expenses = await getExpensesFromStorage();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return expenses.filter(e => new Date(e.date) >= monthStart);
}