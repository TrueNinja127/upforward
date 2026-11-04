/* Service worker for upforward.org: Web Push notifications for the applicant chat. */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    (async () => {
      if (data.skipIfFocused) {
        const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
        if (windows.some((c) => c.focused && c.visibilityState === "visible")) return;
      }
      await self.registration.showNotification(data.title || "Upforward", {
        body: data.body || "",
        icon: "/icon.png",
        badge: "/icon.png",
        tag: data.tag || undefined,
        renotify: Boolean(data.tag),
        data: { url: data.url || "/chat" },
      });
    })()
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/chat";
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of windows) {
        try {
          await client.focus();
          if ("navigate" in client && new URL(client.url).pathname !== new URL(url, self.location.origin).pathname) await client.navigate(url);
          return;
        } catch {
          // fall through to opening a new window
        }
      }
      await self.clients.openWindow(url);
    })()
  );
});
