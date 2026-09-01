// user-agent-switcher background script
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.executeScript({
    file: "content.js"
  });
});