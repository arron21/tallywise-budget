# Tallywise — Mindful Credit Card Budgeting & Real Savings

Tallywise is a research-backed, zero-based envelope budgeting web app built for **Vercel** that syncs with real credit card usage via **Plaid**, locks aside cash in an automatic **Card Payment Reserve** on every swipe, and sends instant **Web Push** budget notifications so every card purchase feels as real as cash.

## Behavioral Economics Foundation

Tallywise is designed around peer-reviewed research on why credit cards and contactless wallets increase spending:

1. **The Anesthetized Pain of Paying** (*Zellermayer, 1996; Prelec & Loewenstein, Marketing Science 1998*) — Physical cash triggers brief emotional discomfort that regulates impulse spending; plastic removes that brake.
2. **The Credit Card Premium** (*Prelec & Simester, Marketing Letters 2001*) — Shoppers were willing to pay up to **2× more** in card vs. cash auctions and spent **12%–18% more** at supermarkets.
3. **Temporal Decoupling & Statement Shock** (*Soman, 2001*) — Delaying outflow by 30–45 days weakens expenditure recall. Tallywise's automatic **Card Payment Reserve** locks envelope cash aside the moment a purchase syncs.
4. **Contactless "Spendception"** (*Trütsch, 2014; DNB Working Paper No. 760; Zu et al., 2024*) — Contactless taps raise point-of-sale spending ratios by **+8% to +10%**. Tallywise counters micro-swipe blindness with instant push alerts showing remaining envelope balance, work-hours cost, and 10-year compounded opportunity cost.
5. **The Cashback Rewards Illusion** (*Feinberg, 1986*) — Chasing 2% cashback while overspending by 15% creates a net loss.

## Tech Stack

- **Framework:** Next.js App Router (TypeScript) + Vanilla CSS design tokens
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** Auth.js v5 (Credentials + optional Google OAuth)
- **Credit Card Sync:** Plaid Link + `/transactions/sync` + `/api/plaid/webhook` (`SYNC_UPDATES_AVAILABLE` with ES256 JWT verification) + built-in Live Purchase Simulator
- **Push Notifications:** Native Web Push API (Service Worker `public/sw.js` + VAPID via `web-push`) + PWA Manifest

## Local Development

```bash
cp .env.example .env
# Generate VAPID keys and AUTH_SECRET:
npx web-push generate-vapid-keys --json
openssl rand -base64 32

npx prisma generate
npx prisma db push
npm run dev
```

Demo account on `/login`: `demo@tallywise.app` / `demo1234` (1-click button on the login page).

## Deploying to Vercel

1. **Provision PostgreSQL** (Neon, Vercel Postgres, or Supabase) and copy `DATABASE_URL`.
2. **Import the GitHub repo in Vercel** and set these Environment Variables:
   - `DATABASE_URL`
   - `AUTH_SECRET` (`openssl rand -base64 32`)
   - `AUTH_URL` (`https://your-app.vercel.app`)
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` & `VAPID_PRIVATE_KEY` (`npx web-push generate-vapid-keys`)
   - `VAPID_SUBJECT` (`mailto:you@example.com`)
   - `PLAID_CLIENT_ID`, `PLAID_SECRET`, `PLAID_ENV` (`sandbox` or `production`)
   - `PLAID_WEBHOOK_URL` (`https://your-app.vercel.app/api/plaid/webhook`)
   - `TOKEN_ENCRYPTION_KEY` (32-byte secret to encrypt Plaid access tokens at rest)
3. **Push Prisma schema** to your production database once:
   ```bash
   DATABASE_URL="your-prod-postgres-url" npx prisma db push
   ```
4. **Install as PWA on Mobile (optional for iOS Push):** Open your Vercel URL on iOS Safari 16.4+, tap **Share → Add to Home Screen**, open from Home Screen, and tap **Enable Push Alerts on This Device** on `/cards`.
