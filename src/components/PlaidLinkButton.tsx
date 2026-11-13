"use client";

import { useCallback, useEffect, useState } from "react";
import { usePlaidLink, type PlaidLinkOnSuccess } from "react-plaid-link";
import { Landmark, RefreshCw, Zap } from "lucide-react";

export function PlaidLinkButton({
  plaidConfigured,
  plaidEnv,
  onSynced,
}: {
  plaidConfigured: boolean;
  plaidEnv: string;
  onSynced: () => void;
}) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loadingToken, setLoadingToken] = useState(plaidConfigured);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!plaidConfigured) return;
    fetch("/api/plaid/create-link-token", { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        if (data?.link_token) {
          setLinkToken(data.link_token);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingToken(false));
  }, [plaidConfigured]);

  const onSuccess = useCallback<PlaidLinkOnSuccess>(
    async (publicToken, metadata) => {
      setSyncing(true);
      setMessage("Exchanging token & importing credit card transactions...");
      try {
        const res = await fetch("/api/plaid/exchange-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            public_token: publicToken,
            institution: metadata.institution,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Link failed");
        setMessage(
          `Connected ${data.accountsLinked} card(s) and imported ${data.syncStats?.added ?? 0} transaction(s)!`
        );
        onSynced();
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Failed to link card.");
      } finally {
        setSyncing(false);
      }
    },
    [onSynced]
  );

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
  });

  async function manualSync() {
    setSyncing(true);
    setMessage(null);
    try {
      const res = await fetch("/api/plaid/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed");
      setMessage(
        `Synced: +${data.added} new, ${data.modified} modified, ${data.removed} removed.`
      );
      onSynced();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Sync failed.");
    } finally {
      setSyncing(false);
    }
  }

  async function fireSandboxWebhook() {
    setSyncing(true);
    setMessage(null);
    try {
      const res = await fetch("/api/plaid/sandbox-fire", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Webhook fire failed");
      setMessage(
        "Plaid Sandbox fired SYNC_UPDATES_AVAILABLE webhook! If PLAID_WEBHOOK_URL is public HTTPS, Tallywise will ingest updates automatically."
      );
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to fire sandbox webhook.");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="surface-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div>
          <h3 style={{ fontSize: "1.2rem" }}>Plaid Credit Card Sync</h3>
          <p style={{ fontSize: "0.9rem", color: "var(--ink-secondary)", marginTop: 4 }}>
            Link real credit cards via Plaid Link. Tallywise listens for{" "}
            <code>SYNC_UPDATES_AVAILABLE</code> webhooks and deducts envelopes automatically.
          </p>
        </div>
        <span className={`status-pill ${plaidConfigured ? "status-within" : "status-near"}`}>
          {plaidConfigured ? `Plaid ${plaidEnv}` : "Keys Not Set"}
        </span>
      </div>

      {!plaidConfigured && (
        <div className="banner-warn" style={{ marginTop: 14 }}>
          Add <code>PLAID_CLIENT_ID</code> and <code>PLAID_SECRET</code> to your Vercel environment variables to launch Plaid Link for live or sandbox institutions. Meanwhile, you can use the <strong>Live Card Swipe Simulator</strong> on the Budget page to test real-time alerts.
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!plaidConfigured || !ready || loadingToken || syncing}
          onClick={() => open()}
        >
          <Landmark size={16} />
          {loadingToken ? "Preparing Plaid Link..." : "Connect Credit Card via Plaid"}
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          disabled={!plaidConfigured || syncing}
          onClick={manualSync}
        >
          <RefreshCw size={15} />
          Sync Now
        </button>

        {plaidEnv === "sandbox" && (
          <button
            type="button"
            className="btn btn-secondary"
            disabled={!plaidConfigured || syncing}
            onClick={fireSandboxWebhook}
          >
            <Zap size={15} />
            Fire Sandbox Webhook
          </button>
        )}
      </div>

      {message && (
        <div className="banner-info" style={{ marginTop: 12 }}>
          {message}
        </div>
      )}
    </div>
  );
}
