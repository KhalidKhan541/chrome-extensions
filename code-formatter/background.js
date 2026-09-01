chrome.runtime.onInstalled.addListener(() => {
  console.log('Code Formatter installed');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'format') {
    const { code, language, config } = request;
    try {
      const result = formatCode(code, language, config);
      sendResponse({ success: true, result });
    } catch (e) {
      sendResponse({ success: false, error: e.message });
    }
    return true;
  }

  if (request.action === 'getActiveTab') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        sendResponse({ tab: tabs[0] });
      } else {
        sendResponse({ error: 'No active tab' });
      }
    });
    return true;
  }

  if (request.action === 'injectFormatter') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          files: ['formatter-core.js']
        }).then(() => {
          sendResponse({ success: true });
        }).catch((e) => {
          sendResponse({ success: false, error: e.message });
        });
      }
    });
    return true;
  }
});

function formatCode(code, language, config) {
  const indentSize = config?.indentSize || 4;
  const lines = code.split('\n');
  const output = [];
  let indent = 0;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) {
      output.push('');
      continue;
    }

    if (line.startsWith('}') || line.startsWith(')') || line.startsWith(']')) {
      if (indent > 0) indent--;
    }

    output.push(' '.repeat(indentSize * indent) + line);

    if (line.endsWith('{') || line.endsWith('(') || line.endsWith('[')) {
      indent++;
    }
  }

  return output.join('\n');
}
