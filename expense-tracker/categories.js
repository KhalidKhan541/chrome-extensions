const DEFAULT_CATEGORIES = [
  { id: 'food', name: 'Food & Dining', icon: '🍕', color: '#FF6B35' },
  { id: 'transport', name: 'Transportation', icon: '🚗', color: '#4ECDC4' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#FF69B4' },
  { id: 'bills', name: 'Bills & Utilities', icon: '💡', color: '#FFD93D' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#6C5CE7' },
  { id: 'health', name: 'Health', icon: '💊', color: '#00B894' },
  { id: 'education', name: 'Education', icon: '📚', color: '#0984E3' },
  { id: 'travel', name: 'Travel', icon: '✈️', color: '#E17055' },
  { id: 'other', name: 'Other', icon: '📦', color: '#636E72' }
];

function getCategories() {
  return new Promise(resolve => {
    chrome.storage.local.get('categories', data => {
      resolve(data.categories || DEFAULT_CATEGORIES);
    });
  });
}

function saveCategories(categories) {
  return chrome.storage.local.set({ categories });
}

function addCategory(category) {
  return new Promise(async resolve => {
    const categories = await getCategories();
    category.id = category.id || category.name.toLowerCase().replace(/\s+/g, '_');
    categories.push(category);
    await saveCategories(categories);
    resolve(categories);
  });
}

function updateCategory(id, updates) {
  return new Promise(async resolve => {
    const categories = await getCategories();
    const idx = categories.findIndex(c => c.id === id);
    if (idx !== -1) {
      categories[idx] = { ...categories[idx], ...updates };
      await saveCategories(categories);
    }
    resolve(categories);
  });
}

function deleteCategory(id) {
  return new Promise(async resolve => {
    let categories = await getCategories();
    categories = categories.filter(c => c.id !== id);
    await saveCategories(categories);
    resolve(categories);
  });
}

function getCategoryById(id) {
  return new Promise(resolve => {
    getCategories().then(categories => {
      resolve(categories.find(c => c.id === id) || { id: 'other', name: 'Other', icon: '📦', color: '#636E72' });
    });
  });
}