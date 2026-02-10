# Create a Stripe restricted key (Dashboard only)

Stripe does **not** let you create restricted keys via CLI or API — only in the Dashboard. Use this checklist so you only do it once.

## 1. Open the right page

- Live: https://dashboard.stripe.com/apikeys  
- Click **“Create restricted key”** (under “Restricted keys”).

## 2. Name and expiry

- **Name:** e.g. `AISTyleGuide app (Vercel + local)`
- **Expiration:** e.g. 90 days (or whatever you prefer).

## 3. Permissions (enable only these)

Turn **everything** off, then turn on:

| Section            | Permission              | Access   |
|--------------------|-------------------------|----------|
| **Checkout**       | Sessions                | **Read** and **Write** |
| **Customers**      | Customers               | **Read** |
| **Subscriptions**  | Subscriptions           | **Read** |
| **Billing**        | Customer portal         | **Write** (or “Create”) |

Leave all other sections (Products, Payment Intents, etc.) **off**.

## 4. Create and copy

- Click **“Create key”**.
- Copy the key (starts with `rk_live_...`). You only see it once.

## 5. Use the new key

- In **`.env`**: set `STRIPE_SECRET_KEY=` to the new `rk_live_...` value (replace the current `sk_live_...`).
- In **Vercel**: Project → Settings → Environment variables → edit `STRIPE_SECRET_KEY` for Production (and Preview/Development if you use them) and paste the same value.

Redeploy so the new key is used. Your app only needs the four permissions above; no Products or other write access is required for checkout, portal, or verify-subscription.
