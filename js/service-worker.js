const CACHE_NAME = 'jkp-v2';
const OFFLINE_URLS = ['./', './index.html', './login.html', './css/style.css', './css/dashboard.css', './js/firebase.js', 'https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700&family=Inter:wght@400;500;600;700&display=swap', 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css', 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js', 'https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js', 'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js', 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(OFFLINE_URLS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetchPromise = fetch(e.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

self.addEventListener('push', (e) => {
  const data = e.data ? e.data.json() : { title: 'JKP Notification', body: 'You have a new notification' };
  e.waitUntil(self.registration.showNotification(data.title, { body: data.body, icon: 'assets/icons/icon-192.png', badge: 'assets/icons/icon-192.png', vibrate: [200, 100, 200] }));
});
