# Robot Shopper — Launch Checklist

*What needs to happen before we accept real payments*

---

## CLAUDE FIXES (I'll do these now)

- [ ] **B1. Fix password hashing** — Switch from SHA-256 to PBKDF2 with 600K iterations (Web Crypto compatible)
- [ ] **B6. Fix unclaimBrand bug** — Adds missing `brandId` to WHERE clause (currently deletes ALL claims)
- [ ] **I2. Add sitemap.xml + robots.txt** — Dynamic generation from DB (276 brand pages = 276 SEO landing pages)
- [ ] **I3. Add page metadata** — Title/description on pricing, login, submit, compare, account pages
- [ ] **I4. Remove annual pricing toggle** — It doesn't work (no annual Stripe prices configured)
- [ ] **I6. Add rate limiting** — In-memory rate limiter on login/register endpoints
- [ ] **I7. Add security headers** — CSP, X-Frame-Options, X-Content-Type-Options in next.config
- [ ] **I11. Fix webhook error handling** — Return 500 on failure so Stripe retries

---

## YOUR TODO (env vars + external services)

### Do these in Railway Dashboard (Settings → Variables):

- [ ] **B2.** Set `ADMIN_PASSWORD` to something strong (16+ chars)
  ```
  openssl rand -base64 24
  ```
- [ ] **B4.** Set `CRON_SECRET` to a random string
  ```
  openssl rand -base64 32
  ```
- [ ] **B5.** Set `BASE_URL=https://arc-score-production.up.railway.app` (or your custom domain)
- [ ] **I1.** Set `ADMIN_SESSION_SECRET` to a random string
  ```
  openssl rand -base64 48
  ```
- [ ] **I1.** Set `CUSTOMER_SESSION_SECRET` to a random string
  ```
  openssl rand -base64 48
  ```
- [ ] **I10.** Verify `ANTHROPIC_API_KEY` is set (for visual agent scanning)

### Set up Stripe Webhook:

- [ ] **B3.** Go to Stripe Dashboard → Developers → Webhooks
- [ ] Create endpoint: `https://arc-score-production.up.railway.app/api/stripe/webhook`
- [ ] Events to listen for: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- [ ] Copy the signing secret (starts with `whsec_`)
- [ ] Set `STRIPE_WEBHOOK_SECRET` in Railway

### Set up Email (after launch is fine, but needed for password reset):

- [ ] **B7.** Sign up for [Resend](https://resend.com) (free: 100 emails/day)
- [ ] Add domain verification
- [ ] Set `RESEND_API_KEY` in Railway
- [ ] Tell me and I'll wire up: welcome email, password reset, score alerts

### Set up GitHub Secrets (for cron GitHub Actions):

- [ ] Set `CRON_SECRET` in repo → Settings → Secrets → Actions
- [ ] Same value as in Railway

---

## DECIDE (need your input)

- [ ] **I5. Final pricing:** Code says $99/$299. Memory says $79/$249. Pricing page shows $99/$299 monthly. Which is it?
- [ ] **Custom domain:** Do you have one? Want to set one up?
- [ ] **Agency tier:** Add $599/mo for 20 brands to pricing page?

---

## AFTER LAUNCH (nice to have)

- [ ] Error tracking (Sentry — free tier)
- [ ] Blog/content section for SEO
- [ ] Favicon + OpenGraph image for social shares
- [ ] Password reset flow (needs email first)
- [ ] Email notifications for new submissions
- [ ] Uptime monitoring (UptimeRobot — free)

---

## LAUNCH SEQUENCE

1. You do the env vars + Stripe webhook (30 min)
2. I fix all the code blockers (doing now)
3. Test the full customer flow: homepage → pricing → checkout → register → account → claim brand → view report
4. First LinkedIn post goes out (casual, not a "launch" — just sharing data)
5. Content Engine generates daily posts
6. Start outbound to low-scoring brands
