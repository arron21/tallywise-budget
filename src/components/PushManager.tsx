"use client";

import { useEffect, useState } from "react";
import { BellRing, CheckCircle2, Send, ShieldAlert } from "lucide-react";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer;
}

export function PushManager({
  vapidPublicKey,
  initialDeviceCount,
  onSubscribed,
}: {
  vapidPublicKey: string | null;
  initialDeviceCount: number;
  onSubscribed?: () => void;
}) {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<string>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [deviceCount, setDeviceCount] = useState(initialDeviceCount);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const canPush =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;

    Promise.resolve().then(() => {
      setSupported(canPush);
      if (canPush) {
        setPermission(Notification.permission);
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => reg.pushManager.getSubscription())
          .then((sub) => {
            if (sub) setIsSubscribed(true);
          })
          .catch(() => {});
      }
    });
  }, []);

  async function enablePush() {
    if (!supported || !vapidPublicKey) return;
    setBusy(true);
    setStatusMsg(null);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") {
        setStatusMsg("Notification permission was not granted in browser settings.");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (!res.ok) {
        throw new Error("Could not register subscription on server.");
      }

      setIsSubscribed(true);
      setDeviceCount((c) => Math.max(1, c + (isSubscribed ? 0 : 1)));
      setStatusMsg("Web Push enabled! This device will receive instant spending alerts.");
      onSubscribed?.();
    } catch (err) {
      setStatusMsg(
        err instanceof Error ? err.message : "Failed to enable Web Push."
      );
    } finally {
      setBusy(false);
    }
  }

  async function sendTestAlert() {
    setBusy(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/push/test", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Test failed");
      if (data.pushSentCount > 0) {
        setStatusMsg(
          `Test push dispatched to ${data.pushSentCount} device(s) and logged to your Hoard Drop Alerts bell.`
        );
      } else {
        setStatusMsg(
          "Alert logged to your in-app Notification Bell. Enable browser push above to receive OS-level banners."
        );
      }
      onSubscribed?.();
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : "Test push failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="surface-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div>
          <h3 style={{ fontSize: "1.2rem" }}>Real-Time Hoard Drop Alerts</h3>
          <p style={{ fontSize: "0.9rem", color: "var(--ink-secondary)", marginTop: 4 }}>
            Get an instant banner on your phone or desktop whenever a synced purchase drops new items into your Hoard.
          </p>
        </div>
        <span className={`status-pill ${isSubscribed ? "status-within" : "status-near"}`}>
          {isSubscribed ? (
            <>
              <CheckCircle2 size={14} /> Active ({deviceCount} device{deviceCount === 1 ? "" : "s"})
            </>
          ) : (
            <>
              <BellRing size={14} /> Not Subscribed
            </>
          )}
        </span>
      </div>

      {!vapidPublicKey && (
        <div className="banner-warn" style={{ marginTop: 14 }}>
          <strong>VAPID keys missing:</strong> Set{" "}
          <code>NEXT_PUBLIC_VAPID_PUBLIC_KEY</code> and <code>VAPID_PRIVATE_KEY</code> in Vercel to enable browser push delivery. In-app alerts still work automatically.
        </div>
      )}

      {!supported && (
        <div className="banner-warn" style={{ marginTop: 14 }}>
          <ShieldAlert size={16} style={{ verticalAlign: "middle", marginRight: 6 }} />
          On iPhone/iPad (iOS 16.4+), tap <strong>Share → Add to Home Screen</strong> and open Tallywise from your Home Screen to enable Web Push notifications.
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!supported || !vapidPublicKey || busy}
          onClick={enablePush}
        >
          <BellRing size={16} />
          {isSubscribed ? "Refresh Push Subscription" : "Enable Push Alerts on This Device"}
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          disabled={busy}
          onClick={sendTestAlert}
        >
          <Send size={15} />
          Send Test Alert
        </button>
      </div>

      <p style={{ fontSize: "0.8rem", color: "var(--ink-muted)", marginTop: 10 }}>
        Browser permission: <strong>{permission}</strong> · Subscribed devices on account:{" "}
        <strong>{deviceCount}</strong>
      </p>

      {statusMsg && (
        <div className="banner-info" style={{ marginTop: 12 }}>
          {statusMsg}
        </div>
      )}
    </div>
  );
}
