// Trabajador de MiCine: recibe notificaciones y deja la app abrir sin conexión.
const CACHE = 'micine-v1';
const SHELL = ['./', './index.html', './offline.html', './icon-192.png', './manifest.webmanifest'];

self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {})); });
self.addEventListener('activate', e => { e.waitUntil((async () => { for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k); await self.clients.claim(); })()); });

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const url = new URL(r.url);
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r).then(res => { const c = res.clone(); caches.open(CACHE).then(x => x.put('./index.html', c)); return res; })
      .catch(async () => (await caches.match('./index.html')) || caches.match('./offline.html')));
    return;
  }
  if (url.origin === location.origin) {
    e.respondWith(fetch(r).then(res => { if (res.ok) { const c = res.clone(); caches.open(CACHE).then(x => x.put(r, c)); } return res; }).catch(() => caches.match(r)));
  }
});

self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || 'MiCine', {
    body: d.body || '', icon: 'icon-192.png', badge: 'icon-192.png', image: d.image, tag: d.tag, data: { url: d.url || './' },
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL(e.notification.data && e.notification.data.url || './', self.registration.scope).href;
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const w of wins) if (w.url.startsWith(self.registration.scope)) { await w.focus(); return w.navigate(url); }
    return self.clients.openWindow(url);
  })());
});
