"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Bell,
  BookOpen,
  CreditCard,
  LayoutDashboard,
  LogOut,
  CheckCheck,
} from "lucide-react";
import { useEffect, useState } from "react";

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  severity: string;
  readAt: string | null;
  createdAt: string;
}

export function Navbar({
  user,
}: {
  user: { name?: string | null; email?: string | null } | null;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetch("/api/notifications")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.notifications) {
          setNotifications(data.notifications);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user, pathname]);

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readAt: new Date().toISOString() }))
    );
  }

  const navItems = [
    { href: "/dashboard", label: "Budget", icon: LayoutDashboard },
    { href: "/academy", label: "Spending Science", icon: BookOpen },
    { href: "/cards", label: "Cards & Alerts", icon: CreditCard },
  ];

  return (
    <>
      <header className="nav-shell">
        <div className="container nav-inner">
          <Link href="/" className="brand-mark">
            <Image
              src="/icons/icon-192.png"
              alt="Tallywise"
              width={34}
              height={34}
              className="brand-icon"
            />
            <span>Tallywise</span>
          </Link>

          <nav className="nav-links" aria-label="Main navigation">
            {user ? (
              navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-link ${isActive ? "active" : ""}`}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                  >
                    <Icon size={15} />
                    {item.label}
                  </Link>
                );
              })
            ) : (
              <>
                <Link
                  href="/academy"
                  className={`nav-link ${pathname === "/academy" ? "active" : ""}`}
                >
                  Spending Science
                </Link>
                <Link
                  href="/login"
                  className={`nav-link ${pathname === "/login" ? "active" : ""}`}
                >
                  Sign In
                </Link>
              </>
            )}
          </nav>

          <div className="nav-actions">
            {user ? (
              <>
                <button
                  type="button"
                  className="bell-btn"
                  aria-label="Notifications"
                  onClick={() => setDrawerOpen((prev) => !prev)}
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="bell-badge">{unreadCount}</span>
                  )}
                </button>

                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  title="Sign out"
                >
                  <LogOut size={15} />
                  <span style={{ maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {user.name || "Sign out"}
                  </span>
                </button>

                {drawerOpen && (
                  <div className="notif-popover">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 12,
                      }}
                    >
                      <strong style={{ fontSize: "0.92rem" }}>
                        Purchase Alerts
                      </strong>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={markAllRead}
                        >
                          <CheckCheck size={14} /> Mark read
                        </button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)" }}>
                        No purchase alerts yet. Simulate a swipe or sync Plaid to see real-time coaching.
                      </p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {notifications.map((n) => (
                          <div
                            key={n.id}
                            style={{
                              padding: "10px 12px",
                              borderRadius: 10,
                              background: n.readAt ? "var(--bg-ivory)" : "var(--bg-emerald-tint)",
                              border: "1px solid var(--border-sand)",
                            }}
                          >
                            <div style={{ fontWeight: 700, fontSize: "0.84rem" }}>
                              {n.title}
                            </div>
                            <div
                              style={{
                                fontSize: "0.8rem",
                                color: "var(--ink-secondary)",
                                marginTop: 3,
                              }}
                            >
                              {n.body}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <Link href="/register" className="btn btn-primary btn-sm">
                Start Budgeting
              </Link>
            )}
          </div>
        </div>
      </header>

      {user && (
        <nav className="mobile-nav-bar" aria-label="Mobile navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${isActive ? "active" : ""}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  fontSize: "0.74rem",
                  padding: "6px 12px",
                }}
              >
                <Icon size={17} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </>
  );
}
