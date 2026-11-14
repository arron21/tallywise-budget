"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeftRight,
  BellRing,
  CheckCircle2,
  CreditCard,
  PiggyBank,
  Plus,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  calcTenYearOpportunityCents,
  calcWorkHours,
  formatCents,
  getMonthLabel,
} from "@/lib/format";
import { HOARD_CATALOG, type HoardItemType } from "@/lib/hoard-engine";
import { HoardVisual } from "@/components/HoardVisual";

interface Envelope {
  id: string;
  name: string;
  categoryKey: string;
  allocatedCents: number;
  spentCents: number;
  isEssential: boolean;
  colorToken: string;
}

interface SavingsGoal {
  id: string;
  name: string;
  targetCents: number;
  currentCents: number;
  monthlyTargetCents: number;
  apyBps: number;
}

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
    monthlyIncomeCents: number;
    hourlyNetPayCents: number;
    onboardingCompleted: boolean;
    avatarStyle?: string;
    avatarColor?: string;
  };
  monthKey: string;
  budgetMonth: {
    incomeCents: number;
    cardReserveCents: number;
  };
  envelopes: Envelope[];
  savingsGoals: SavingsGoal[];
  cards: Array<{
    id: string;
    name: string;
    mask: string | null;
    currentBalanceCents: number;
    creditLimitCents: number | null;
    aprBps: number;
    isSimulated: boolean;
  }>;
  transactions: TransactionItem[];
  pushSubscriptionCount: number;
  config: {
    plaidConfigured: boolean;
    plaidEnv: string;
    vapidConfigured: boolean;
    vapidPublicKey: string | null;
  };
}

export function DashboardClient() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Live swipe simulator state
  const [simMerchant, setSimMerchant] = useState("Blue Bottle Coffee");
  const [simAmountDollars, setSimAmountDollars] = useState("14.50");
  const [simChannel, setSimChannel] = useState("in store");
  const [simEnvelopeId, setSimEnvelopeId] = useState("");
  const [simHoardType, setSimHoardType] = useState<string>("");
  const [simHoardQty, setSimHoardQty] = useState<string>("");
  const [simBusy, setSimBusy] = useState(false);
  const [liveAlertBanner, setLiveAlertBanner] = useState<{
    status: string;
    title: string;
    body: string;
    coachingNote: string;
  } | null>(null);

  // Modals
  const [showRebalance, setShowRebalance] = useState(false);
  const [fromEnvId, setFromEnvId] = useState("");
  const [toEnvId, setToEnvId] = useState("");
  const [moveDollars, setMoveDollars] = useState("40");

  const [showAddEnvelope, setShowAddEnvelope] = useState(false);
  const [newEnvName, setNewEnvName] = useState("");
  const [newEnvDollars, setNewEnvDollars] = useState("150");
  const [newEnvEssential, setNewEnvEssential] = useState(false);

  // Savings Pause-to-Save modal/inline
  const [pauseAmountDollars, setPauseAmountDollars] = useState("25");
  const pauseNote = "Skipped impulse delivery / checkout";
  const [savingPause, setSavingPause] = useState(false);

  // Onboarding Wizard State
  const [wizIncomeDollars, setWizIncomeDollars] = useState("5500");
  const [wizHourlyDollars, setWizHourlyDollars] = useState("32");
  const [wizGoalName, setWizGoalName] = useState("Emergency Vault (4.5% HYSA)");
  const [wizSavingsDollars, setWizSavingsDollars] = useState("650");
  const [wizEnvelopes, setWizEnvelopes] = useState<
    Array<{ id: string; name: string; allocatedDollars: string }>
  >([]);
  const [wizBusy, setWizBusy] = useState(false);

  const applyDashboardPayload = useCallback((json: DashboardPayload) => {
    setData(json);
    if (json.envelopes.length >= 2) {
      setFromEnvId((prev) => prev || json.envelopes[0].id);
      setToEnvId((prev) => prev || json.envelopes[1].id);
    }
    setWizIncomeDollars(String(Math.round(json.user.monthlyIncomeCents / 100)));
    setWizHourlyDollars(String(Math.round(json.user.hourlyNetPayCents / 100)));
    if (json.savingsGoals[0]) {
      setWizGoalName(json.savingsGoals[0].name);
      setWizSavingsDollars(
        String(Math.round(json.savingsGoals[0].monthlyTargetCents / 100))
      );
    }
    setWizEnvelopes(
      json.envelopes.map((e) => ({
        id: e.id,
        name: e.name,
        allocatedDollars: String(Math.round(e.allocatedCents / 100)),
      }))
    );
  }, []);

  const loadDashboard = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load budget data");
      const json = (await res.json()) as DashboardPayload;
      applyDashboardPayload(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [applyDashboardPayload]);

  useEffect(() => {
    let active = true;
    fetch("/api/dashboard", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load budget data");
        return res.json() as Promise<DashboardPayload>;
      })
      .then((json) => {
        if (active) applyDashboardPayload(json);
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Unable to load dashboard");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [applyDashboardPayload]);

  async function handleSimulateSwipe(
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
        parseFloat(overrideDollars || simAmountDollars || "14.50") * 100
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
          envelopeId: simEnvelopeId || null,
          hoardItemType: chosenType || null,
          hoardQuantity: chosenQty,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Simulation failed");
      setLiveAlertBanner(json.coaching);
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Purchase simulation failed");
    } finally {
      setSimBusy(false);
    }
  }

  async function handleReflection(txId: string, reflection: string) {
    await fetch(`/api/transactions/${txId}/reflection`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mindfulReflection: reflection }),
    });
    await loadDashboard();
  }

  async function handleReassignEnvelope(txId: string, envelopeId: string) {
    await fetch(`/api/transactions/${txId}/reflection`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ envelopeId }),
    });
    await loadDashboard();
  }

  async function handleQuickHoardTag(txId: string, hoardItemType: string) {
    await fetch(`/api/transactions/${txId}/reflection`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hoardItemType }),
    });
    await loadDashboard();
  }

  async function handleRebalance(e: React.FormEvent) {
    e.preventDefault();
    const amountCents = Math.round(parseFloat(moveDollars || "0") * 100);
    const res = await fetch("/api/budget/envelopes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "rebalance",
        fromEnvelopeId: fromEnvId,
        toEnvelopeId: toEnvId,
        amountCents,
      }),
    });
    if (res.ok) {
      setShowRebalance(false);
      await loadDashboard();
    }
  }

  async function handleCreateEnvelope(e: React.FormEvent) {
    e.preventDefault();
    const allocatedCents = Math.round(parseFloat(newEnvDollars || "0") * 100);
    const res = await fetch("/api/budget/envelopes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        name: newEnvName,
        allocatedCents,
        isEssential: newEnvEssential,
      }),
    });
    if (res.ok) {
      setNewEnvName("");
      setShowAddEnvelope(false);
      await loadDashboard();
    }
  }

  async function handlePauseToSave(goalId: string) {
    setSavingPause(true);
    try {
      const amountCents = Math.round(parseFloat(pauseAmountDollars || "25") * 100);
      const res = await fetch("/api/savings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "contribute",
          goalId,
          amountCents,
          source: "SPENDING_PAUSE",
          note: pauseNote,
        }),
      });
      if (res.ok) {
        setLiveAlertBanner({
          status: "SAVINGS_WIN",
          title: `Pause-to-Save Win: +${formatCents(amountCents)}`,
          body: `Redirected an impulse into your savings vault — worth ${formatCents(
            calcTenYearOpportunityCents(amountCents)
          )} in 10 years at 7%!`,
          coachingNote: "You restored deliberate choice over card friction.",
        });
        await loadDashboard();
      }
    } finally {
      setSavingPause(false);
    }
  }

  async function handleCompleteOnboarding(e: React.FormEvent) {
    e.preventDefault();
    setWizBusy(true);
    try {
      const res = await fetch("/api/budget/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthlyIncomeCents: Math.round(parseFloat(wizIncomeDollars || "5500") * 100),
          hourlyNetPayCents: Math.round(parseFloat(wizHourlyDollars || "32") * 100),
          savingsGoalName: wizGoalName,
          monthlySavingsCents: Math.round(parseFloat(wizSavingsDollars || "600") * 100),
          envelopes: wizEnvelopes.map((ev) => ({
            id: ev.id,
            name: ev.name,
            allocatedCents: Math.round(parseFloat(ev.allocatedDollars || "0") * 100),
          })),
        }),
      });
      if (res.ok) {
        await loadDashboard();
      }
    } finally {
      setWizBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="container page-shell">
        <div className="surface-card">Loading your mindful budget...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container page-shell">
        <div className="banner-error">{error || "Unable to load budget."}</div>
      </div>
    );
  }

  const incomeCents = data.budgetMonth.incomeCents;
  const savingsTargetCents = data.savingsGoals.reduce(
    (sum, g) => sum + g.monthlyTargetCents,
    0
  );
  const totalSavedCents = data.savingsGoals.reduce(
    (sum, g) => sum + g.currentCents,
    0
  );
  const totalAllocatedEnvelopesCents = data.envelopes.reduce(
    (sum, e) => sum + e.allocatedCents,
    0
  );
  const readyToAssignCents =
    incomeCents - savingsTargetCents - totalAllocatedEnvelopesCents;
  const totalCardBalanceCents = data.cards.reduce(
    (sum, c) => sum + c.currentBalanceCents,
    0
  );
  const cardReserveCents = data.budgetMonth.cardReserveCents;
  const reserveCoveragePct =
    totalCardBalanceCents > 0
      ? Math.min(100, Math.round((cardReserveCents / totalCardBalanceCents) * 100))
      : 100;

  return (
    <div className="container page-shell">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {getMonthLabel(data.monthKey)} Zero-Based Plan
          </h1>
          <p className="page-subtitle">
            Every dollar is assigned before you swipe. Every purchase locks cash
            into your Card Payment Reserve.
          </p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <Link href="/cards" className="btn btn-secondary btn-sm">
            <BellRing size={15} />
            {data.pushSubscriptionCount > 0
              ? `Push Active (${data.pushSubscriptionCount})`
              : "Enable Push Alerts"}
          </Link>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowRebalance(true)}
          >
            <ArrowLeftRight size={15} /> Move Money
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setShowAddEnvelope(true)}
          >
            <Plus size={15} /> New Envelope
          </button>
        </div>
      </div>

      {/* Onboarding Wizard for new users */}
      {!data.user.onboardingCompleted && (
        <section className="surface-card" style={{ marginBottom: 26, borderColor: "var(--emerald)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div>
              <h2 style={{ fontSize: "1.35rem" }}>
                Build Your Real Zero-Based Budget
              </h2>
              <p style={{ fontSize: "0.9rem", color: "var(--ink-secondary)", marginTop: 4 }}>
                Step 1: Enter real take-home pay · Step 2: Pay Yourself First · Step 3: Assign remaining dollars to envelopes.
              </p>
            </div>
          </div>

          <form onSubmit={handleCompleteOnboarding} style={{ marginTop: 18 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 14,
              }}
            >
              <div className="field-group">
                <label className="field-label">Monthly Take-Home ($)</label>
                <input
                  type="number"
                  className="field-input"
                  value={wizIncomeDollars}
                  onChange={(e) => setWizIncomeDollars(e.target.value)}
                />
              </div>
              <div className="field-group">
                <label className="field-label">Hourly Take-Home ($/hr)</label>
                <input
                  type="number"
                  className="field-input"
                  value={wizHourlyDollars}
                  onChange={(e) => setWizHourlyDollars(e.target.value)}
                />
              </div>
              <div className="field-group">
                <label className="field-label">Primary Savings Goal</label>
                <input
                  type="text"
                  className="field-input"
                  value={wizGoalName}
                  onChange={(e) => setWizGoalName(e.target.value)}
                />
              </div>
              <div className="field-group">
                <label className="field-label">Pay Yourself First ($/mo)</label>
                <input
                  type="number"
                  className="field-input"
                  value={wizSavingsDollars}
                  onChange={(e) => setWizSavingsDollars(e.target.value)}
                />
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 12,
                marginTop: 16,
              }}
            >
              {wizEnvelopes.map((ev, idx) => (
                <div key={ev.id} className="field-group">
                  <label className="field-label">{ev.name} ($)</label>
                  <input
                    type="number"
                    className="field-input"
                    value={ev.allocatedDollars}
                    onChange={(e) => {
                      const next = [...wizEnvelopes];
                      next[idx] = { ...ev, allocatedDollars: e.target.value };
                      setWizEnvelopes(next);
                    }}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18, flexWrap: "wrap", gap: 12 }}>
              <span style={{ fontSize: "0.9rem", color: "var(--ink-secondary)" }}>
                Wizard Ready-to-Assign:{" "}
                <strong className="mono-num">
                  {formatCents(
                    Math.round(parseFloat(wizIncomeDollars || "0") * 100) -
                      Math.round(parseFloat(wizSavingsDollars || "0") * 100) -
                      wizEnvelopes.reduce(
                        (s, ev) => s + Math.round(parseFloat(ev.allocatedDollars || "0") * 100),
                        0
                      )
                  )}
                </strong>
              </span>
              <button type="submit" className="btn btn-primary" disabled={wizBusy}>
                {wizBusy ? "Saving Plan..." : "Lock In Zero-Based Budget"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Live Push / Coaching Feedback Banner */}
      {liveAlertBanner && (
        <div
          className={
            liveAlertBanner.status === "OVER_BUDGET"
              ? "banner-error"
              : liveAlertBanner.status === "NEAR_LIMIT"
                ? "banner-warn"
                : "banner-info"
          }
          style={{ marginBottom: 22 }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div>
              <strong>{liveAlertBanner.title}</strong>
              <p style={{ marginTop: 3 }}>{liveAlertBanner.body}</p>
              <p style={{ marginTop: 4, fontSize: "0.82rem", opacity: 0.9 }}>
                Coaching: {liveAlertBanner.coachingNote}
              </p>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setLiveAlertBanner(null)}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Visual Purchase Hoard Showcase */}
      <HoardVisual
        userName={data.user.name}
        avatarStyle={data.user.avatarStyle || "explorer"}
        avatarColor={data.user.avatarColor || "#1B4D3E"}
        hourlyNetPayCents={data.user.hourlyNetPayCents}
        monthKey={data.monthKey}
        totalSavedCents={totalSavedCents}
        transactions={data.transactions}
        onRefresh={loadDashboard}
      />

      {/* Top 4 Metrics */}
      <section className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Monthly Income</div>
          <div className="metric-value mono-num">{formatCents(incomeCents)}</div>
          <div className="metric-hint">
            1 hr work = {formatCents(data.user.hourlyNetPayCents)} net
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Pay Yourself First</div>
          <div className="metric-value mono-num" style={{ color: "var(--emerald)" }}>
            {formatCents(savingsTargetCents)}/mo
          </div>
          <div className="metric-hint">
            {formatCents(totalSavedCents)} saved across {data.savingsGoals.length} vault(s)
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Card Payment Reserve</div>
          <div className="metric-value mono-num" style={{ color: "var(--emerald)" }}>
            {formatCents(cardReserveCents)}
          </div>
          <div className="metric-hint">
            <span className="status-pill status-within">
              {reserveCoveragePct}% Statement Covered · $0 APR
            </span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Ready to Assign</div>
          <div
            className="metric-value mono-num"
            style={{
              color:
                readyToAssignCents < 0
                  ? "var(--terracotta)"
                  : readyToAssignCents === 0
                    ? "var(--emerald)"
                    : "var(--ink-primary)",
            }}
          >
            {formatCents(readyToAssignCents)}
          </div>
          <div className="metric-hint">
            {readyToAssignCents === 0
              ? "Zero-based balance achieved"
              : readyToAssignCents > 0
                ? "Assign remaining dollars to envelopes or savings"
                : "Over-assigned — trim an envelope"}
          </div>
        </div>
      </section>

      {/* Main Two-Column Body */}
      <div className="dashboard-columns">
        {/* Left Column: Envelopes + Transaction Feed */}
        <div className="stack-col">
          <section className="surface-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: "1.3rem" }}>Zero-Based Spending Envelopes</h2>
                <p style={{ fontSize: "0.86rem", color: "var(--ink-secondary)" }}>
                  Watch real dollars shrink after every credit card tap.
                </p>
              </div>
            </div>

            <div className="envelopes-grid">
              {data.envelopes.map((env) => {
                const remaining = env.allocatedCents - env.spentCents;
                const pct =
                  env.allocatedCents > 0
                    ? Math.round((env.spentCents / env.allocatedCents) * 100)
                    : 0;
                const fillClass =
                  remaining < 0
                    ? "fill-terracotta"
                    : pct >= 75
                      ? "fill-amber"
                      : "fill-emerald";
                const pillClass =
                  remaining < 0
                    ? "status-over"
                    : pct >= 75
                      ? "status-near"
                      : "status-within";

                return (
                  <div key={env.id} className="envelope-card">
                    <div className="envelope-top">
                      <div>
                        <div className="envelope-name">{env.name}</div>
                        <span style={{ fontSize: "0.75rem", color: "var(--ink-muted)" }}>
                          {env.isEssential ? "Essential" : "Discretionary"}
                        </span>
                      </div>
                      <span className={`status-pill ${pillClass}`}>
                        {remaining < 0 ? "Over" : pct >= 75 ? "Watch" : `${pct}%`}
                      </span>
                    </div>

                    <div
                      className="mono-num"
                      style={{
                        fontSize: "1.3rem",
                        fontWeight: 700,
                        color: remaining < 0 ? "var(--terracotta)" : "var(--ink-primary)",
                      }}
                    >
                      {formatCents(remaining)}{" "}
                      <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--ink-muted)" }}>
                        left
                      </span>
                    </div>

                    <div className="progress-track">
                      <div
                        className={`progress-fill ${fillClass}`}
                        style={{ width: `${Math.min(100, Math.max(2, pct))}%` }}
                      />
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "var(--ink-secondary)" }}>
                      <span>Spent {formatCents(env.spentCents)}</span>
                      <span>Cap {formatCents(env.allocatedCents)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Synced Credit Card Feed */}
          <section className="surface-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: "1.3rem" }}>Credit Card Activity &amp; Mindful Check-In</h2>
                <p style={{ fontSize: "0.86rem", color: "var(--ink-secondary)" }}>
                  Tag purchases as Planned, Essential, or Impulse to build awareness and stop invisible leaks.
                </p>
              </div>
              <Link href="/cards" className="btn btn-ghost btn-sm">
                <CreditCard size={15} /> Manage Cards
              </Link>
            </div>

            {data.transactions.length === 0 ? (
              <div className="surface-oat">
                No credit card purchases synced yet. Use the <strong>Simulate Card Purchase</strong> panel or link a Plaid card to see real-time alerts!
              </div>
            ) : (
              <div className="tx-list">
                {data.transactions.map((tx) => {
                  const statusClass =
                    tx.budgetStatusAtPurchase === "OVER_BUDGET"
                      ? "status-over"
                      : tx.budgetStatusAtPurchase === "NEAR_LIMIT"
                        ? "status-near"
                        : "status-within";
                  const statusLabel =
                    tx.budgetStatusAtPurchase === "OVER_BUDGET"
                      ? "Over Budget"
                      : tx.budgetStatusAtPurchase === "NEAR_LIMIT"
                        ? "Near Limit"
                        : "Within Budget";

                  return (
                    <div key={tx.id} className="tx-row">
                      <div className="tx-header">
                        <div>
                          <div className="tx-merchant">{tx.merchantName}</div>
                          <div className="tx-meta">
                            {new Date(tx.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}{" "}
                            · {tx.creditCardAccount.name}{" "}
                            {tx.creditCardAccount.mask ? `••${tx.creditCardAccount.mask}` : ""} ·{" "}
                            {tx.paymentChannel === "online" ? "Online Checkout" : "In-Store / Tap"} ·{" "}
                            {calcWorkHours(tx.amountCents, data.user.hourlyNetPayCents)}
                            {tx.hoardItemLabel ? (
                              <>
                                {" "}·{" "}
                                <strong style={{ color: "var(--emerald)" }}>
                                  {tx.hoardQuantity || 1}× {tx.hoardItemLabel}
                                </strong>
                              </>
                            ) : null}
                          </div>
                        </div>

                        <div style={{ textAlign: "right" }}>
                          <div className="mono-num" style={{ fontWeight: 700, fontSize: "1.05rem" }}>
                            {formatCents(tx.amountCents)}
                          </div>
                          <span className={`status-pill ${statusClass}`} style={{ marginTop: 4 }}>
                            {statusLabel}
                          </span>
                        </div>
                      </div>

                      {tx.coachingNote && (
                        <div className="tx-coaching">{tx.coachingNote}</div>
                      )}

                      <div className="tx-controls">
                        <div className="chip-row">
                          {(["PLANNED", "ESSENTIAL", "IMPULSE"] as const).map((tag) => {
                            const active = tx.mindfulReflection === tag;
                            return (
                              <button
                                key={tag}
                                type="button"
                                className={`chip-btn ${
                                  active
                                    ? tag === "IMPULSE"
                                      ? "selected-impulse"
                                      : "selected"
                                    : ""
                                }`}
                                onClick={() => handleReflection(tx.id, tag)}
                              >
                                {tag === "PLANNED"
                                  ? "Planned"
                                  : tag === "ESSENTIAL"
                                    ? "Essential"
                                    : "Impulse"}
                              </button>
                            );
                          })}
                        </div>

                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          <select
                            aria-label={`Hoard item visual for ${tx.merchantName}`}
                            className="field-select"
                            style={{ width: "auto", padding: "4px 10px", fontSize: "0.78rem" }}
                            value={tx.hoardItemType || "general"}
                            onChange={(e) => handleQuickHoardTag(tx.id, e.target.value)}
                          >
                            {(Object.keys(HOARD_CATALOG) as HoardItemType[]).map((key) => (
                              <option key={key} value={key}>
                                Hoard: {HOARD_CATALOG[key].label}
                              </option>
                            ))}
                          </select>

                          <select
                            aria-label={`Envelope for ${tx.merchantName}`}
                            className="field-select"
                            style={{ width: "auto", padding: "4px 10px", fontSize: "0.78rem" }}
                            value={tx.envelope?.id || ""}
                            onChange={(e) => handleReassignEnvelope(tx.id, e.target.value)}
                          >
                            {data.envelopes.map((env) => (
                              <option key={env.id} value={env.id}>
                                {env.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Live Purchase Simulator + Savings Goals */}
        <div className="stack-col">
          <section className="surface-card">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Zap size={18} color="#1B4D3E" />
              <h2 style={{ fontSize: "1.22rem" }}>Simulate Live Card Swipe</h2>
            </div>
            <p style={{ fontSize: "0.86rem", color: "var(--ink-secondary)", marginTop: 5 }}>
              Add items straight into your Hoard + test the Plaid &rarr; Envelope &rarr; Card Reserve &rarr; Push pipeline.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={simBusy}
                onClick={() =>
                  handleSimulateSwipe("Costco Food Court", "15.00", "in store", "costco_hotdog", 10)
                }
              >
                +10 Costco Hot Dogs ($15)
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={simBusy}
                onClick={() =>
                  handleSimulateSwipe("Nintendo Store (Switch 2)", "449.99", "online", "switch_2", 1)
                }
              >
                +Switch 2 ($449.99)
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={simBusy}
                onClick={() =>
                  handleSimulateSwipe("Steam Store", "59.99", "online", "steam_game", 1)
                }
              >
                +Steam Game ($59.99)
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={simBusy}
                onClick={() =>
                  handleSimulateSwipe("Blue Bottle Coffee", "7.50", "in store", "coffee", 1)
                }
              >
                $7.50 Coffee
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={simBusy}
                onClick={() =>
                  handleSimulateSwipe("Nordstrom Online", "145.00", "online", "clothing", 2)
                }
              >
                $145.00 Impulse Test
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSimulateSwipe();
              }}
              style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}
            >
              <div className="field-group">
                <label className="field-label">Merchant</label>
                <input
                  type="text"
                  className="field-input"
                  value={simMerchant}
                  onChange={(e) => setSimMerchant(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div className="field-group">
                  <label className="field-label">Amount ($)</label>
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
                <div className="field-group">
                  <label className="field-label">Channel</label>
                  <select
                    className="field-select"
                    value={simChannel}
                    onChange={(e) => setSimChannel(e.target.value)}
                  >
                    <option value="in store">Tap / In-Store</option>
                    <option value="online">Online 1-Click</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.35fr 0.65fr", gap: 10 }}>
                <div className="field-group">
                  <label className="field-label">Hoard Visual Item</label>
                  <select
                    className="field-select"
                    value={simHoardType}
                    onChange={(e) => setSimHoardType(e.target.value)}
                  >
                    <option value="">Auto-detect from merchant</option>
                    {(Object.keys(HOARD_CATALOG) as HoardItemType[]).map((key) => (
                      <option key={key} value={key}>
                        {HOARD_CATALOG[key].label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field-group">
                  <label className="field-label">Item Qty</label>
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
              </div>

              <div className="field-group">
                <label className="field-label">Envelope (or auto-match)</label>
                <select
                  className="field-select"
                  value={simEnvelopeId}
                  onChange={(e) => setSimEnvelopeId(e.target.value)}
                >
                  <option value="">Auto-categorize by merchant</option>
                  {data.envelopes.map((env) => (
                    <option key={env.id} value={env.id}>
                      {env.name} ({formatCents(env.allocatedCents - env.spentCents)} left)
                    </option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn btn-primary" disabled={simBusy}>
                <BellRing size={16} />
                {simBusy ? "Processing Swipe..." : "Swipe Card & Send Push Alert"}
              </button>
            </form>
          </section>

          {/* Savings Goals & Pause-to-Save */}
          <section className="surface-card">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <PiggyBank size={18} color="#1B4D3E" />
              <h2 style={{ fontSize: "1.22rem" }}>Real Savings &amp; Pause-to-Save</h2>
            </div>
            <p style={{ fontSize: "0.86rem", color: "var(--ink-secondary)", marginTop: 5 }}>
              Every skipped impulse buy turns into compounding wealth.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 14 }}>
              {data.savingsGoals.map((goal) => {
                const pct =
                  goal.targetCents > 0
                    ? Math.min(100, Math.round((goal.currentCents / goal.targetCents) * 100))
                    : 0;
                return (
                  <div key={goal.id} className="envelope-card">
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <strong style={{ fontSize: "0.94rem" }}>{goal.name}</strong>
                      <span className="status-pill status-within">
                        {(goal.apyBps / 100).toFixed(2)}% APY
                      </span>
                    </div>
                    <div className="mono-num" style={{ fontSize: "1.2rem", fontWeight: 700, marginTop: 6 }}>
                      {formatCents(goal.currentCents)}{" "}
                      <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--ink-muted)" }}>
                        / {formatCents(goal.targetCents)}
                      </span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill fill-emerald" style={{ width: `${Math.max(3, pct)}%` }} />
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "var(--ink-secondary)", marginBottom: 10 }}>
                      Monthly Pay-Yourself-First target: {formatCents(goal.monthlyTargetCents)}
                    </div>

                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        aria-label="Pause-to-save amount"
                        className="field-input"
                        style={{ width: 88, padding: "6px 10px" }}
                        value={pauseAmountDollars}
                        onChange={(e) => setPauseAmountDollars(e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1 }}
                        disabled={savingPause}
                        onClick={() => handlePauseToSave(goal.id)}
                      >
                        <Sparkles size={14} /> Pause Impulse &amp; Save
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Behavioral Insight Card */}
          <section className="surface-oat">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              {totalCardBalanceCents <= cardReserveCents ? (
                <CheckCircle2 size={18} color="#1B4D3E" />
              ) : (
                <AlertTriangle size={18} color="#B4690E" />
              )}
              <strong style={{ fontSize: "0.96rem" }}>Credit Card Payoff Shield</strong>
            </div>
            <p style={{ fontSize: "0.86rem", color: "var(--ink-secondary)" }}>
              Your Credit Card Payment Reserve holds{" "}
              <strong className="mono-num">{formatCents(cardReserveCents)}</strong> against{" "}
              <strong className="mono-num">{formatCents(totalCardBalanceCents)}</strong> in tracked card balances. Keep 100% coverage so rewards never cost 22% APR interest.
            </p>
            <Link
              href="/academy"
              style={{
                display: "inline-block",
                marginTop: 10,
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--emerald)",
              }}
            >
              Read the Behavioral Research &rarr;
            </Link>
          </section>
        </div>
      </div>

      {/* Rebalance Modal */}
      {showRebalance && (
        <div className="modal-backdrop">
          <div className="modal-panel">
            <h3 style={{ fontSize: "1.3rem" }}>Zero-Based Envelope Rebalance</h3>
            <p style={{ fontSize: "0.88rem", color: "var(--ink-secondary)", marginTop: 4 }}>
              Cover an over-budget envelope by moving funds from another spending category — never by borrowing on credit.
            </p>
            <form onSubmit={handleRebalance} style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 16 }}>
              <div className="field-group">
                <label className="field-label">Move From</label>
                <select
                  className="field-select"
                  value={fromEnvId}
                  onChange={(e) => setFromEnvId(e.target.value)}
                >
                  {data.envelopes.map((env) => (
                    <option key={env.id} value={env.id}>
                      {env.name} ({formatCents(env.allocatedCents - env.spentCents)} left)
                    </option>
                  ))}
                </select>
              </div>
              <div className="field-group">
                <label className="field-label">Move To</label>
                <select
                  className="field-select"
                  value={toEnvId}
                  onChange={(e) => setToEnvId(e.target.value)}
                >
                  {data.envelopes.map((env) => (
                    <option key={env.id} value={env.id}>
                      {env.name} ({formatCents(env.allocatedCents - env.spentCents)} left)
                    </option>
                  ))}
                </select>
              </div>
              <div className="field-group">
                <label className="field-label">Amount ($)</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  className="field-input"
                  value={moveDollars}
                  onChange={(e) => setMoveDollars(e.target.value)}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowRebalance(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Move Dollars
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Envelope Modal */}
      {showAddEnvelope && (
        <div className="modal-backdrop">
          <div className="modal-panel">
            <h3 style={{ fontSize: "1.3rem" }}>Create New Budget Envelope</h3>
            <form onSubmit={handleCreateEnvelope} style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 16 }}>
              <div className="field-group">
                <label className="field-label">Envelope Name</label>
                <input
                  type="text"
                  required
                  className="field-input"
                  placeholder="e.g., Health & Pharmacy"
                  value={newEnvName}
                  onChange={(e) => setNewEnvName(e.target.value)}
                />
              </div>
              <div className="field-group">
                <label className="field-label">Monthly Cap ($)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  className="field-input"
                  value={newEnvDollars}
                  onChange={(e) => setNewEnvDollars(e.target.value)}
                />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.9rem" }}>
                <input
                  type="checkbox"
                  checked={newEnvEssential}
                  onChange={(e) => setNewEnvEssential(e.target.checked)}
                />
                Mark as Essential category
              </label>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddEnvelope(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Envelope
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
