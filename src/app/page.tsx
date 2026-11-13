import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { ArrowRight, BellRing, PiggyBank, ShieldCheck } from "lucide-react";

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="container">
      <section className="hero-section">
        <div className="hero-grid">
          <div>
            <div className="hero-eyebrow">
              Behavioral Economics × Real-Time Credit Control
            </div>
            <h1 className="hero-title">
              Make every credit card tap feel as real as cash.
            </h1>
            <p className="hero-subtitle">
              Behavioral studies show people spend 12%–18% more with credit cards
              because deferred billing silences the natural &ldquo;pain of
              paying.&rdquo; Tallywise syncs with your cards via Plaid, locks
              your budget in zero-based envelopes, and pushes instant spending
              alerts on every purchase.
            </p>
            <div className="hero-cta-row">
              {session?.user ? (
                <Link href="/dashboard" className="btn btn-primary">
                  Open Your Budget <ArrowRight size={17} />
                </Link>
              ) : (
                <>
                  <Link href="/register" className="btn btn-primary">
                    Build Your Real Budget <ArrowRight size={17} />
                  </Link>
                  <Link href="/login?demo=1" className="btn btn-secondary">
                    Try Live Demo Account
                  </Link>
                </>
              )}
              <Link href="/academy" className="btn btn-ghost">
                Explore the Research
              </Link>
            </div>
            <p style={{ fontSize: "0.84rem", color: "var(--ink-muted)" }}>
              Deploy-ready on Vercel · Plaid Transactions Sync · Native PWA Web
              Push Alerts
            </p>
          </div>

          <div className="hero-visual-frame">
            <Image
              src="/images/mindful-envelope-hero.jpg"
              alt="Tactile paper budget envelopes, savings vessel, and credit card"
              width={1024}
              height={768}
              priority
              className="hero-visual-img"
            />
          </div>
        </div>
      </section>

      <section className="stat-strip">
        <div className="surface-card">
          <div className="mono-num" style={{ fontSize: "1.9rem", fontWeight: 700, color: "var(--emerald)" }}>
            Up to 2×
          </div>
          <h3 style={{ fontSize: "1.1rem", marginTop: 8 }}>
            The Credit Card Premium
          </h3>
          <p style={{ fontSize: "0.9rem", color: "var(--ink-secondary)", marginTop: 6 }}>
            Prelec &amp; Simester (MIT, 2001) found shoppers bid up to twice as
            much when paying by credit card instead of cash because limits feel
            abstract.
          </p>
        </div>

        <div className="surface-card">
          <div className="mono-num" style={{ fontSize: "1.9rem", fontWeight: 700, color: "var(--terracotta)" }}>
            +8% to +10%
          </div>
          <h3 style={{ fontSize: "1.1rem", marginTop: 8 }}>
            Contactless &ldquo;Spendception&rdquo;
          </h3>
          <p style={{ fontSize: "0.9rem", color: "var(--ink-secondary)", marginTop: 6 }}>
            Trütsch (2014) and DNB studies show contactless &amp; mobile taps
            further numb payment awareness across ~16 monthly card swipes.
          </p>
        </div>

        <div className="surface-card">
          <div className="mono-num" style={{ fontSize: "1.9rem", fontWeight: 700, color: "var(--sage)" }}>
            100% Covered
          </div>
          <h3 style={{ fontSize: "1.1rem", marginTop: 8 }}>
            Automatic Card Reserve
          </h3>
          <p style={{ fontSize: "0.9rem", color: "var(--ink-secondary)", marginTop: 6 }}>
            Every synced purchase pulls cash from its budget envelope into your
            Card Payment Reserve — ending statement shock and interest forever.
          </p>
        </div>
      </section>

      <section style={{ paddingBottom: 72 }}>
        <div className="surface-oat">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 24,
            }}
          >
            <div>
              <PiggyBank size={22} color="#1B4D3E" />
              <h3 style={{ fontSize: "1.12rem", marginTop: 10 }}>
                1. Pay Yourself First
              </h3>
              <p style={{ fontSize: "0.9rem", color: "var(--ink-secondary)", marginTop: 6 }}>
                Fund your High-Yield Emergency Vault and savings goals before a
                single discretionary dollar enters spending envelopes.
              </p>
            </div>
            <div>
              <ShieldCheck size={22} color="#1B4D3E" />
              <h3 style={{ fontSize: "1.12rem", marginTop: 10 }}>
                2. Zero-Based Envelopes
              </h3>
              <p style={{ fontSize: "0.9rem", color: "var(--ink-secondary)", marginTop: 6 }}>
                Give every take-home dollar a job. When Groceries or Dining runs
                low, rebalance intentionally rather than creating debt.
              </p>
            </div>
            <div>
              <BellRing size={22} color="#1B4D3E" />
              <h3 style={{ fontSize: "1.12rem", marginTop: 10 }}>
                3. Instant Push Coaching
              </h3>
              <p style={{ fontSize: "0.9rem", color: "var(--ink-secondary)", marginTop: 6 }}>
                Every Plaid webhook or simulated swipe triggers a Web Push alert
                with envelope status, work-hours cost, and 10-year value.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
