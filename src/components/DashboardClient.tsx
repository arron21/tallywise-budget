"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BellRing, CreditCard, Sparkles, Trash2, Zap } from "lucide-react";
import { formatCents } from "@/lib/format";
import { HOARD_CATALOG, type HoardItemType } from "@/lib/hoard-engine";
import { HoardVisual, SmallHoardIconSvg } from "@/components/HoardVisual";

interface TransactionItem {
  id: string;
  merchantName: string;
  amountCents: number;
  date: string;
  pending: boolean;
  paymentChannel: string;
  plaidPrimaryCategory: string | null;
  plaidDetailedCategory: string | null;
  hoardItemType: string | null;
  hoardItemLabel: string | null;
  hoardQuantity: number | null;
  mindfulReflection: string | null;
  coachingNote: string | null;
  budgetStatusAtPurchase: string;
  isSimulated: boolean;
  envelope: { id: string; name: string; colorToken: string } | null;
  creditCardAccount: { id: string; name: string; mask: string | null };
}

interface DashboardPayload {
  user: {
    id: string;
    name: string | null;
    email: string;
    onboardingCompleted: boolean;
    avatarStyle?: string;
    avatarColor?: string;
  };
  monthKey: string;
  transactions: TransactionItem[];
  pushSubscriptionCount: number;
}

export function DashboardClient() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Arcade / Swipe Simulator State
  const [simMerchant, setSimMerchant] = useState("Costco Food Court");
  const [simAmountDollars, setSimAmountDollars] = useState("15.00");
  const [simChannel, setSimChannel] = useState("in store");
  const [simHoardType, setSimHoardType] = useState<string>("");
  const [simHoardQty, setSimHoardQty] = useState<string>("");
  const [simBusy, setSimBusy] = useState(false);
  const [dropBanner, setDropBanner] = useState<{
    title: string;
    body: string;
  } | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load hoard data");
      const json = (await res.json()) as DashboardPayload;
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load hoard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/dashboard", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load hoard data");
        return res.json() as Promise<DashboardPayload>;
      })
      .then((json) => {
        if (active) setData(json);
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Unable to load hoard");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleDropPurchase(
    overrideMerchant?: string,
    overrideDollars?: string,
    overrideChannel?: string,
    overrideHoardType?: string,
    overrideHoardQty?: number
  ) {
    setSimBusy(true);
    try {
      const merchantName = overrideMerchant || simMerchant;
      const amountCents = Math.round(
        parseFloat(overrideDollars || simAmountDollars || "15.00") * 100
      );
      const chosenType = overrideHoardType ?? (simHoardType || null);
      const chosenQty =
        overrideHoardQty ??
        (simHoardQty ? Math.max(1, parseInt(simHoardQty, 10)) : null);

      const res = await fetch("/api/simulate-purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantName,
          amountCents,
          paymentChannel: overrideChannel || simChannel,
          hoardItemType: chosenType || null,
          hoardQuantity: chosenQty,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Drop failed");
      if (json.coaching) {
        setDropBanner({
          title: json.coaching.title,
          body: json.coaching.body,
        });
      }
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Purchase drop failed");
    } finally {
      setSimBusy(false);
    }
  }

  async function handleQuickHoardTag(txId: string, hoardItemType: string) {
    await fetch(`/api/transactions/${txId}/reflection`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hoardItemType }),
    });
    await loadDashboard();
  }

  async function handleRemoveDrop(txId: string) {
    await fetch(`/api/transactions/${txId}/reflection`, {
      method: "DELETE",
    });
    await loadDashboard();
  }

  if (loading) {
    return (
      <div className="container page-shell">
        <div className="surface-card">Loading your Purchase Hoard...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container page-shell">
        <div className="banner-error">{error || "Unable to load hoard."}</div>
      </div>
    );
  }

  return (
    <div className="container page-shell">
      {/* Live Drop Alert Banner */}
      {dropBanner && (
        <div className="banner-info" style={{ marginBottom: 20 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div>
              <strong>{dropBanner.title}</strong>
              <p style={{ marginTop: 2 }}>{dropBanner.body}</p>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setDropBanner(null)}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Visual Purchase Hoard Showcase */}
      <HoardVisual
        userName={data.user.name}
        avatarStyle={data.user.avatarStyle || "explorer"}
        avatarColor={data.user.avatarColor || "#1B4D3E"}
        monthKey={data.monthKey}
        transactions={data.transactions}
        onRefresh={loadDashboard}
      />

      {/* Gameplay Controls: Drop Loot + Recent Pile Receipts */}
      <div className="dashboard-columns">
        {/* Left: Drop Items / Simulate Card Swipe */}
        <section className="surface-card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Zap size={18} color="#1B4D3E" />
                <h2 style={{ fontSize: "1.3rem" }}>Drop Purchases Into Your Hoard</h2>
              </div>
              <p style={{ fontSize: "0.86rem", color: "var(--ink-secondary)", marginTop: 4 }}>
                Tap any preset below to stack new items under your avatar and fire a live push drop alert.
              </p>
            </div>
            <Link href="/cards" className="btn btn-secondary btn-sm">
              <BellRing size={14} />
              {data.pushSubscriptionCount > 0
                ? `Push On (${data.pushSubscriptionCount})`
                : "Card Sync & Push"}
            </Link>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={simBusy}
              onClick={() =>
                handleDropPurchase("Costco Food Court", "15.00", "in store", "costco_hotdog", 10)
              }
            >
              +10 Costco Hot Dogs ($15)
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={simBusy}
              onClick={() =>
                handleDropPurchase("Costco Food Court", "1.50", "in store", "costco_hotdog", 1)
              }
            >
              +1 Hot Dog ($1.50)
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={simBusy}
              onClick={() =>
                handleDropPurchase("Nintendo Store (Switch 2)", "449.99", "online", "switch_2", 1)
              }
            >
              +Switch 2 ($449.99)
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={simBusy}
              onClick={() =>
                handleDropPurchase("Steam Store", "59.99", "online", "steam_game", 1)
              }
            >
              +Steam Game ($59.99)
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={simBusy}
              onClick={() =>
                handleDropPurchase("Blue Bottle Coffee", "6.50", "in store", "coffee", 1)
              }
            >
              +Coffee ($6.50)
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={simBusy}
              onClick={() =>
                handleDropPurchase("Trader Joe's", "55.00", "in store", "groceries", 1)
              }
            >
              +Grocery Tote ($55)
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={simBusy}
              onClick={() =>
                handleDropPurchase("Sweetgreen / Takeout", "22.00", "in store", "takeout", 1)
              }
            >
              +Takeout Box ($22)
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={simBusy}
              onClick={() =>
                handleDropPurchase("Uniqlo / Apparel", "85.00", "online", "clothing", 2)
              }
            >
              +Apparel ($85)
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleDropPurchase();
            }}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              marginTop: 18,
              paddingTop: 16,
              borderTop: "1px solid var(--border-sand)",
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 0.6fr", gap: 10 }}>
              <div className="field-group">
                <label className="field-label">Store or Purchase Name</label>
                <input
                  type="text"
                  className="field-input"
                  value={simMerchant}
                  onChange={(e) => setSimMerchant(e.target.value)}
                  required
                />
              </div>
              <div className="field-group">
                <label className="field-label">Spent ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.5"
                  className="field-input"
                  value={simAmountDollars}
                  onChange={(e) => setSimAmountDollars(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.6fr 0.9fr", gap: 10 }}>
              <div className="field-group">
                <label className="field-label">Visual Pile Item</label>
                <select
                  className="field-select"
                  value={simHoardType}
                  onChange={(e) => setSimHoardType(e.target.value)}
                >
                  <option value="">Auto-match from store</option>
                  {(Object.keys(HOARD_CATALOG) as HoardItemType[]).map((key) => (
                    <option key={key} value={key}>
                      {HOARD_CATALOG[key].label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field-group">
                <label className="field-label">Qty</label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  placeholder="Auto"
                  className="field-input"
                  value={simHoardQty}
                  onChange={(e) => setSimHoardQty(e.target.value)}
                />
              </div>
              <div className="field-group">
                <label className="field-label">Channel</label>
                <select
                  className="field-select"
                  value={simChannel}
                  onChange={(e) => setSimChannel(e.target.value)}
                >
                  <option value="in store">Tap / In-Store</option>
                  <option value="online">Online</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={simBusy}>
              <Sparkles size={16} />
              {simBusy ? "Dropping Into Pile..." : "Drop Into Hoard & Send Push Alert"}
            </button>
          </form>
        </section>

        {/* Right: Recent Hoard Drops Log */}
        <section className="surface-card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
              gap: 10,
            }}
          >
            <div>
              <h2 style={{ fontSize: "1.3rem" }}>Recent Hoard Drops</h2>
              <p style={{ fontSize: "0.86rem", color: "var(--ink-secondary)" }}>
                Re-tag any card swipe to change its visual sprite, or remove test drops.
              </p>
            </div>
            <Link href="/cards" className="btn btn-ghost btn-sm">
              <CreditCard size={15} /> Sync Cards
            </Link>
          </div>

          {data.transactions.length === 0 ? (
            <div className="surface-oat">
              No drops yet! Tap a preset on the left or link your credit card via Plaid to watch items pile up.
            </div>
          ) : (
            <div className="tx-list" style={{ maxHeight: 480, overflowY: "auto", paddingRight: 4 }}>
              {data.transactions.slice(0, 30).map((tx) => {
                const itemType = (
                  tx.hoardItemType && tx.hoardItemType in HOARD_CATALOG
                    ? tx.hoardItemType
                    : "general"
                ) as HoardItemType;

                return (
                  <div key={tx.id} className="tx-row">
                    <div className="tx-header">
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="drop-icon-badge">
                          <SmallHoardIconSvg type={itemType} size={28} />
                        </div>
                        <div>
                          <div className="tx-merchant">
                            {tx.hoardQuantity || 1}×{" "}
                            {tx.hoardItemLabel || HOARD_CATALOG[itemType].label}
                          </div>
                          <div className="tx-meta">
                            {tx.merchantName} ·{" "}
                            {new Date(tx.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="mono-num" style={{ fontWeight: 700, fontSize: "1rem" }}>
                        {formatCents(tx.amountCents)}
                      </div>
                    </div>

                    <div className="tx-controls">
                      <select
                        aria-label={`Hoard item visual for ${tx.merchantName}`}
                        className="field-select"
                        style={{ width: "auto", padding: "4px 10px", fontSize: "0.78rem" }}
                        value={itemType}
                        onChange={(e) => handleQuickHoardTag(tx.id, e.target.value)}
                      >
                        {(Object.keys(HOARD_CATALOG) as HoardItemType[]).map((key) => (
                          <option key={key} value={key}>
                            Visual: {HOARD_CATALOG[key].label}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleRemoveDrop(tx.id)}
                        title="Remove from hoard"
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
