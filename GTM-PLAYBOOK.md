# ARC Report — Go-to-Market Playbook

**Date:** April 6, 2026
**Status:** Product live, zero paying customers, accuracy fixes shipped, paid features live.
**Goal:** First paying customer within 30 days.

---

## THE 30-DAY SPRINT

### Week 1: Establish Presence (Days 1-7)

**Social:**
- [ ] Post 1: Stats post on X + LinkedIn (see GTM-FIRST-POSTS.md)
- [ ] Post 2: Category comparison post (day 2)
- [ ] Post 3: Leaderboard post (day 4)
- [ ] Post 4: Notable brand change (day 6)
- [ ] Run `npx tsx scripts/generate-social-posts.ts` every 2-3 days for fresh content

**Content:**
- [ ] Write "State of Agentic Commerce Q2 2026" blog post using index data
  - Key angles: adoption rate of llms.txt, % blocking by category, brand size correlation
  - Embed matrix screenshots, link to live data
  - Publish on arcreport.ai/blog (need to create blog page)
- [ ] Pitch the report to 3 newsletters:
  - Practical Ecommerce
  - The Hustle / Morning Brew (commerce section)
  - AI-focused newsletters (Ben's Bites, The Neuron)

**Outbound:**
- [ ] Email 10 Shopify/e-commerce agencies with a free brand readout
  - Template: "Hey, we track AI agent access for [their client]. [Client] is [blocking/open]. Here's the readout: [link]. Want daily alerts across your portfolio?"
  - Use the brand pages as the hook — they're free and genuinely useful
- [ ] Find 5 AI agent companies (Operator, Comet, Buy For Me) and email their BD teams
  - "We track which brands your agent can actually reach. Want API access?"

### Week 2: Build Trust + Pipeline (Days 8-14)

**Social:**
- [ ] Continue 3x/week posting cadence
- [ ] Tag specific brands from leaderboard in posts
- [ ] Share any notable brand changes as they happen
- [ ] Respond to any engagement — this is where conversations start

**Outbound:**
- [ ] Follow up on week 1 emails
- [ ] Email 10 more agencies
- [ ] DM 5 "agentic commerce" / "AI shopping" people on X who seem engaged with the topic

**Product:**
- [ ] Add a /blog page for the Q2 report
- [ ] Monitor first subscriber signups — if someone signs up for the digest, email them personally
- [ ] Monitor any brand claim submissions — follow up within 24 hours

### Week 3: Convert Interest (Days 15-21)

**Focus: Turn leads into trials**
- [ ] Anyone who claimed a brand → personal email offering a walkthrough
- [ ] Anyone who subscribed to digest → personal reply when the first digest goes out
- [ ] Any agency that responded → offer a free 2-week Pro trial (manually set their plan in DB)
- [ ] Post the Q2 report and promote it hard (this is the anchor content)

### Week 4: Close (Days 22-30)

**Focus: First revenue**
- [ ] Follow up with all warm leads
- [ ] If no agency has converted: reduce Pro to $99/mo temporarily as a launch offer
- [ ] If someone converted: publish a case study (with permission) and double down on that channel
- [ ] Reassess: what's working? Where did the most engaged people come from?

---

## CHANNEL PRIORITIES (Ranked by Expected ROI)

1. **Direct outbound to agencies** — highest intent, they already buy BuiltWith-style tools
2. **LinkedIn posts** — right audience (ecom/AI professionals), good organic reach
3. **X/Twitter** — faster cycle, good for tagging brands and starting conversations
4. **Newsletter pitches** — one good feature = thousands of qualified eyeballs
5. **SEO** — long-term play, already set up (1,006 brand pages targeting "[brand] AI bot access")

---

## MESSAGING FRAMEWORK

**One-liner:** "Daily AI agent intelligence across 1,000+ e-commerce brands."

**For agencies:** "Track AI readiness across your client portfolio. Know when robots.txt changes before your clients do."

**For ecom operators:** "See if your competitors are blocking AI shopping agents — and whether you should too."

**For AI builders:** "Before you build an agent for a site, check if it'll actually let you in."

**The hook that works:** Data people can't get elsewhere. Nobody else scans 1,000+ brands daily for AI agent access. That's the moat.

---

## METRICS TO TRACK

| Metric | Week 1 | Week 2 | Week 3 | Week 4 |
|--------|--------|--------|--------|--------|
| Email subscribers | ? | ? | ? | ? |
| Brand claims | ? | ? | ? | ? |
| Registered accounts | ? | ? | ? | ? |
| Pro subscribers | 0 | ? | ? | 1+ |
| Social post impressions | ? | ? | ? | ? |
| Outbound emails sent | 10 | 20 | 30 | 30 |
| Outbound replies | ? | ? | ? | ? |

---

## TOOLS

- **Social content:** `npx tsx scripts/generate-social-posts.ts` — generates 5 post types from live data
- **Cleanup:** `npx tsx scripts/cleanup-cascade-entries.ts` — removes false changelog entries
- **Email alerts:** Automated daily at 4 AM UTC (watchlist) and weekly Sunday 10 AM UTC (digest)
- **Scan:** Automated daily at 2 AM UTC, can manually trigger via cron endpoint
