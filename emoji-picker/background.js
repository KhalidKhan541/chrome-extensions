let panelVisible = false;

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus?.create({
    id: 'emoji-picker',
    title: 'Insert Emoji',
    contexts: ['editable']
  });
});

chrome.contextMenus?.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'emoji-picker') {
    chrome.tabs.sendMessage(tab.id, { action: 'togglePanel' });
  }
});

chrome.commands?.onCommand.addListener((command) => {
  if (command === 'toggle-panel') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'togglePanel' });
      }
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'copyToClipboard') {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs[0]) {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: (text) => {
              navigator.clipboard.writeText(text).catch(() => {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
              });
            },
            args: [request.text]
          });
          sendResponse({ success: true });
        } catch (e) {
          sendResponse({ success: false, error: e.message });
        }
      }
    });
    return true;
  }

  if (request.action === 'insertEmoji') {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs[0]) {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: (emoji) => {
              const activeElement = document.activeElement;
              if (!activeElement) return;

              const isInput = activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA';
              const isContentEditable = activeElement.contentEditable === 'true';

              if (isInput) {
                const start = activeElement.selectionStart;
                const end = activeElement.selectionEnd;
                const value = activeElement.value;
                activeElement.value = value.substring(0, start) + emoji + value.substring(end);
                activeElement.selectionStart = activeElement.selectionEnd = start + emoji.length;
                activeElement.dispatchEvent(new Event('input', { bubbles: true }));
              } else if (isContentEditable) {
                const selection = window.getSelection();
                if (selection.rangeCount) {
                  const range = selection.getRangeAt(0);
                  range.deleteContents();
                  const textNode = document.createTextNode(emoji);
                  range.insertNode(textNode);
                  range.setStartAfter(textNode);
                  range.setEndAfter(textNode);
                  selection.removeAllRanges();
                  selection.addRange(range);
                }
              }
            },
            args: [request.emoji]
          });
          sendResponse({ success: true });
        } catch (e) {
          sendResponse({ success: false, error: e.message });
        }
      }
    });
    return true;
  }

  if (request.action === 'emojiCopied') {
    sendResponse({ success: true });
  }
});

chrome.action?.onClicked.addListener((tab) => {
  panelVisible = !panelVisible;
  chrome.tabs.sendMessage(tab.id, { action: 'togglePanel', visible: panelVisible });
});
