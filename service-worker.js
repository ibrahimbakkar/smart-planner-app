// Service Worker بسيط: يخزن نسخة من التطبيق للعمل حتى بدون إنترنت
const CACHE_NAME = 'smart-planner-cache-v1';
const CORE_ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // لا نتدخل في طلبات الشبكة الخاصة بالمزامنة أو الذكاء الاصطناعي (Firebase / Gemini / OpenAI / Anthropic)
  if (event.request.url.includes('googleapis.com') ||
      event.request.url.includes('openai.com') ||
      event.request.url.includes('anthropic.com') ||
      event.request.url.includes('firestore')) {
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

// لما المستخدم يدوس على إشعار المنبه، نفتح/نركّز على التطبيق
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      const existing = clientsArr.find((c) => c.url.includes(self.registration.scope));
      if (existing) return existing.focus();
      return self.clients.openWindow('./index.html');
    })
  );
});
