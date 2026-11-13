"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to register.");
        setLoading(false);
        return;
      }

      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInRes?.error) {
        router.push("/login");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1 style={{ fontSize: "1.8rem" }}>Create your real budget</h1>
        <p style={{ color: "var(--ink-secondary)", fontSize: "0.92rem", marginTop: 6 }}>
          Set up zero-based envelopes, Pay Yourself First savings, and instant card alerts.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 22 }}
        >
          <div className="field-group">
            <label className="field-label" htmlFor="reg-name">
              Your Name
            </label>
            <input
              id="reg-name"
              type="text"
              required
              className="field-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Rivera"
            />
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="reg-email">
              Email
            </label>
            <input
              id="reg-email"
              type="email"
              required
              className="field-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@example.com"
            />
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="reg-password">
              Password (min 8 characters)
            </label>
            <input
              id="reg-password"
              type="password"
              required
              minLength={8}
              className="field-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password"
            />
          </div>

          {error && <div className="banner-error">{error}</div>}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Creating account..." : "Start My Budget"}
          </button>
        </form>

        <p style={{ fontSize: "0.86rem", color: "var(--ink-secondary)", marginTop: 18, textAlign: "center" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "var(--emerald)", fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
