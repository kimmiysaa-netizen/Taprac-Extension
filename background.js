// background.js - MV3 service worker (Chromium) and also used for Firefox manifest v2 background
self.addEventListener('install', (e) => {
  // noop
});
self.addEventListener('activate', (e) => {
  // noop
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.type === 'open_tab') {
    chrome.tabs.create({ url: message.url }, () => sendResponse({ ok: true }));
    return true;
  }
  sendResponse({ ok: false, error: 'unknown_message' });
  return false;
});
