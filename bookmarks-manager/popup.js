const bm = new BookmarkManager();
const tm = new TagManager();
const se = new SearchEngine();

let currentBookmarks = [];
let filteredBookmarks = [];
let selectedIds = new Set();
let bulkMode = false;
let currentFolderId = null;
let currentTagFilter = null;
let contextBookmarkId = null;
let tempTags = [];

document.addEventListener('DOMContentLoaded', async () => {
  await bm.init();
  await tm.init();
  await se.init();

  await loadBookmarks();
  bindEvents();
});

async function loadBookmarks() {
  currentBookmarks = await bm.getAllBookmarks();
  filteredBookmarks = [...currentBookmarks];
  updateCounts();
  renderFolders();
  renderTags();
  renderBookmarks();
}

function updateCounts() {
  document.getElementById('totalCount').textContent = currentBookmarks.length;
  chrome.runtime.sendMessage({ type: 'updateBadge' });
}

function bindEvents() {
  document.getElementById('toggleSidebar').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('collapsed');
  });

  document.getElementById('searchInput').addEventListener('input', debounce(handleSearch, 200));
  document.getElementById('searchClear').addEventListener('click', () => {
    document.getElementById('searchInput').value = '';
    handleSearch();
  });

  document.getElementById('btnAddBookmark').addEventListener('click', () => openBookmarkModal());
  document.getElementById('btnAllBookmarks').addEventListener('click', () => {
    currentFolderId = null;
    currentTagFilter = null;
    filteredBookmarks = [...currentBookmarks];
    applyFilters();
    updateSidebarActive();
  });

  document.getElementById('btnRecentlyAdded').addEventListener('click', () => {
    currentFolderId = null;
    currentTagFilter = null;
    filteredBookmarks = [...currentBookmarks].sort((a, b) => b.dateAdded - a.dateAdded).slice(0, 50);
    applyFilters();
    updateSidebarActive();
  });

  document.getElementById('btnBulkSelect').addEventListener('click', toggleBulkMode);
  document.getElementById('btnBulkCancel').addEventListener('click', cancelBulkMode);
  document.getElementById('btnBulkDelete').addEventListener('click', bulkDelete);
  document.getElementById('btnBulkMove').addEventListener('click', bulkMove);
  document.getElementById('btnBulkTag').addEventListener('click', bulkTag);
  document.getElementById('btnNewFolder').addEventListener('click', openFolderModal);

  document.getElementById('sortSelect').addEventListener('change', handleSort);
  document.getElementById('btnRefresh').addEventListener('click', () => loadBookmarks());

  document.getElementById('btnImport').addEventListener('click', handleImport);
  document.getElementById('btnExport').addEventListener('click', handleExport);

  // Bookmark modal
  document.getElementById('closeModal').addEventListener('click', closeModal);
  document.getElementById('cancelModal').addEventListener('click', closeModal);
  document.getElementById('saveBookmark').addEventListener('click', saveBookmark);
  document.getElementById('bmTags').addEventListener('keydown', handleTagInput);
  document.getElementById('bmTags').addEventListener('input', handleTagSuggestions);

  // Folder modal
  document.getElementById('closeFolderModal').addEventListener('click', closeFolderModal);
  document.getElementById('cancelFolderModal').addEventListener('click', closeFolderModal);
  document.getElementById('saveFolder').addEventListener('click', saveFolder);

  // Tag modal
  document.getElementById('closeTagModal').addEventListener('click', closeTagModal);
  document.getElementById('cancelTagModal').addEventListener('click', closeTagModal);
  document.getElementById('saveTags').addEventListener('click', saveTagEdit);
  document.getElementById('editTagInput').addEventListener('keydown', handleEditTagInput);
  document.getElementById('editTagInput').addEventListener('input', handleEditTagSuggestions);

  // Context menu
  document.addEventListener('click', () => hideContextMenu());
  document.getElementById('contextMenu').addEventListener('click', handleContextMenuAction);

  document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeAllModals();
  });
}

function applyFilters() {
  let results = [...filteredBookmarks];

  if (currentFolderId) {
    results = results.filter(b => b.parentId === currentFolderId);
  }

  if (currentTagFilter) {
    results = results.filter(b => (b.tags || []).includes(currentTagFilter));
  }

  const query = document.getElementById('searchInput').value.trim();
  if (query) {
    results = se.search(results, query);
  }

  const sortVal = document.getElementById('sortSelect').value;
  const [sortBy, sortDir] = sortVal.split('-');
  results.sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'name') cmp = (a.title || '').localeCompare(b.title || '');
    else if (sortBy === 'date') cmp = (b.dateAdded || 0) - (a.dateAdded || 0);
    return sortDir === 'desc' ? -cmp : cmp;
  });

  filteredBookmarks = results;
  renderBookmarks();
}

function handleSearch() {
  applyFilters();
}

function handleSort() {
  applyFilters();
}

function renderBookmarks() {
  const list = document.getElementById('bookmarkList');
  const empty = document.getElementById('emptyState');

  if (filteredBookmarks.length === 0) {
    list.innerHTML = '';
    list.appendChild(empty);
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');
  list.innerHTML = filteredBookmarks.map(bm => createBookmarkHTML(bm)).join('');

  list.querySelectorAll('.bookmark-item').forEach(el => {
    el.addEventListener('click', (e) => {
      if (bulkMode) {
        toggleSelect(el.dataset.id);
      } else {
        chrome.tabs.create({ url: bm.url });
      }
    });

    el.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      showContextMenu(e, el.dataset.id);
    });
  });
}

function createBookmarkHTML(bm) {
  const isSel = selectedIds.has(bm.id);
  const date = bm.dateAdded ? new Date(bm.dateAdded).toLocaleDateString() : '';
  const tagsHTML = (bm.tags || []).slice(0, 3).map(t => {
    const color = tm.getTagColor(t);
    return `<span class="bookmark-tag" style="background:${color}">${escHtml(t)}</span>`;
  }).join('');

  const domain = (() => {
    try { return new URL(bm.url).hostname; } catch { return ''; }
  })();
  const initial = domain ? domain[0].toUpperCase() : '?';

  return `
    <div class="bookmark-item ${isSel ? 'selected' : ''}" data-id="${bm.id}">
      <div class="checkbox"></div>
      <img class="bookmark-favicon" src="${escAttr(bm.favicon)}" onerror="this.outerHTML='<div class=\\'bookmark-favicon-error\\'>${escHtml(initial)}</div>'">
      <div class="bookmark-info">
        <div class="bookmark-title">${escHtml(bm.title || bm.url)}</div>
        <div class="bookmark-url">${escHtml(bm.url)}</div>
      </div>
      <div class="bookmark-tags">${tagsHTML}</div>
      <span class="bookmark-date">${date}</span>
    </div>`;
}

function renderFolders() {
  const tree = document.getElementById('folderTree');
  const folders = bm.getFolderTree();

  tree.innerHTML = folders.map(f => {
    const indent = f.depth * 12;
    const active = currentFolderId === f.id ? 'active' : '';
    return `
      <div class="folder-item ${active}" data-id="${f.id}" style="padding-left:${16 + indent}px">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
        </svg>
        <span>${escHtml(f.title)}</span>
      </div>`;
  }).join('');

  tree.querySelectorAll('.folder-item').forEach(el => {
    el.addEventListener('click', () => {
      currentFolderId = el.dataset.id;
      currentTagFilter = null;
      applyFilters();
      updateSidebarActive();
    });
  });
}

function renderTags() {
  const tagList = document.getElementById('tagList');
  const tags = bm.getAllTags();

  tagList.innerHTML = Object.entries(tags).map(([tag, count]) => {
    const color = tm.getTagColor(tag);
    const active = currentTagFilter === tag ? 'active' : '';
    return `
      <span class="tag-pill ${active}" data-tag="${escAttr(tag)}" style="background:${color}20;color:${color}">
        ${escHtml(tag)} <span class="tag-count">${count}</span>
      </span>`;
  }).join('');

  tagList.querySelectorAll('.tag-pill').forEach(el => {
    el.addEventListener('click', () => {
      const tag = el.dataset.tag;
      currentTagFilter = currentTagFilter === tag ? null : tag;
      currentFolderId = null;
      applyFilters();
      updateSidebarActive();
    });
  });
}

function updateSidebarActive() {
  document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.folder-item').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tag-pill').forEach(b => b.classList.remove('active'));

  if (!currentFolderId && !currentTagFilter) {
    document.getElementById('btnAllBookmarks').classList.add('active');
  } else if (currentFolderId) {
    const el = document.querySelector(`.folder-item[data-id="${currentFolderId}"]`);
    if (el) el.classList.add('active');
  } else if (currentTagFilter) {
    const el = document.querySelector(`.tag-pill[data-tag="${currentTagFilter}"]`);
    if (el) el.classList.add('active');
  }
}

// Modals
function openBookmarkModal(bookmark = null) {
  const modal = document.getElementById('bookmarkModal');
  const overlay = document.getElementById('modalOverlay');
  const title = document.getElementById('modalTitle');

  tempTags = [];
  title.textContent = bookmark ? 'Edit Bookmark' : 'Add Bookmark';
  document.getElementById('editBookmarkId').value = bookmark ? bookmark.id : '';
  document.getElementById('bmName').value = bookmark ? bookmark.title : '';
  document.getElementById('bmUrl').value = bookmark ? bookmark.url : '';

  populateFolderSelect('bmFolder', bookmark ? bookmark.parentId : null);

  if (bookmark && bookmark.tags) {
    tempTags = [...bookmark.tags];
  }
  renderTagChips();

  if (!bookmark) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        document.getElementById('bmName').value = tabs[0].title || '';
        document.getElementById('bmUrl').value = tabs[0].url || '';
      }
    });
  }

  modal.classList.remove('hidden');
  overlay.classList.remove('hidden');
}

function closeModal() {
  document.getElementById('bookmarkModal').classList.add('hidden');
  document.getElementById('modalOverlay').classList.add('hidden');
}

async function saveBookmark() {
  const id = document.getElementById('editBookmarkId').value;
  const title = document.getElementById('bmName').value.trim();
  const url = document.getElementById('bmUrl').value.trim();
  const parentId = document.getElementById('bmFolder').value;

  if (!url) return;

  if (!/^https?:\/\//i.test(url)) {
    document.getElementById('bmUrl').value = 'https://' + url;
  }

  if (id) {
    await bm.updateBookmark(id, { title, url });
    if (parentId) await bm.moveBookmark(id, parentId);
    await bm.setTags(id, tempTags);
  } else {
    await bm.addBookmark(title, url, parentId, tempTags);
  }

  closeModal();
  await loadBookmarks();
}

function renderTagChips() {
  const container = document.getElementById('tagChips');
  container.innerHTML = tempTags.map(tag => {
    const color = tm.getTagColor(tag);
    return `
      <span class="tag-chip" style="background:${color}">
        ${escHtml(tag)}
        <button class="remove-tag" data-tag="${escAttr(tag)}">&times;</button>
      </span>`;
  }).join('');

  container.querySelectorAll('.remove-tag').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      tempTags = tempTags.filter(t => t !== btn.dataset.tag);
      renderTagChips();
    });
  });
}

function handleTagInput(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    const val = e.target.value.trim().toLowerCase();
    if (val && !tempTags.includes(val)) {
      tempTags.push(val);
      renderTagChips();
    }
    e.target.value = '';
    document.getElementById('tagSuggestions').classList.add('hidden');
  }
}

function handleTagSuggestions(e) {
  const val = e.target.value.trim();
  const container = document.getElementById('tagSuggestions');
  if (!val) { container.classList.add('hidden'); return; }

  const allTags = bm.getAllTags();
  const suggestions = tm.suggestTags(val, Object.keys(allTags));
  if (suggestions.length === 0) { container.classList.add('hidden'); return; }

  container.innerHTML = suggestions.map(s => `<span class="tag-suggestion" data-tag="${escAttr(s)}">${escHtml(s)}</span>`).join('');
  container.classList.remove('hidden');

  container.querySelectorAll('.tag-suggestion').forEach(el => {
    el.addEventListener('click', () => {
      if (!tempTags.includes(el.dataset.tag)) {
        tempTags.push(el.dataset.tag);
        renderTagChips();
      }
      e.target.value = '';
      container.classList.add('hidden');
    });
  });
}

function populateFolderSelect(selectId, selectedId) {
  const select = document.getElementById(selectId);
  const folders = bm.getFolderTree();

  select.innerHTML = '<option value="">Root</option>' +
    folders.map(f => `<option value="${f.id}" ${f.id === selectedId ? 'selected' : ''}>${'  '.repeat(f.depth)}${escHtml(f.title)}</option>`).join('');
}

function openFolderModal() {
  document.getElementById('folderModal').classList.remove('hidden');
  document.getElementById('modalOverlay').classList.remove('hidden');
  populateFolderSelect('folderParent', null);
}

function closeFolderModal() {
  document.getElementById('folderModal').classList.add('hidden');
  document.getElementById('modalOverlay').classList.add('hidden');
}

async function saveFolder() {
  const name = document.getElementById('folderName').value.trim();
  const parentId = document.getElementById('folderParent').value || (await chrome.bookmarks.getTree())[0].children[0].id;

  if (!name) return;

  await bm.createFolder(name, parentId);
  closeFolderModal();
  await loadBookmarks();
}

function showContextMenu(e, bookmarkId) {
  contextBookmarkId = bookmarkId;
  const menu = document.getElementById('contextMenu');
  menu.classList.remove('hidden');
  menu.style.left = e.clientX + 'px';
  menu.style.top = e.clientY + 'px';

  const rect = menu.getBoundingClientRect();
  if (rect.right > window.innerWidth) menu.style.left = (e.clientX - rect.width) + 'px';
  if (rect.bottom > window.innerHeight) menu.style.top = (e.clientY - rect.height) + 'px';
}

function hideContextMenu() {
  document.getElementById('contextMenu').classList.add('hidden');
}

function handleContextMenuAction(e) {
  const action = e.target.closest('[data-action]')?.dataset.action;
  if (!action || !contextBookmarkId) return;

  const bookmark = currentBookmarks.find(b => b.id === contextBookmarkId);

  switch (action) {
    case 'edit':
      openBookmarkModal(bookmark);
      break;
    case 'open':
      chrome.tabs.create({ url: bookmark.url });
      break;
    case 'tags':
      openTagModal(contextBookmarkId, bookmark.tags);
      break;
    case 'duplicate':
      bm.addBookmark(bookmark.title + ' (copy)', bookmark.url, bookmark.parentId, bookmark.tags || []);
      loadBookmarks();
      break;
    case 'delete':
      bm.removeBookmark(contextBookmarkId);
      loadBookmarks();
      break;
  }
}

function openTagModal(bookmarkId, tags) {
  document.getElementById('tagEditId').value = bookmarkId;
  tempTags = [...(tags || [])];
  renderEditTagChips();

  document.getElementById('tagModal').classList.remove('hidden');
  document.getElementById('modalOverlay').classList.remove('hidden');
}

function closeTagModal() {
  document.getElementById('tagModal').classList.add('hidden');
  document.getElementById('modalOverlay').classList.add('hidden');
}

async function saveTagEdit() {
  const id = document.getElementById('tagEditId').value;
  await bm.setTags(id, tempTags);
  closeTagModal();
  await loadBookmarks();
}

function renderEditTagChips() {
  const container = document.getElementById('editTagChips');
  container.innerHTML = tempTags.map(tag => {
    const color = tm.getTagColor(tag);
    return `
      <span class="tag-chip" style="background:${color}">
        ${escHtml(tag)}
        <button class="remove-tag" data-tag="${escAttr(tag)}">&times;</button>
      </span>`;
  }).join('');

  container.querySelectorAll('.remove-tag').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      tempTags = tempTags.filter(t => t !== btn.dataset.tag);
      renderEditTagChips();
    });
  });
}

function handleEditTagInput(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    const val = e.target.value.trim().toLowerCase();
    if (val && !tempTags.includes(val)) {
      tempTags.push(val);
      renderEditTagChips();
    }
    e.target.value = '';
    document.getElementById('editTagSuggestions').classList.add('hidden');
  }
}

function handleEditTagSuggestions(e) {
  const val = e.target.value.trim();
  const container = document.getElementById('editTagSuggestions');
  if (!val) { container.classList.add('hidden'); return; }

  const allTags = bm.getAllTags();
  const suggestions = tm.suggestTags(val, Object.keys(allTags));
  if (suggestions.length === 0) { container.classList.add('hidden'); return; }

  container.innerHTML = suggestions.map(s => `<span class="tag-suggestion" data-tag="${escAttr(s)}">${escHtml(s)}</span>`).join('');
  container.classList.remove('hidden');

  container.querySelectorAll('.tag-suggestion').forEach(el => {
    el.addEventListener('click', () => {
      if (!tempTags.includes(el.dataset.tag)) {
        tempTags.push(el.dataset.tag);
        renderEditTagChips();
      }
      e.target.value = '';
      container.classList.add('hidden');
    });
  });
}

// Bulk operations
function toggleBulkMode() {
  bulkMode = true;
  selectedIds.clear();
  document.getElementById('bulkBar').classList.remove('hidden');
  document.getElementById('btnBulkSelect').classList.add('active');
  renderBookmarks();
  populateBulkFolderSelect();
}

function cancelBulkMode() {
  bulkMode = false;
  selectedIds.clear();
  document.getElementById('bulkBar').classList.add('hidden');
  document.getElementById('btnBulkSelect').classList.remove('active');
  renderBookmarks();
}

function toggleSelect(id) {
  if (selectedIds.has(id)) selectedIds.delete(id);
  else selectedIds.add(id);
  document.getElementById('bulkCount').textContent = selectedIds.size + ' selected';
  renderBookmarks();
}

function populateBulkFolderSelect() {
  const select = document.getElementById('bulkFolderSelect');
  const folders = bm.getFolderTree();
  select.innerHTML = '<option value="">Move to folder...</option>' +
    folders.map(f => `<option value="${f.id}">${'  '.repeat(f.depth)}${escHtml(f.title)}</option>`).join('');
}

async function bulkDelete() {
  if (selectedIds.size === 0) return;
  if (!confirm(`Delete ${selectedIds.size} bookmark(s)?`)) return;
  await bm.bulkDelete([...selectedIds]);
  cancelBulkMode();
  await loadBookmarks();
}

async function bulkMove() {
  const folderId = document.getElementById('bulkFolderSelect').value;
  if (!folderId || selectedIds.size === 0) return;
  await bm.bulkMove([...selectedIds], folderId);
  cancelBulkMode();
  await loadBookmarks();
}

async function bulkTag() {
  const tag = prompt('Enter tag name:');
  if (!tag) return;
  await bm.bulkTag([...selectedIds], tag.trim().toLowerCase());
  cancelBulkMode();
  await loadBookmarks();
}

// Import/Export
async function handleImport() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    try {
      const result = await bm.importBookmarks(text);
      alert(`Imported: ${result.imported}, Skipped (duplicates): ${result.skipped}`);
      await loadBookmarks();
    } catch (err) {
      alert('Import failed: ' + err.message);
    }
  };
  input.click();
}

async function handleExport() {
  const data = await bm.exportBookmarks();
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bookmarks-export-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function closeAllModals() {
  closeModal();
  closeFolderModal();
  closeTagModal();
}

// Helpers
function escHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escAttr(str) {
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
