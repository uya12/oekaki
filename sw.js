'use strict';
/* =====================================================
   Service Worker（PWA）：一度開けば、オフラインでも遊べるようにする
   - インストール時に index.html を読み、そこに書かれている CSS・JS・アイコンを全部保存する
     （ファイルを足しても、この一覧を手で直す必要はない）
   - このサイトのファイルはネットを先に使い、つながらないときだけ保存したものを使う（版が混ざらない）
   - CACHE の名前は公開するたびに変わり、古い版の保存は消える
   ===================================================== */
const CACHE = 'rr-dev'; // 公開するときに、版ごとの名前（rr-コミット）に書きかわる（.github/workflows/pages.yml）
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const html = await (await fetch('./index.html', { cache: 'no-cache' })).text();
    const local = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m => m[1]).filter(u => !/^[a-z]+:|^\/\/|^#/i.test(u));
    try { // manifest に書いてあるアイコンも保存する
      const man = await (await fetch('./manifest.webmanifest', { cache: 'no-cache' })).json();
      for (const ic of man.icons || []) local.push(ic.src);
    } catch (_e) {}
    await cache.addAll([...new Set(['./', './index.html', ...local])].map(u => new Request(u, { cache: 'no-cache' })));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const same = url.origin === self.location.origin;
  if (!same && !FONT_HOSTS.includes(url.hostname)) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const key = req.mode === 'navigate' ? './index.html' : req;
    const cached = await cache.match(key, { ignoreSearch: same });
    const fresh = fetch(req, same ? { cache: 'no-cache' } : undefined).then(res => {
      if (res && (res.ok || res.type === 'opaque')) cache.put(key, res.clone());
      return res;
    });
    // このサイトのファイル（HTML・JS・CSS・画像）はネットを先に使う：新しい index.html と古い JS が混ざらないように。
    // つながらないとき（オフライン）だけ、保存してあるものを使う
    if (same) return fresh.catch(() => cached || Response.error());
    // フォントは変わらないので、保存してあるものを先に使う
    if (cached) { e.waitUntil(fresh.catch(() => {})); return cached; }
    return fresh.catch(() => Response.error());
  })());
});
