const SHELL_CACHE = "ipl-shell-v7";
const SHELL_ASSETS = ["/", "/index.html", "/manifest.json", "/app-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(SHELL_CACHE).then(c => c.addAll(SHELL_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== SHELL_CACHE).map(k => caches.delete(k)))
    ).then(() => clients.claim()).then(() =>
      clients.matchAll({ type: "window", includeUncontrolled: true }).then(all =>
        all.forEach(c => c.postMessage({ type: "SW_UPDATED" }))
      )
    )
  );
});

self.addEventListener("fetch", e => {
  const { request } = e;
  const url = new URL(request.url);

  // Never cache API calls — always network, fallback to nothing
  if (url.pathname.startsWith("/api/")) return;

  // For navigation (HTML) requests — network first, shell fallback
  if (request.mode === "navigate") {
    e.respondWith(
      fetch(request).catch(() =>
        caches.match("/index.html").then(r => r || caches.match("/"))
      )
    );
    return;
  }

  // For other assets (JS/CSS/images) — cache first, then network + update cache
  e.respondWith(
    caches.match(request).then(cached => {
      if (cached) {
        // Revalidate in background
        fetch(request).then(res => {
          if (res && res.status === 200) {
            caches.open(SHELL_CACHE).then(c => c.put(request, res.clone()));
          }
        }).catch(() => {});
        return cached;
      }
      return fetch(request).then(res => {
        if (res && res.status === 200 && request.method === "GET") {
          caches.open(SHELL_CACHE).then(c => c.put(request, res.clone()));
        }
        return res;
      });
    })
  );
});

self.addEventListener("push", e => {
  if (!e.data) return;
  let data;
  try { data = e.data.json(); } catch { data = { title: "Indian Premier League 2026", body: e.data.text() }; }

  const options = {
    body: data.body || "",
    icon: data.image || "/app-icon.png",
    badge: "/app-icon.png",
    tag: data.tag || "ipl-update",
    renotify: true,
    silent: false,
    data: { url: data.url || "/" },
  };
  if (data.image) options.image = data.image;

  e.waitUntil(self.registration.showNotification(data.title || "Indian Premier League 2026", options));
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if ("focus" in c) return c.focus();
      }
      return clients.openWindow(e.notification.data?.url || "/");
    })
  );
});
