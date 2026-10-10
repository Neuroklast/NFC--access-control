const CACHE = "nfc-club-access-v2";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(["/", "/admin/login"])),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }
  event.respondWith(
    fetch(event.request).catch(async () => {
      const hit = await caches.match(event.request);
      if (hit) {
        return hit;
      }
      // No cached copy for this URL: report the failure instead of showing the
      // scanner page in its place.
      return Response.error();
    }),
  );
});
