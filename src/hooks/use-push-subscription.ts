"use client";

import { useCallback, useEffect, useState } from "react";

export type PushState = "unsupported" | "idle" | "subscribing" | "subscribed" | "error";

export type SubscriptionJson = { endpoint: string; keys: { p256dh: string; auth: string } };

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/**
 * Web Push through the service worker: works even when the site is closed.
 * `register` stores the browser subscription on the server. Subscribing is
 * idempotent, so it is safe to call on every visit once permission exists.
 */
export function usePushSubscription(publicKey: string | null | undefined, register: (sub: SubscriptionJson) => Promise<{ ok: boolean; error?: string }>) {
  const [state, setState] = useState<PushState>("idle");

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const supported = Boolean(publicKey) && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window && window.isSecureContext;
      if (!supported) setState("unsupported");
    });
    return () => cancelAnimationFrame(id);
  }, [publicKey]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!publicKey || !("serviceWorker" in navigator) || !("PushManager" in window)) return false;
    setState("subscribing");
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) });
      }
      const json = subscription.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) throw new Error("Browser returned an incomplete subscription");
      const res = await register({ endpoint: json.endpoint, keys: { p256dh: json.keys.p256dh, auth: json.keys.auth } });
      if (!res.ok) throw new Error(res.error ?? "Could not save the subscription");
      setState("subscribed");
      return true;
    } catch (err) {
      console.error("[push] subscribe failed", err);
      setState("error");
      return false;
    }
  }, [publicKey, register]);

  // Re-sync silently on later visits once the browser already granted permission.
  useEffect(() => {
    if (state !== "idle") return;
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const id = setTimeout(() => void subscribe(), 500);
    return () => clearTimeout(id);
  }, [state, subscribe]);

  return { state, subscribe, supported: state !== "unsupported" };
}
