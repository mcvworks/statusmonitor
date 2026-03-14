"use client";

import { useState, useEffect, useCallback } from "react";

interface PushNotificationsState {
  isSupported: boolean;
  permission: NotificationPermission | "unsupported";
  isSubscribed: boolean;
  isLoading: boolean;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
}

export function usePushNotifications(): PushNotificationsState {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Check support and current state on mount
  useEffect(() => {
    const supported = "serviceWorker" in navigator && "Notification" in window && "PushManager" in window;
    setIsSupported(supported);

    if (!supported) {
      setPermission("unsupported");
      setIsLoading(false);
      return;
    }

    setPermission(Notification.permission);

    // Register service worker and check existing subscription
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        setRegistration(reg);
        return reg.pushManager.getSubscription();
      })
      .then((sub) => {
        setIsSubscribed(!!sub);
      })
      .catch(() => {
        // SW registration failed — likely not HTTPS
      })
      .finally(() => setIsLoading(false));
  }, []);

  const subscribe = useCallback(async () => {
    if (!isSupported) throw new Error("Push notifications not supported");

    setIsLoading(true);
    try {
      // Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        throw new Error("Notification permission denied");
      }

      // Get VAPID public key
      const vapidRes = await fetch("/api/push/vapid");
      if (!vapidRes.ok) throw new Error("Push notifications not configured on server");
      const { publicKey } = await vapidRes.json();

      // Register/get service worker
      let reg = registration;
      if (!reg) {
        reg = await navigator.serviceWorker.register("/sw.js");
        setRegistration(reg);
      }

      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;

      // Subscribe to push
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });

      // Send subscription to server
      const subJSON = sub.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subJSON.endpoint,
          keys: {
            p256dh: subJSON.keys?.p256dh ?? "",
            auth: subJSON.keys?.auth ?? "",
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to save subscription");
      }

      setIsSubscribed(true);
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, registration]);

  const unsubscribe = useCallback(async () => {
    if (!registration) return;

    setIsLoading(true);
    try {
      const sub = await registration.pushManager.getSubscription();
      if (sub) {
        // Remove from server
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });

        // Unsubscribe locally
        await sub.unsubscribe();
      }

      setIsSubscribed(false);
    } finally {
      setIsLoading(false);
    }
  }, [registration]);

  return { isSupported, permission, isSubscribed, isLoading, subscribe, unsubscribe };
}

// ─── Helpers ──────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    arr[i] = raw.charCodeAt(i);
  }
  return arr;
}
