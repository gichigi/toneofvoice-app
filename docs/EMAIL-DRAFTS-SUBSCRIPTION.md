# Draft: Subscription & payment emails

Drafts for the 3 app-sent emails (Resend). Style matches existing thank-you / abandoned cart.

---

## 1. Subscription welcome

**When:** Right after `checkout.session.completed` with `mode === 'subscription'` (Pro or Agency).

**Subject:** You're in - welcome to Tone of Voice App [Pro/Agency]

**HTML body:**

```
Hey [First name],

You're all set. Your Tone of Voice App subscription is active.

What you get:
- [Pro: Save up to 2 Tone of Voice Guidelines to your account. Unlock all sections (Style Rules, Before/After, Word List), edit anytime, and export the full guide as PDF, Word, or Markdown.]
- [Agency: Save unlimited Tone of Voice Guidelines. Everything in Pro, plus white-label exports (no branding) and priority support.]

Head to your dashboard to create your first guideline or pick up where you left off.

[Dashboard button → https://toneofvoice.app/dashboard]

If you hit any snags, just reply to this email.

- The Tone of Voice App Team
```

**Notes:** Use `metadata.plan` (pro/agency) to pick bullet. First name from profile or "there".

---

## 2. Subscription cancelled

**When:** Webhook `customer.subscription.updated` with `cancel_at_period_end === true` (user just cancelled; they keep access until period end).

**Subject:** You cancelled your Tone of Voice App subscription

**HTML body:**

```
Hey [First name],

You've cancelled your Tone of Voice App subscription. You'll keep full access until [period end date]; after that you'll be on the Starter plan.

After your period ends:
- You can still view and export your existing guidelines (export is available on every plan). You won't be able to save new guidelines to your account.
- To unlock all sections again (Style Rules, Before/After, Word List) and save more guidelines, you'd need to resubscribe.

Changed your mind? You can resubscribe anytime from your billing page.

[Resubscribe button → https://toneofvoice.app/dashboard/billing]

If you cancelled by mistake or want to talk through options, reply to this email.

- The Tone of Voice App Team
```

---

## 3. Payment failed

**When:** Webhook `invoice.payment_failed`.

**Subject:** We couldn't charge your card - action needed

**HTML body:**

```
Hey [First name],

We tried to charge your card for your Tone of Voice App subscription but the payment didn't go through. This usually means an expired card, insufficient funds, or your bank blocked the charge.

Please update your payment method so your subscription stays active. If we don't get a successful payment soon, your access will switch to the Starter plan.

[Update payment method button → Stripe customer portal URL]

If you've already updated your card or want to cancel, you can manage everything here:

[Manage subscription → Stripe customer portal URL]

Questions? Reply to this email.

- The Tone of Voice App Team
```

**Notes:** Portal URL from Stripe (create-portal-session or Stripe API). Use same link for both CTAs if you only have one portal URL.
