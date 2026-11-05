"use client";

import { useCallback, useEffect, useState } from "react";

export type PushState = "unsupported" | "idle" | "subscribing" | "subscribed" | "error";

export type SubscriptionJson = { endpoint: string; keys: { p256dh: string; auth: string }; applicationServerKey: string };

export type RegisterResult = { ok: boolean; error?: string; test?: { ok: true } | { ok: false; error: string } };

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function sameKey(a: ArrayBuffer | null | undefined, b: Uint8Array): boolean {
  if (!a) return false;
  const x = new Uint8Array(a);
  if (x.length !== b.length) return false;
  for (let i = 0; i < x.length; i++) if (x[i] !== b[i]) return false;
  return true;
}

/**
 * Web Push through the service worker: works even when the site is closed.
 * `register` stores the browser subscription on the server (and sends a test
 * notification). Re-subscribes when the VAPID public key changed since the
 * browser last subscribed, because the push service rejects sends signed with
 * a different key.
 */
export function usePushSubscription(publicKey: string | null | undefined, register: (sub: SubscriptionJson) => Promise<RegisterResult>) {
  const [state, setState] = useState<PushState>("idle");
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window && window.isSecureContext;
      setState((s) => (supported ? (s === "unsupported" ? "idle" : s) : "unsupported"));
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const subscribe = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    if (!publicKey) return { ok: false, error: "Push notifications are not configured on the server." };
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return { ok: false, error: "This browser does not support push notifications." };
    setState("subscribing");
    setLastError(null);
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;
      const desired = urlBase64ToUint8Array(publicKey);
      let subscription = await registration.pushManager.getSubscription();
      if (subscription && !sameKey(subscription.options.applicationServerKey, desired)) {
        // Subscribed with another key pair earlier: start over so the server's signature matches.
        await subscription.unsubscribe().catch(() => undefined);
        subscription = null;
      }
      if (!subscription) subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: desired });
      const json = subscription.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) throw new Error("The browser returned an incomplete subscription.");
      const res = await register({ endpoint: json.endpoint, keys: { p256dh: json.keys.p256dh, auth: json.keys.auth }, applicationServerKey: publicKey });
      if (!res.ok) throw new Error(res.error ?? "Could not save the subscription.");
      if (res.test && !res.test.ok) {
        setLastError(res.test.error);
        setState("error");
        return { ok: false, error: res.test.error };
      }
      setState("subscribed");
      return { ok: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[push] subscribe failed", err);
      setLastError(message);
      setState("error");
      return { ok: false, error: message };
    }
  }, [publicKey, register]);

  // Re-sync silently on later visits once the browser already granted permission.
  useEffect(() => {
    if (state !== "idle" || !publicKey) return;
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const id = setTimeout(() => void subscribe(), 500);
    return () => clearTimeout(id);
  }, [state, publicKey, subscribe]);

  return { state, subscribe, lastError, configured: Boolean(publicKey), supported: state !== "unsupported" };
}
