"use client";

import { useCallback, useEffect, useState } from "react";
import { CreditCard, Sparkles, Webhook } from "lucide-react";
import { PlaidLinkButton } from "@/components/PlaidLinkButton";
import { PushManager } from "@/components/PushManager";
import { formatCents } from "@/lib/format";

interface CardsPayload {
  cards: Array<{
    id: string;
    name: string;
    officialName: string | null;
    mask: string | null;
    currentBalanceCents: number;
    creditLimitCents: number | null;
    aprBps: number;
    isSimulated: boolean;
  }>;
  plaidItems: Array<{
    id: string;
    institutionName: string;
    status: string;
    lastSyncedAt: string | null;
  }>;
  pushSubscriptionCount: number;
  config: {
    plaidConfigured: boolean;
    plaidEnv: string;
    vapidConfigured: boolean;
    vapidPublicKey: string | null;
  };
}

export function CardsClient() {
  const [data, setData] = useState<CardsPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      if (res.ok) {
        setData(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !data) {
    return (
      <div className="container page-shell">
        <div className="surface-card">Loading connected cards and alert settings...</div>
      </div>
    );
  }

  const totalSyncedCents = data.cards.reduce((s, c) => s + c.currentBalanceCents, 0);

  return (
    <div className="container page-shell">
      <div className="page-header">
        <div>
          <h1 className="page-title">Connected Cards &amp; Hoard Drop Alerts</h1>
          <p className="page-subtitle">
            Connect live cards via Plaid Transactions Sync so every swipe drops right into your Purchase Hoard and triggers instant alerts.
          </p>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: 22,
          marginBottom: 24,
        }}
      >
        <PlaidLinkButton
          plaidConfigured={data.config.plaidConfigured}
          plaidEnv={data.config.plaidEnv}
          onSynced={load}
        />

        <PushManager
          vapidPublicKey={data.config.vapidPublicKey}
          initialDeviceCount={data.pushSubscriptionCount}
          onSubscribed={load}
        />
      </div>

      {/* Connected Cards List */}
      <section className="surface-card" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
          <div>
            <h2 style={{ fontSize: "1.3rem" }}>Synced Card Sources</h2>
            <p style={{ fontSize: "0.88rem", color: "var(--ink-secondary)" }}>
              Total tracked card activity feeding your hoard: <strong className="mono-num">{formatCents(totalSyncedCents)}</strong>
            </p>
          </div>
          <span className="status-pill status-within">
            <Sparkles size={14} /> Auto-tagging enabled
          </span>
        </div>

        {data.cards.length === 0 ? (
          <div className="surface-oat">
            No cards linked yet. Connect via Plaid above or trigger a loot drop on the My Hoard page to initialize a demo card.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 14,
            }}
          >
            {data.cards.map((card) => {
              const util =
                card.creditLimitCents && card.creditLimitCents > 0
                  ? Math.round((card.currentBalanceCents / card.creditLimitCents) * 100)
                  : 0;
              return (
                <div key={card.id} className="envelope-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <CreditCard size={17} color="#1B4D3E" />
                      <strong>{card.name}</strong>
                    </div>
                    <span className="status-pill status-within">
                      {card.isSimulated ? "Simulated" : "Plaid Live"}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--ink-muted)", marginTop: 4 }}>
                    {card.mask ? `Ending in ••${card.mask}` : "Card Account"}
                  </div>
                  <div className="mono-num" style={{ fontSize: "1.35rem", fontWeight: 700, marginTop: 10 }}>
                    {formatCents(card.currentBalanceCents)}
                  </div>
                  {card.creditLimitCents && (
                    <>
                      <div className="progress-track">
                        <div
                          className={`progress-fill ${util > 30 ? "fill-amber" : "fill-emerald"}`}
                          style={{ width: `${Math.min(100, Math.max(2, util))}%` }}
                        />
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "var(--ink-secondary)" }}>
                        {util}% of {formatCents(card.creditLimitCents)} card limit
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Vercel Deployment & Webhook Info */}
      <section className="surface-oat">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Webhook size={18} color="#1B4D3E" />
          <h3 style={{ fontSize: "1.12rem" }}>Vercel Production &amp; Plaid Webhook Readiness</h3>
        </div>
        <ul style={{ marginTop: 10, paddingLeft: 20, fontSize: "0.88rem", color: "var(--ink-secondary)", lineHeight: 1.7 }}>
          <li>
            <strong>Plaid Webhook Endpoint:</strong> <code>/api/plaid/webhook</code> (verifies <code>Plaid-Verification</code> ES256 JWT and runs incremental <code>/transactions/sync</code>).
          </li>
          <li>
            <strong>Database:</strong> PostgreSQL via Prisma (<code>DATABASE_URL</code> — compatible with Neon, Vercel Postgres, and Supabase).
          </li>
          <li>
            <strong>Web Push VAPID:</strong>{" "}
            {data.config.vapidConfigured
              ? "Configured and ready for browser & PWA notifications."
              : "Add NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in Vercel."}
          </li>
        </ul>
      </section>
    </div>
  );
}
