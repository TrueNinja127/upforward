"use client";

import { useCallback, useEffect, useState } from "react";

export type NotificationState = NotificationPermission | "unsupported";

/**
 * Desktop notifications for the chat: asks for permission on demand and shows
 * a system notification when something arrives while the tab is hidden.
 */
export function useBrowserNotifications() {
  const [permission, setPermission] = useState<NotificationState>("default");

  useEffect(() => {
    // Read the real permission after mount so server and client render the same markup first.
    const id = requestAnimationFrame(() => {
      setPermission(typeof window === "undefined" || typeof Notification === "undefined" || !window.isSecureContext ? "unsupported" : Notification.permission);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const request = useCallback(async () => {
    if (typeof Notification === "undefined") return "unsupported" as const;
    // Safari (and older browsers) still use the callback form; wrap both.
    const result = await new Promise<NotificationPermission>((resolve) => {
      const maybe = Notification.requestPermission((r) => resolve(r));
      if (maybe && typeof (maybe as Promise<NotificationPermission>).then === "function") (maybe as Promise<NotificationPermission>).then(resolve);
    });
    setPermission(result);
    return result;
  }, []);

  /** Shows a notification when the page is not visible. Returns true if one was shown. */
  const notify = useCallback(
    (title: string, options: { body?: string; tag?: string; onClick?: () => void } = {}) => {
      if (typeof Notification === "undefined" || Notification.permission !== "granted") return false;
      if (document.visibilityState === "visible" && document.hasFocus()) return false;
      try {
        const n = new Notification(title, { body: options.body, tag: options.tag, icon: "/icon.png" });
        n.onclick = () => {
          window.focus();
          options.onClick?.();
          n.close();
        };
        return true;
      } catch {
        return false;
      }
    },
    []
  );

  return { permission, request, notify };
}
