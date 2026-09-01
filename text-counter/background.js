chrome.runtime.onInstalled.addListener(() => {
  console.log('Text Counter extension installed');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzeText') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          files: ['text-analyzer.js']
        }).then(() => {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'getTextContent'
          }, (response) => {
            if (response && response.text) {
              sendResponse({ text: response.text });
            } else {
              sendResponse({ text: '' });
            }
          });
        }).catch((error) => {
          console.error('Script injection failed:', error);
          sendResponse({ text: '', error: error.message });
        });
      }
    });
    
    return true;
  }
  
  if (request.action === 'getSelectedText') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: () => {
            const selection = window.getSelection();
            return selection ? selection.toString() : '';
          }
        }).then((results) => {
          if (results && results[0]) {
            sendResponse({ text: results[0].result });
          } else {
            sendResponse({ text: '' });
          }
        }).catch((error) => {
          console.error('Failed to get selection:', error);
          sendResponse({ text: '', error: error.message });
        });
      }
    });
    
    return true;
  }
});

chrome.action.onClicked.addListener((tab) => {
  if (tab.url && (tab.url.startsWith('http:') || tab.url.startsWith('https:'))) {
    chrome.storage.local.get(['autoCapture'], (result) => {
      if (result.autoCapture) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['text-analyzer.js']
        });
      }
    });
  }
});
