// The editor's old service worker (/editor/sw.js): removes itself. The editor registers its own at /edit/sw.js.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(self.registration.unregister());
});
