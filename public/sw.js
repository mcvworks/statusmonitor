/// <reference lib="webworker" />

// DTMonitor Service Worker — Push Notifications

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "DTMonitor", body: event.data.text() };
  }

  const options = {
    body: data.body ?? "",
    icon: data.icon ?? "/icon-192.png",
    badge: data.badge ?? "/icon-badge.png",
    data: data.data ?? {},
    vibrate: [100, 50, 100],
    tag: data.data?.alertId ?? "dtmonitor",
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(data.title ?? "DTMonitor", options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url ?? "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        // Focus an existing window if one is open
        for (const client of clients) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        // Otherwise open a new window
        return self.clients.openWindow(url);
      }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
