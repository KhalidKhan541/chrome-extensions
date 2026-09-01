chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'extract-colors',
    title: 'Extract Colors from Image',
    contexts: ['image']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'extract-colors') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'extractColorsFromContext',
      imageUrl: info.srcUrl
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openPopupWithImage') {
    chrome.tabs.sendMessage(sender.tab.id, message);
  }
});
