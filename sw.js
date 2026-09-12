// PRINT RUN Service Worker（オフライン起動用）
// 方針: ページ本体（index.html）はネットワーク優先・失敗時はキャッシュ／それ以外はキャッシュ優先。
// 版が上がったら CACHE 名を変える（古いキャッシュは activate で削除）。
const CACHE = 'pr-p3c1-0.1.0';
const FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE && !k.startsWith('pr0-')).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.pathname.includes('/p0/')) return;   // 計測ページは自分の SW（p0/sw.js）に任せる
  const isPage = req.mode === 'navigate' || req.destination === 'document';
  if (isPage) {
    e.respondWith(fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put('./index.html', copy)); return res; })
      .catch(() => caches.match('./index.html')));
  } else {
    e.respondWith(caches.match(req, { ignoreSearch: true }).then((r) => r || fetch(req)));
  }
});
