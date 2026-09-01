chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'addBookmark',
    title: 'Add to Bookmarks',
    contexts: ['page', 'link']
  });

  chrome.contextMenus.create({
    id: 'addSelection',
    title: 'Bookmark Selected Text',
    contexts: ['selection']
  });

  updateBadge();
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'addBookmark') {
    const url = info.linkUrl || info.pageUrl;
    const title = tab?.title || url;
    try {
      await chrome.bookmarks.create({ title, url });
      showNotification('Bookmark Added', `"${title}" has been saved.`);
      updateBadge();
    } catch (e) {
      showNotification('Error', e.message);
    }
  }

  if (info.menuItemId === 'addSelection') {
    const url = info.pageUrl;
    const title = info.selectionText || tab?.title || url;
    try {
      await chrome.bookmarks.create({ title, url });
      showNotification('Bookmark Added', `"${title}" has been saved.`);
      updateBadge();
    } catch (e) {
      showNotification('Error', e.message);
    }
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'updateBadge') {
    updateBadge();
    sendResponse({ success: true });
  }

  if (message.type === 'addBookmarkFromPopup') {
    chrome.bookmarks.create(message.data, async (result) => {
      if (chrome.runtime.lastError) {
        sendResponse({ error: chrome.runtime.lastError.message });
      } else {
        if (message.tags && message.tags.length > 0) {
          const stored = await chrome.storage.local.get(['tagData']);
          const tagData = stored.tagData || {};
          tagData[result.id] = message.tags;
          await chrome.storage.local.set({ tagData });
        }
        updateBadge();
        sendResponse({ success: true, bookmark: result });
      }
    });
    return true;
  }
});

async function updateBadge() {
  try {
    const tree = await chrome.bookmarks.getTree();
    let count = 0;
    function countBookmarks(node) {
      if (node.url) count++;
      if (node.children) node.children.forEach(countBookmarks);
    }
    tree.forEach(countBookmarks);
    chrome.action.setBadgeText({ text: count > 999 ? '999+' : String(count) });
    chrome.action.setBadgeBackgroundColor({ color: '#6366f1' });
  } catch (e) {
    chrome.action.setBadgeText({ text: '?' });
  }
}

function showNotification(title, message) {
  chrome.notifications?.create({
    type: 'basic',
    iconUrl: 'icons/icon128.svg',
    title,
    message
  });
}

chrome.bookmarks.onCreated.addListener(updateBadge);
chrome.bookmarks.onRemoved.addListener(updateBadge);
chrome.bookmarks.onChanged.addListener(updateBadge);
chrome.bookmarks.onMoved.addListener(updateBadge);
