let selectedCategory = null;
let categories = [];

document.addEventListener('DOMContentLoaded', async () => {
  categories = await getCategories();
  initTabs();
  initCategoryGrid();
  initForm();
  initModals();
  initHistoryFilter();
  setDefaultDate();
  await refreshAll();
});

function initTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
      if (tab.dataset.tab === 'dashboard') refreshDashboard();
      if (tab.dataset.tab === 'history') refreshHistory();
    });
  });
}

function initCategoryGrid() {
  const grid = document.getElementById('categoryGrid');
  grid.innerHTML = categories.map(c => `
    <button type="button" class="category-btn" data-id="${c.id}">
      <span class="cat-icon">${c.icon}</span>
      <span class="cat-name">${c.name}</span>
    </button>
  `).join('');

  grid.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      grid.querySelectorAll('.category-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedCategory = btn.dataset.id;
    });
  });

  if (categories.length > 0) {
    grid.querySelector('.category-btn').classList.add('selected');
    selectedCategory = categories[0].id;
  }
}

function initForm() {
  const form = document.getElementById('expenseForm');
  const recurringCheckbox = document.getElementById('recurring');
  const recurringFreq = document.getElementById('recurringFreq');

  recurringCheckbox.addEventListener('change', () => {
    recurringFreq.classList.toggle('hidden', !recurringCheckbox.checked);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('amount').value);
    const description = document.getElementById('description').value;
    const date = document.getElementById('date').value;
    const recurring = recurringCheckbox.checked;
    const recurringFrequency = recurringFreq.value;

    if (!amount || amount <= 0) {
      showToast('Please enter a valid amount');
      return;
    }
    if (!selectedCategory) {
      showToast('Please select a category');
      return;
    }

    await StorageManager.addExpense({
      amount,
      category: selectedCategory,
      description,
      date,
      recurring,
      recurringFrequency: recurring ? recurringFrequency : null
    });

    form.reset();
    setDefaultDate();
    selectedCategory = categories[0]?.id;
    document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('selected'));
    if (selectedCategory) {
      document.querySelector(`.category-btn[data-id="${selectedCategory}"]`)?.classList.add('selected');
    }
    recurringFreq.classList.add('hidden');

    showToast('Expense added!');
    await refreshAll();
  });
}

function initModals() {
  document.getElementById('btnSettings').addEventListener('click', async () => {
    const budget = await StorageManager.getBudget();
    document.getElementById('budgetInput').value = budget.monthly || '';
    document.getElementById('budgetModal').classList.remove('hidden');
  });

  document.getElementById('btnSaveBudget').addEventListener('click', async () => {
    const val = parseFloat(document.getElementById('budgetInput').value) || 0;
    await StorageManager.setBudget({ monthly: val });
    document.getElementById('budgetModal').classList.add('hidden');
    showToast('Budget saved!');
    await refreshAll();
  });

  document.getElementById('btnCancelBudget').addEventListener('click', () => {
    document.getElementById('budgetModal').classList.add('hidden');
  });

  document.getElementById('btnExport').addEventListener('click', () => {
    document.getElementById('exportModal').classList.remove('hidden');
  });

  document.getElementById('btnCancelExport').addEventListener('click', () => {
    document.getElementById('exportModal').classList.add('hidden');
  });

  document.getElementById('exportCSV').addEventListener('click', async () => {
    await ExportManager.exportCSV();
    document.getElementById('exportModal').classList.add('hidden');
    showToast('CSV exported!');
  });

  document.getElementById('exportJSON').addEventListener('click', async () => {
    await ExportManager.exportJSON();
    document.getElementById('exportModal').classList.add('hidden');
    showToast('JSON exported!');
  });

  document.getElementById('exportReport').addEventListener('click', async () => {
    await ExportManager.exportMonthlyReport();
    document.getElementById('exportModal').classList.add('hidden');
    showToast('Report exported!');
  });
}

function initHistoryFilter() {
  document.getElementById('historyFilter').addEventListener('change', () => refreshHistory());
}

function setDefaultDate() {
  document.getElementById('date').value = new Date().toISOString().split('T')[0];
}

async function refreshAll() {
  await Promise.all([refreshQuickSummary(), refreshBudget()]);
}

async function refreshQuickSummary() {
  const today = await StorageManager.getTodayExpenses();
  const week = await StorageManager.getThisWeekExpenses();
  const month = await StorageManager.getThisMonthExpenses();

  document.getElementById('todayTotal').textContent = '$' + today.reduce((s, e) => s + parseFloat(e.amount), 0).toFixed(2);
  document.getElementById('weekTotal').textContent = '$' + week.reduce((s, e) => s + parseFloat(e.amount), 0).toFixed(2);
  document.getElementById('monthTotal').textContent = '$' + month.reduce((s, e) => s + parseFloat(e.amount), 0).toFixed(2);
}

async function refreshBudget() {
  const budget = await StorageManager.getBudget();
  const month = await StorageManager.getThisMonthExpenses();
  const total = month.reduce((s, e) => s + parseFloat(e.amount), 0);

  document.getElementById('budgetSpent').textContent = '$' + total.toFixed(2);
  document.getElementById('budgetTotal').textContent = budget.monthly > 0 ? '$' + budget.monthly.toFixed(2) : 'No budget set';

  if (budget.monthly > 0) {
    const pct = Math.min((total / budget.monthly) * 100, 100);
    const fill = document.getElementById('budgetFill');
    fill.style.width = pct + '%';
    fill.className = 'budget-fill' + (pct >= 100 ? ' danger' : pct >= 80 ? ' warning' : '');

    const remaining = budget.monthly - total;
    const remEl = document.getElementById('budgetRemaining');
    if (remaining >= 0) {
      remEl.textContent = '$' + remaining.toFixed(2) + ' remaining';
      remEl.style.color = '#4ade80';
    } else {
      remEl.textContent = '$' + Math.abs(remaining).toFixed(2) + ' over budget';
      remEl.style.color = '#ef4444';
    }
  } else {
    document.getElementById('budgetFill').style.width = '0%';
    document.getElementById('budgetRemaining').textContent = '';
  }
}

async function refreshDashboard() {
  const catMap = {};
  categories.forEach(c => catMap[c.id] = c);

  const month = await StorageManager.getThisMonthExpenses();
  const byCategory = {};
  month.forEach(e => {
    byCategory[e.category] = (byCategory[e.category] || 0) + parseFloat(e.amount);
  });

  const pieData = Object.entries(byCategory)
    .map(([id, val]) => ({
      label: catMap[id]?.name || id,
      value: val,
      color: catMap[id]?.color || '#636E72'
    }))
    .sort((a, b) => b.value - a.value);

  const pieCanvas = document.getElementById('pieChart');
  pieCanvas.width = 320;
  pieCanvas.height = 200;
  ChartRenderer.drawPieChart(pieCanvas, pieData);

  const dailyData = await StorageManager.getDailyTotals(7);
  const barCanvas = document.getElementById('barChart');
  barCanvas.width = 320;
  barCanvas.height = 180;
  ChartRenderer.drawBarChart(barCanvas, dailyData);

  const weeklyData = await StorageManager.getWeeklyTotals(4);
  const trendCanvas = document.getElementById('trendChart');
  trendCanvas.width = 320;
  trendCanvas.height = 180;
  ChartRenderer.drawTrendLine(trendCanvas, weeklyData);

  await refreshBudget();
}

async function refreshHistory() {
  const filter = document.getElementById('historyFilter').value;
  let expenses = await StorageManager.getExpenses();

  if (filter === 'today') {
    expenses = (await StorageManager.getTodayExpenses());
  } else if (filter === 'week') {
    expenses = (await StorageManager.getThisWeekExpenses());
  } else if (filter === 'month') {
    expenses = (await StorageManager.getThisMonthExpenses());
  }

  const catMap = {};
  categories.forEach(c => catMap[c.id] = c);

  const list = document.getElementById('expenseList');

  if (expenses.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><p>No expenses found</p></div>';
    return;
  }

  list.innerHTML = expenses.slice(0, 50).map(e => {
    const cat = catMap[e.category] || { name: e.category, icon: '📦', color: '#636E72' };
    const date = new Date(e.date);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `
      <div class="expense-item" data-id="${e.id}">
        <div class="expense-icon" style="background:${cat.color}22">${cat.icon}</div>
        <div class="expense-details">
          <div class="expense-category">${cat.name}</div>
          <div class="expense-desc">${e.description || 'No description'}</div>
        </div>
        <div class="expense-right">
          <div class="expense-amount">-$${parseFloat(e.amount).toFixed(2)}</div>
          <div class="expense-date">${dateStr}</div>
        </div>
        <div class="expense-actions">
          <button onclick="deleteExpense('${e.id}')" title="Delete">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
}

async function deleteExpense(id) {
  if (confirm('Delete this expense?')) {
    await StorageManager.deleteExpense(id);
    showToast('Expense deleted');
    await refreshAll();
    refreshHistory();
  }
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 2500);
}