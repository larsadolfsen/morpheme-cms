// The editor's service worker, only for its notifications on the phone or computer (packages/editor/src/notifications.ts):
// while the editor is open but not on screen, it shows them (on Android that works only through a service worker), and
// when the site's Worker sends one (Web Push, packages/editor/worker/push.js: the site is updated after a save, an app's notification),
// the browser wakes it, also when the editor is closed, and it shows that. It does not cache or touch any request.
// Tapping a notification brings the editor to the front, on the screen it is about.
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data?.json() ?? {};
  } catch {}
  event.waitUntil(
    self.registration.showNotification(data.title || 'Editor', {
      body: data.body ?? '',
      icon: '/editor/icon-192.png',
      tag: data.tag || 'site',
      data: { to: data.to },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const to = event.notification.data?.to;
  const url = `/editor/${to ? `#${to}` : ''}`;
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((open) => {
      if (!open.length) return self.clients.openWindow(url);
      // The open editor goes there itself (App.tsx), so a form with changes asks first.
      if (to) open[0].postMessage({ to });
      return open[0].focus();
    }),
  );
});
