self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));

self.addEventListener('push', e => {
  if (!e.data) return;
  let data;
  try { data = e.data.json(); } catch { data = { title: 'IPL Fantasy 2026', body: e.data.text() }; }

  const options = {
    body: data.body || '',
    icon: '/app-icon.png',
    badge: '/app-icon.png',
    tag: data.tag || 'ipl-update',
    renotify: true,
    silent: false,
    data: { url: data.url || '/' },
  };
  // Show large image if provided (supported on Android & iOS 16.4+)
  if (data.image) options.image = data.image;

  e.waitUntil(self.registration.showNotification(data.title || 'IPL Fantasy 2026', options));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if ('focus' in c) return c.focus();
      }
      return clients.openWindow(e.notification.data?.url || '/');
    })
  );
});
