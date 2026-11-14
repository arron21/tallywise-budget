"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Sparkles } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get("demo") === "1";
  const [email, setEmail] = useState(isDemo ? "demo@tallywise.app" : "");
  const [password, setPassword] = useState(isDemo ? "demo1234" : "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submitCredentials(targetEmail: string, targetPassword: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await signIn("credentials", {
        email: targetEmail,
        password: targetPassword,
        redirect: false,
      });
      if (res?.error) {
        setError("Invalid email or password.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1 style={{ fontSize: "1.8rem" }}>Welcome back</h1>
        <p style={{ color: "var(--ink-secondary)", fontSize: "0.92rem", marginTop: 6 }}>
          Sign in to visit your avatar, inspect your loot pile, and drop new purchases.
        </p>

        <button
          type="button"
          className="btn btn-secondary"
          style={{ width: "100%", marginTop: 18 }}
          disabled={loading}
          onClick={() => submitCredentials("demo@tallywise.app", "demo1234")}
        >
          <Sparkles size={16} />
          1-Click Live Demo (Maya Lin&apos;s Hoard)
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            margin: "18px 0",
            color: "var(--ink-muted)",
            fontSize: "0.8rem",
          }}
        >
          <span style={{ flex: 1, height: 1, background: "var(--border-sand)" }} />
          <span>or sign in with email</span>
          <span style={{ flex: 1, height: 1, background: "var(--border-sand)" }} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitCredentials(email, password);
          }}
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          <div className="field-group">
            <label className="field-label" htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              required
              className="field-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="login-password">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              required
              className="field-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && <div className="banner-error">{error}</div>}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p style={{ fontSize: "0.86rem", color: "var(--ink-secondary)", marginTop: 18, textAlign: "center" }}>
          New to Tallywise?{" "}
          <Link href="/register" style={{ color: "var(--emerald)", fontWeight: 600 }}>
            Start your free Purchase Hoard
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="auth-wrap">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
