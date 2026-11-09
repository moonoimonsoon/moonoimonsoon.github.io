// Offline cache for the family guide. VERSION changes on every build, so a new guide replaces the old one.
const VERSION = '10e6a6f025';
const CACHE = 'europe-guide-' + VERSION;
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];
const FONT_CSS = 'https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@500;700;900&family=M+PLUS+Rounded+1c:wght@500;700;800&family=Zen+Kaku+Gothic+New:wght@400;500;700&family=Klee+One:wght@600&family=Noto+Sans+Thai:wght@400;600&family=IBM+Plex+Mono:wght@400;500&display=swap';
self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(CORE);
    await Promise.all(['firebase-app.js','firebase-auth.js','firebase-firestore.js','firebase-ai.js'].map(f => fetch('https://www.gstatic.com/firebasejs/12.19.0/' + f, {mode: 'cors'}).then(r => r.ok && c.put('https://www.gstatic.com/firebasejs/12.19.0/' + f, r)).catch(() => {})));
    try { // fonts: cache the stylesheet and every font file it points to
      const r = await fetch(FONT_CSS, {mode: 'cors'});
      if (r.ok) {
        const css = await r.clone().text();
        await c.put(FONT_CSS, r);
        const urls = [...new Set((css.match(/url\((https:[^)]+)\)/g) || []).map(u => u.slice(4, -1)))];
        await Promise.all(urls.map(u => fetch(u, {mode: 'cors'}).then(x => x.ok && c.put(u, x)).catch(() => {})));
      }
    } catch (err) {}
    self.skipWaiting();
  })());
});
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('europe-guide-') && k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  if (req.mode === 'navigate' || (sameOrigin && url.pathname.endsWith('/index.html'))) {
    // page: try the network first (to get updates), fall back to the saved copy when offline
    e.respondWith((async () => {
      try {
        const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 4000);
        const r = await fetch(req, {signal: ctl.signal}); clearTimeout(t);
        if (r.ok) { const c = await caches.open(CACHE); c.put('./index.html', r.clone()); }
        return r;
      } catch (err) {
        return (await caches.match('./index.html')) || (await caches.match('./')) || Response.error();
      }
    })());
    return;
  }
  if (sameOrigin || url.host === 'fonts.googleapis.com' || url.host === 'fonts.gstatic.com' || (url.host === 'www.gstatic.com' && url.pathname.startsWith('/firebasejs/'))) {
    e.respondWith((async () => {
      const hit = await caches.match(req);
      if (hit) return hit;
      try { const r = await fetch(req); if (r.ok) { const c = await caches.open(CACHE); c.put(req, r.clone()); } return r; }
      catch (err) { return hit || Response.error(); }
    })());
  }
});
