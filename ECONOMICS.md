# Robot Shopper — P&L at $30K MRR

*Goal: $15-20K/month take-home within 6 months*

---

## Revenue Model (Actual Prices)

| Tier | Price | Customers | MRR |
|------|-------|-----------|-----|
| Monitor | $99/mo | 120 | $11,880 |
| Team | $299/mo | 40 | $11,960 |
| Agency (new) | $599/mo | 10 | $5,990 |
| **Total** | | **170** | **$29,830** |

Fewer customers needed than the $79/$249 model. 170 vs 210.

---

## Monthly Costs at $30K MRR

### Infrastructure

| Item | Cost/mo | Notes |
|------|---------|-------|
| Railway hosting | $50-75 | App + volume (scales with traffic) |
| Domain | $2 | Annual domain / 12 |
| **Subtotal** | **~$75** | |

### API & Scanning Costs

| Item | Cost/mo | Notes |
|------|---------|-------|
| Anthropic API (Visual Agent) | $150-250 | ~500 brands x 4 screenshots/scan x weekly full + daily light |
| Anthropic API (Content Studio) | $10-20 | Text generation for social posts |
| **Subtotal** | **~$200** | With spend limit set on Railway |

*Scaling note: If we grow to 1,000 brands, visual agent costs ~$400-500/mo. Still manageable.*

### Payment Processing

| Item | Cost/mo | Notes |
|------|---------|-------|
| Stripe fees (2.9% + $0.30) | $918 | 2.9% of $30K = $870 + 170 transactions x $0.30 = $51 |
| **Subtotal** | **~$920** | |

### Marketing & Tools

| Item | Cost/mo | Notes |
|------|---------|-------|
| Email service (Resend/Loops) | $0-25 | Free tier covers <10K contacts |
| LinkedIn | $0 | Organic only |
| Outbound email tool | $0-50 | Free tier of Instantly/Lemlist or manual |
| Analytics (Plausible) | $9 | Privacy-friendly, simple |
| **Subtotal** | **~$50** | |

### Professional

| Item | Cost/mo | Notes |
|------|---------|-------|
| LLC/business filing | $10 | Annual cost amortized |
| Bookkeeping (Wave/Mercury) | $0-50 | Free tools or basic plan |
| Business bank account | $0 | Mercury, Relay = free |
| **Subtotal** | **~$30** | |

---

## The P&L

```
REVENUE                                    $30,000

COST OF REVENUE
  Stripe processing fees                    ($920)
  Anthropic API (scanning + content)        ($200)
  Railway hosting                            ($75)
                                          ────────
GROSS PROFIT                              $28,805
  Gross margin                              96.0%

OPERATING EXPENSES
  Marketing tools                            ($50)
  Domain + misc                              ($30)
  Analytics                                   ($9)
                                          ────────
OPERATING PROFIT (EBITDA)                 $28,716
  Operating margin                          95.7%

TAXES (self-employment, US)
  Self-employment tax (15.3%)             ($4,394)
  Federal income tax (~22% effective)     ($6,317)
  State income tax (~5% estimate)         ($1,436)
                                          ────────
TOTAL TAX                                ($12,147)
  Effective tax rate                        40.4%*

                                          ════════
NET TAKE-HOME                             $16,569
```

*\*Effective rate is high because self-employment tax hits the full amount. Can reduce significantly with S-Corp election (see below).*

---

## Take-Home Scenarios

| MRR | Gross Profit | After Tax | Take-Home |
|-----|-------------|-----------|-----------|
| $20,000 | $18,800 | ~$11,500 | $11,500/mo |
| $25,000 | $23,800 | ~$14,300 | $14,300/mo |
| **$30,000** | **$28,800** | **~$16,600** | **$16,600/mo** |
| $35,000 | $33,700 | ~$19,800 | $19,800/mo |
| $40,000 | $38,700 | ~$22,500 | $22,500/mo |

### To hit $20K take-home: need ~$35K MRR

That's roughly: 140 Monitor + 50 Team + 12 Agency = $35,690

---

## Tax Optimization: S-Corp Election

Once you're consistently above $30K MRR, file S-Corp election:

**How it works:**
- Pay yourself a "reasonable salary" (~$80K/year = $6,667/mo)
- Self-employment tax (15.3%) only applies to salary, not distributions
- Remaining profit passes through as distributions (no SE tax)

**Impact at $30K MRR:**

```
Without S-Corp:
  SE tax on full $28,716 = $4,394/mo

With S-Corp:
  SE tax on $6,667 salary = $1,020/mo
  Savings = $3,374/mo = $40,488/year
```

**Net take-home with S-Corp at $30K MRR: ~$19,900/mo**

That hits your $20K target at $30K MRR instead of needing $35K.

---

## What It Costs to Run (Monthly Summary)

| Category | Amount |
|----------|--------|
| Stripe fees | $920 |
| Anthropic API | $200 |
| Railway | $75 |
| Tools & misc | $90 |
| **Total operating cost** | **$1,285** |
| **As % of revenue** | **4.3%** |

**This is an extremely capital-efficient business.** Your costs are essentially Stripe's cut + a small API bill. No employees, no office, no inventory. The code runs itself (daily scans, content engine, Stripe webhooks).

---

## Breakeven & Unit Economics

| Metric | Value |
|--------|-------|
| Monthly fixed costs | ~$365 (hosting + tools + domain) |
| Variable cost per customer | ~$5.40 (Stripe fees per $100 avg revenue) |
| Breakeven customers | ~4 (yes, four) |
| LTV at 12-month avg retention | $1,188 (Monitor) / $3,588 (Team) |
| CAC target (3:1 LTV:CAC) | <$400 (Monitor) / <$1,200 (Team) |
| Current CAC | $0 (organic/content-driven) |

---

## Scaling Costs

The beauty of this model: costs barely grow with revenue.

| MRR | Customers | Hosting | API | Stripe | Total Cost | Margin |
|-----|-----------|---------|-----|--------|-----------|--------|
| $10K | 60 | $30 | $100 | $310 | $490 | 95.1% |
| $20K | 115 | $50 | $150 | $630 | $880 | 95.6% |
| $30K | 170 | $75 | $200 | $920 | $1,285 | 95.7% |
| $50K | 280 | $100 | $350 | $1,520 | $2,070 | 95.9% |
| $100K | 550 | $200 | $600 | $3,020 | $3,920 | 96.1% |

Margins actually *improve* as you scale because fixed costs (hosting, domain) get diluted.

---

## The Path: Month by Month

| Month | MRR | Customers | Take-Home (pre-tax) | Take-Home (after tax) |
|-------|-----|-----------|--------------------|-----------------------|
| 1 | $2,000 | 15 | $1,800 | $1,100 |
| 2 | $5,000 | 35 | $4,700 | $2,800 |
| 3 | $10,000 | 65 | $9,500 | $5,700 |
| 4 | $18,000 | 110 | $17,200 | $10,300 |
| 5 | $25,000 | 145 | $23,800 | $14,300 |
| 6 | $30,000 | 170 | $28,700 | $16,600* |

*With S-Corp election: ~$19,900*

---

## Bottom Line

At $30K MRR:
- **Without S-Corp:** ~$16,600/mo take-home
- **With S-Corp:** ~$19,900/mo take-home
- **Operating costs:** $1,285/mo (4.3% of revenue)
- **Customers needed:** 170
- **Breakeven:** 4 customers

To hit your $15-20K target, you need $28-35K MRR depending on tax structure. S-Corp election is the single biggest lever — saves $40K/year in self-employment tax.
