import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { ArrowRight, BellRing, Gamepad2, Sparkles, Trophy } from "lucide-react";
import {
  CharacterAvatarSvg,
  HotDogSpriteSvg,
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
              Visual Purchase Hoard × Playful Spend Loot
            </div>
            <h1 className="hero-title">
              Watch every dollar turn into a pile of stuff you actually bought.
            </h1>
            <p className="hero-subtitle">
              Skip the boring spreadsheets. Tallywise turns your card swipes
              into an interactive visual loot pile right beneath your custom
              avatar—whether that&apos;s <strong>150 Costco hot dogs</strong>,
              a <strong>Nintendo Switch 2</strong>, or{" "}
              <strong>$400 worth of Steam game artwork</strong>.
            </p>
            <div className="hero-cta-row">
              {session?.user ? (
                <Link href="/dashboard" className="btn btn-primary">
                  Open My Purchase Hoard <ArrowRight size={17} />
                </Link>
              ) : (
                <>
                  <Link href="/register" className="btn btn-primary">
                    Start Your Purchase Hoard <ArrowRight size={17} />
                  </Link>
                  <Link href="/login?demo=1" className="btn btn-secondary">
                    Play Live Demo Hoard
                  </Link>
                </>
              )}
            </div>
            <p style={{ fontSize: "0.84rem", color: "var(--ink-muted)" }}>
              Customizable Avatar · Collector Badges · Plaid Card Sync · Instant
              Drop Alerts
            </p>
          </div>

          {/* Interactive-style Visual Hoard Showcase */}
          <div className="hero-hoard-preview">
            <div className="hero-hoard-banner">
              <span>
                <Sparkles size={14} /> Sample Purchase Hoard
              </span>
              <span className="mono-num">159 items · $1,074.99</span>
            </div>

            <div className="hero-hoard-top">
              <div className="hero-hoard-avatar">
                <CharacterAvatarSvg style="explorer" color="#1B4D3E" size={88} />
                <span className="mono-num" style={{ fontSize: "0.78rem", fontWeight: 700 }}>
                  Maya’s Hoard
                </span>
              </div>
              <div className="hero-hoard-chest" style={{ flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
                <span className="hoard-level-pill mono-num">
                  <Trophy size={13} /> Level 10 Collector
                </span>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--ink-primary)" }}>
                  Unlocked Badges
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  <span className="hoard-badge-chip unlocked">Costco Glizzy Legend</span>
                  <span className="hoard-badge-chip unlocked">Switch 2 Owner</span>
                  <span className="hoard-badge-chip unlocked">Steam Shelf</span>
                </div>
              </div>
            </div>

            <div className="hero-hoard-loot">
              <div className="hero-loot-card">
                <div className="hero-loot-head">
                  <span className="mono-num">150× Costco Hot Dogs</span>
                  <span className="mono-num">$225.00</span>
                </div>
                <div className="hero-hotdog-grid" aria-label="36 sample hot dog icons representing 150 total">
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
              <Gamepad2 size={22} color="#1B4D3E" />
              <h3 style={{ fontSize: "1.12rem", marginTop: 10 }}>
                1. Build Your Avatar &amp; Pile
              </h3>
              <p style={{ fontSize: "0.9rem", color: "var(--ink-secondary)", marginTop: 6 }}>
                Customize your character persona and jacket color, then watch
                every purchase drop into piles of hot dogs, consoles, game art,
                and coffee cups underneath you.
              </p>
            </div>
            <div>
              <Trophy size={22} color="#1B4D3E" />
              <h3 style={{ fontSize: "1.12rem", marginTop: 10 }}>
                2. Level Up &amp; Unlock Badges
              </h3>
              <p style={{ fontSize: "0.9rem", color: "var(--ink-secondary)", marginTop: 6 }}>
                Hit milestones like 100+ Costco hot dogs, Next-Gen Switch 2
                Owner, or a $250+ Steam Shelf to level up your Collector rank
                and inspect every item in your hoard.
              </p>
            </div>
            <div>
              <BellRing size={22} color="#1B4D3E" />
              <h3 style={{ fontSize: "1.12rem", marginTop: 10 }}>
                3. Live Card Sync &amp; Drop Alerts
              </h3>
              <p style={{ fontSize: "0.9rem", color: "var(--ink-secondary)", marginTop: 6 }}>
                Connect credit cards with Plaid or tap 1-click loot drops to see
                instant Web Push notifications every time new items land in your
                hoard.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
