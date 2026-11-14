import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { ArrowRight, BellRing, PiggyBank, ShieldCheck, Sparkles } from "lucide-react";
import {
  CharacterAvatarSvg,
  HotDogSpriteSvg,
  SavingsChestSvg,
  Switch2ConsoleSvg,
} from "@/components/HoardVisual";

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="container">
      <section className="hero-section">
        <div className="hero-grid">
          <div>
            <div className="hero-eyebrow">
              Behavioral Economics × Visual Spend Hoard
            </div>
            <h1 className="hero-title">
              See every dollar turn into what you actually bought.
            </h1>
            <p className="hero-subtitle">
              Credit cards numb the natural &ldquo;pain of paying,&rdquo; leading
              people to spend 12%–18% more without noticing. Tallywise syncs
              with your cards via Plaid, locks your cash in zero-based envelopes,
              pushes instant swipe alerts, and piles your real purchases—from{" "}
              <strong>150 Costco hot dogs</strong> to a{" "}
              <strong>Nintendo Switch 2</strong> and{" "}
              <strong>$400 in Steam games</strong>—right beneath your avatar.
            </p>
            <div className="hero-cta-row">
              {session?.user ? (
                <Link href="/dashboard" className="btn btn-primary">
                  Open Your Purchase Hoard <ArrowRight size={17} />
                </Link>
              ) : (
                <>
                  <Link href="/register" className="btn btn-primary">
                    Build Your Real Budget <ArrowRight size={17} />
                  </Link>
                  <Link href="/login?demo=1" className="btn btn-secondary">
                    Try Live Demo Hoard
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

          {/* Interactive-style Visual Hoard Showcase */}
          <div className="hero-hoard-preview">
            <div className="hero-hoard-banner">
              <span>
                <Sparkles size={14} /> Sample Year-in-Review Hoard
              </span>
              <span className="mono-num">$1,074.99 visualized</span>
            </div>

            <div className="hero-hoard-top">
              <div className="hero-hoard-avatar">
                <CharacterAvatarSvg style="explorer" color="#1B4D3E" size={88} />
                <span className="mono-num" style={{ fontSize: "0.78rem", fontWeight: 700 }}>
                  Maya’s Hoard
                </span>
              </div>
              <div className="hero-hoard-chest">
                <SavingsChestSvg size={70} />
                <div>
                  <div style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--emerald)" }}>
                    KEPT SAVINGS
                  </div>
                  <div className="mono-num" style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                    $13,700.00
                  </div>
                </div>
              </div>
            </div>

            <div className="hero-hoard-loot">
              <div className="hero-loot-card">
                <div className="hero-loot-head">
                  <span className="mono-num">150× Costco Hot Dogs</span>
                  <span className="mono-num">$225.00</span>
                </div>
                <div className="hero-hotdog-grid" aria-label="40 sample hot dog icons representing 150 total">
                  {Array.from({ length: 36 }).map((_, idx) => (
                    <span
                      key={idx}
                      style={{
                        display: "inline-flex",
                        transform: `rotate(${((idx * 17) % 19) - 9}deg)`,
                      }}
                    >
                      <HotDogSpriteSvg size={20} />
                    </span>
                  ))}
                  <span className="hoard-overflow-badge mono-num">150 total</span>
                </div>
              </div>

              <div className="hero-loot-split">
                <div className="hero-loot-card" style={{ textAlign: "center" }}>
                  <div className="hero-loot-head">
                    <span className="mono-num">1× Switch 2</span>
                    <span className="mono-num">$449.99</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "center", padding: "6px 0" }}>
                    <Switch2ConsoleSvg width={120} />
                  </div>
                </div>

                <div className="hero-loot-card">
                  <div className="hero-loot-head">
                    <span className="mono-num">8× Steam Games</span>
                    <span className="mono-num">$400.00</span>
                  </div>
                  <div className="hero-steam-mini">
                    <Image
                      src="/images/hoard/steam-scifi.jpg"
                      alt="Steam sci-fi game artwork"
                      width={64}
                      height={80}
                      className="hero-steam-img"
                    />
                    <Image
                      src="/images/hoard/steam-fantasy.jpg"
                      alt="Steam fantasy game artwork"
                      width={64}
                      height={80}
                      className="hero-steam-img"
                    />
                    <Image
                      src="/images/hoard/steam-racing.jpg"
                      alt="Steam racing game artwork"
                      width={64}
                      height={80}
                      className="hero-steam-img"
                    />
                    <Image
                      src="/images/hoard/steam-cozy.jpg"
                      alt="Steam cozy game artwork"
                      width={64}
                      height={80}
                      className="hero-steam-img"
                    />
                  </div>
                </div>
              </div>
            </div>
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
            150× Visualized
          </div>
          <h3 style={{ fontSize: "1.1rem", marginTop: 8 }}>
            Make Micro-Spends Tangible
          </h3>
          <p style={{ fontSize: "0.9rem", color: "var(--ink-secondary)", marginTop: 6 }}>
            When \$1.50 taps or \$59 game downloads turn into literal stacked hot
            dogs and game cases under your avatar, spending clicks instantly.
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
                Give every take-home dollar a job. Watch your Purchase Hoard
                grow only inside planned caps instead of accidental debt.
              </p>
            </div>
            <div>
              <BellRing size={22} color="#1B4D3E" />
              <h3 style={{ fontSize: "1.12rem", marginTop: 10 }}>
                3. Instant Push Coaching
              </h3>
              <p style={{ fontSize: "0.9rem", color: "var(--ink-secondary)", marginTop: 6 }}>
                Every Plaid webhook or simulated swipe triggers a Web Push alert
                with envelope status, work-hours cost, and adds items to your Hoard.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
