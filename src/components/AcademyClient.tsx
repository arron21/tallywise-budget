"use client";

import { useState } from "react";
import { BookOpen, Calculator, CheckCircle2, Compass } from "lucide-react";
import { RESEARCH_MODULES, type ResearchModule } from "@/lib/research";

interface ProgressEntry {
  moduleSlug: string;
  reflectionNote: string | null;
}

export function AcademyClient({
  isLoggedIn,
  initialProgress,
  defaultHourlyDollars,
}: {
  isLoggedIn: boolean;
  initialProgress: ProgressEntry[];
  defaultHourlyDollars: number;
}) {
  const [completed, setCompleted] = useState<Record<string, string>>(
    Object.fromEntries(
      initialProgress.map((p) => [p.moduleSlug, p.reflectionNote || ""])
    )
  );
  const [notes, setNotes] = useState<Record<string, string>>(
    Object.fromEntries(
      initialProgress.map((p) => [p.moduleSlug, p.reflectionNote || ""])
    )
  );
  const [savingSlug, setSavingSlug] = useState<string | null>(null);

  // Rewards Trap Calculator
  const [monthlySpend, setMonthlySpend] = useState(1800);
  const [cashbackPct, setCashbackPct] = useState(2);
  const [overspendPct, setOverspendPct] = useState(14);

  const rewardEarned = monthlySpend * (cashbackPct / 100);
  const extraSpendCost = monthlySpend * (overspendPct / 100);
  const netRewardsEffect = rewardEarned - extraSpendCost;

  // True Cost Translator
  const [itemPrice, setItemPrice] = useState(85);
  const [hourlyWage, setHourlyWage] = useState(defaultHourlyDollars || 32);
  const hoursCost = hourlyWage > 0 ? itemPrice / hourlyWage : 0;
  const tenYearCompounded = itemPrice * Math.pow(1.07, 10);
  const weeklyHabitTenYr = itemPrice * 52 * ((Math.pow(1.07, 10) - 1) / 0.07);

  // Spending Trigger Quiz
  const [triggerChoice, setTriggerChoice] = useState<
    "contactless" | "delayed" | "rewards" | "emotional"
  >("contactless");

  const triggerPrescription: Record<
    typeof triggerChoice,
    { title: string; rule: string }
  > = {
    contactless: {
      title: "Frictionless Micro-Swipe Vulnerability",
      rule: "Remove saved cards from delivery and 1-click apps. Enable Tallywise push alerts so every $7–$20 tap visibly deducts from Dining & Coffee.",
    },
    delayed: {
      title: "Temporal Decoupling & Statement Shock",
      rule: "Never look at your credit limit. Rely exclusively on Tallywise's Card Payment Reserve so 100% of every charge is locked away the day you swipe.",
    },
    rewards: {
      title: "Rewards Illusion Rationalizer",
      rule: "Treat cashback as a $0 bonus until the end of the month. Never add an item to hit a minimum spend or 3× points threshold.",
    },
    emotional: {
      title: "Stress / Convenience Impulse Buyer",
      rule: "Institute a 48-hour cooling-off rule for any non-essential item over $35, and celebrate skipped buys with Tallywise's Pause-to-Save button.",
    },
  };

  async function markComplete(mod: ResearchModule) {
    if (!isLoggedIn) return;
    setSavingSlug(mod.slug);
    try {
      const note = notes[mod.slug] || "";
      const res = await fetch("/api/academy/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleSlug: mod.slug,
          reflectionNote: note,
        }),
      });
      if (res.ok) {
        setCompleted((prev) => ({ ...prev, [mod.slug]: note }));
      }
    } finally {
      setSavingSlug(null);
    }
  }

  return (
    <div className="container page-shell">
      <div className="page-header">
        <div>
          <h1 className="page-title">The Science of Credit Card Spending</h1>
          <p className="page-subtitle">
            Peer-reviewed behavioral economics explaining why plastic &amp; contactless taps make us spend more — and exact habits that reverse it.
          </p>
        </div>
        <span className="status-pill status-within">
          <BookOpen size={14} /> {Object.keys(completed).length} /{" "}
          {RESEARCH_MODULES.length} Modules Completed
        </span>
      </div>

      <div className="academy-grid">
        {/* Left: Research Modules */}
        <div className="stack-col">
          {RESEARCH_MODULES.map((mod, index) => {
            const isDone = mod.slug in completed;
            return (
              <article key={mod.slug} className="surface-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div>
                    <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--sage)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Study {index + 1} · {mod.citation}
                    </span>
                    <h2 style={{ fontSize: "1.35rem", marginTop: 4 }}>{mod.title}</h2>
                    <p style={{ fontSize: "0.9rem", color: "var(--ink-secondary)", marginTop: 4 }}>
                      {mod.subtitle}
                    </p>
                  </div>
                  <div style={{ textAlign: "right", minWidth: 110 }}>
                    <div className="mono-num" style={{ fontSize: "1.45rem", fontWeight: 700, color: "var(--terracotta)" }}>
                      {mod.keyStat}
                    </div>
                    <div style={{ fontSize: "0.74rem", color: "var(--ink-muted)" }}>
                      {mod.statLabel}
                    </div>
                  </div>
                </div>

                <p style={{ marginTop: 14, fontSize: "0.94rem", color: "var(--ink-primary)" }}>
                  {mod.summary}
                </p>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: 12,
                    marginTop: 14,
                  }}
                >
                  <div className="surface-oat" style={{ padding: 14 }}>
                    <strong style={{ fontSize: "0.84rem", color: "var(--terracotta)" }}>
                      Why Cards Trigger Overspending
                    </strong>
                    <p style={{ fontSize: "0.84rem", color: "var(--ink-secondary)", marginTop: 4 }}>
                      {mod.howCreditCardsExploitIt}
                    </p>
                  </div>

                  <div className="surface-oat" style={{ padding: 14, background: "var(--bg-emerald-tint)" }}>
                    <strong style={{ fontSize: "0.84rem", color: "var(--emerald)" }}>
                      How Tallywise Restores Control
                    </strong>
                    <p style={{ fontSize: "0.84rem", color: "var(--ink-secondary)", marginTop: 4 }}>
                      {mod.howTallywiseCountersIt}
                    </p>
                  </div>
                </div>

                <div style={{ marginTop: 14, fontSize: "0.88rem" }}>
                  <strong>Habit Rule:</strong> {mod.actionRule}
                </div>

                {isLoggedIn && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border-sand)" }}>
                    <label className="field-label" style={{ display: "block", marginBottom: 6 }}>
                      Personal Reflection: {mod.promptQuestion}
                    </label>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <input
                        type="text"
                        className="field-input"
                        style={{ flex: 1, minWidth: 220 }}
                        placeholder="Write one concrete takeaway..."
                        value={notes[mod.slug] || ""}
                        onChange={(e) =>
                          setNotes((prev) => ({ ...prev, [mod.slug]: e.target.value }))
                        }
                      />
                      <button
                        type="button"
                        className={`btn btn-sm ${isDone ? "btn-secondary" : "btn-primary"}`}
                        disabled={savingSlug === mod.slug}
                        onClick={() => markComplete(mod)}
                      >
                        <CheckCircle2 size={15} />
                        {isDone ? "Update Note" : "Mark Studied"}
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {/* Right: Interactive Behavioral Calculators */}
        <div className="stack-col">
          {/* Rewards Trap Calculator */}
          <section className="surface-card">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Calculator size={18} color="#1B4D3E" />
              <h3 style={{ fontSize: "1.22rem" }}>The Cashback Rewards Trap</h3>
            </div>
            <p style={{ fontSize: "0.86rem", color: "var(--ink-secondary)", marginTop: 4 }}>
              Test whether 2%–3% card rewards actually put you ahead if plastic causes even modest unbudgeted overspending.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.84rem" }}>
                  <span>Monthly Card Budget</span>
                  <strong className="mono-num">${monthlySpend}/mo</strong>
                </div>
                <input
                  type="range"
                  min={500}
                  max={6000}
                  step={100}
                  className="range-input"
                  value={monthlySpend}
                  onChange={(e) => setMonthlySpend(Number(e.target.value))}
                />
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.84rem" }}>
                  <span>Card Cashback Rate</span>
                  <strong className="mono-num">{cashbackPct.toFixed(1)}%</strong>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={0.5}
                  className="range-input"
                  value={cashbackPct}
                  onChange={(e) => setCashbackPct(Number(e.target.value))}
                />
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.84rem" }}>
                  <span>Unbudgeted Card Overspend (MIT avg: 12–18%)</span>
                  <strong className="mono-num">{overspendPct}%</strong>
                </div>
                <input
                  type="range"
                  min={0}
                  max={25}
                  step={1}
                  className="range-input"
                  value={overspendPct}
                  onChange={(e) => setOverspendPct(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="surface-oat" style={{ marginTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.86rem" }}>
                <span>Rewards Earned:</span>
                <strong className="mono-num" style={{ color: "var(--emerald)" }}>
                  +${rewardEarned.toFixed(0)}/mo
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.86rem", marginTop: 6 }}>
                <span>Extra Card Overspend:</span>
                <strong className="mono-num" style={{ color: "var(--terracotta)" }}>
                  -${extraSpendCost.toFixed(0)}/mo
                </strong>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.96rem",
                  marginTop: 10,
                  paddingTop: 10,
                  borderTop: "1px solid var(--border-strong)",
                }}
              >
                <strong>Net Monthly Impact:</strong>
                <strong
                  className="mono-num"
                  style={{
                    color: netRewardsEffect >= 0 ? "var(--emerald)" : "var(--terracotta)",
                  }}
                >
                  {netRewardsEffect >= 0 ? "+" : "-"}${Math.abs(netRewardsEffect).toFixed(0)}/mo
                </strong>
              </div>
            </div>
          </section>

          {/* True Cost & 10-Year Compounding Translator */}
          <section className="surface-card">
            <h3 style={{ fontSize: "1.22rem" }}>True Cost &amp; 10-Year Wealth Translator</h3>
            <p style={{ fontSize: "0.86rem", color: "var(--ink-secondary)", marginTop: 4 }}>
              Restore the pain of paying by translating dollars into hours of your life and compounded future savings.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
              <div className="field-group">
                <label className="field-label">Purchase Price ($)</label>
                <input
                  type="number"
                  min={1}
                  className="field-input"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(Math.max(1, Number(e.target.value)))}
                />
              </div>
              <div className="field-group">
                <label className="field-label">Take-Home Wage ($/hr)</label>
                <input
                  type="number"
                  min={1}
                  className="field-input"
                  value={hourlyWage}
                  onChange={(e) => setHourlyWage(Math.max(1, Number(e.target.value)))}
                />
              </div>
            </div>

            <div className="surface-oat" style={{ marginTop: 14 }}>
              <div style={{ fontSize: "0.88rem" }}>
                Life Energy Cost:{" "}
                <strong className="mono-num">{hoursCost.toFixed(1)} hours of work</strong>
              </div>
              <div style={{ fontSize: "0.88rem", marginTop: 6 }}>
                10-Yr Compounded Value (7%):{" "}
                <strong className="mono-num" style={{ color: "var(--emerald)" }}>
                  ${tenYearCompounded.toFixed(0)}
                </strong>
              </div>
              <div style={{ fontSize: "0.84rem", color: "var(--ink-secondary)", marginTop: 6 }}>
                If this becomes a weekly habit, saving it instead grows to{" "}
                <strong className="mono-num">${weeklyHabitTenYr.toFixed(0)}</strong> in 10 years.
              </div>
            </div>
          </section>

          {/* Spending Trigger Diagnostic */}
          <section className="surface-card">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Compass size={18} color="#1B4D3E" />
              <h3 style={{ fontSize: "1.22rem" }}>Identify Your #1 Card Trigger</h3>
            </div>
            <p style={{ fontSize: "0.86rem", color: "var(--ink-secondary)", marginTop: 4 }}>
              Pick the pattern that feels most familiar when your statement arrives:
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
              {(
                [
                  ["contactless", "Small $6–$20 tap-to-pay / delivery orders add up silently"],
                  ["delayed", "I feel fine all month, then get shocked when the bill closes"],
                  ["rewards", "I justify purchases because I earn 2%–5% points or cashback"],
                  ["emotional", "Stress or late-night browsing triggers 1-click checkouts"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={`btn btn-sm ${triggerChoice === key ? "btn-primary" : "btn-secondary"}`}
                  style={{ justifyContent: "flex-start", textAlign: "left" }}
                  onClick={() => setTriggerChoice(key)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="banner-info" style={{ marginTop: 14 }}>
              <strong>{triggerPrescription[triggerChoice].title}</strong>
              <p style={{ marginTop: 4 }}>{triggerPrescription[triggerChoice].rule}</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
