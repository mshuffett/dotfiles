---
name: provider-research
description: Researches and ranks healthcare providers (therapists, doctors, specialists) from insurer directories. Use when the user wants to find the best provider from a large list, research clinicians, or rank therapists/doctors by fit criteria.
---

# Provider Research

Systematically scrape, research, and rank healthcare providers from an insurer directory against user-defined criteria.

## Workflow

### Phase 1: Scrape the Directory

Use `agent-browser` to extract structured data from the provider directory.

1. Navigate to the directory listing page
2. Snapshot interactive elements, paginate through all results
3. For each provider, extract: name, credentials, location, specialties, bio, photo URL, profile link
4. Save to CSV with all columns populated

**Key pattern:** Directories often paginate or lazy-load. Scrape in batches, verify row counts match the directory total.

```bash
# Example: paginate through results
agent-browser open "<directory-url>"
agent-browser snapshot -i
# Click "next page" repeatedly, extracting table/card data each time
```

### Phase 2: Download Photos

Download provider photos in parallel for the final presentation.

```bash
# From CSV, extract photo URLs and download
mkdir -p photos/
# Use curl/wget in parallel batches of 10-20
```

### Phase 3: Score & Triage

Before deep research, do a quick scoring pass on all providers using only the directory data (bio, specialties, credentials):

- Score 0-10 against user criteria
- Skip providers who clearly don't fit (score < 4)
- Identify the pool worth deep-researching

### Phase 4: Parallel Batch Web Research

This is the most important phase. Use parallel subagents to research providers across the web.

**Batch size:** 10-15 providers per subagent (balances depth vs. context limits).

**Subagent prompt template:**
```
Research these [N] providers for [criteria]. For each:

1. Search Psychology Today, Healthgrades, Zocdoc, Vitals, LinkedIn, personal websites
2. Look for: specific modalities/training, patient reviews, years of experience,
   private practice details, published work, professional affiliations
3. Score each 1-10 against criteria: [list criteria]
4. Write a detailed profile (150-300 words) for anyone scoring 6+
5. For scores <6, write a one-line summary with score

Output as markdown with ## headers per provider.
```

**Launch pattern:** Use `learn-first-parallelize` — manually research 2-3 providers first to calibrate scoring, then launch all batches in parallel.

```
# Launch 5-8 research agents in parallel
Task(subagent_type="general-purpose", prompt="Research batch...", run_in_background=true)
```

**Sources to check per provider:**
- Psychology Today directory
- Healthgrades / Vitals / Zocdoc reviews
- Personal/practice website
- LinkedIn professional profile
- NPI database (verify credentials)
- Professional directories (EMDRIA, Gottman Referral Network, AAMFT, etc.)
- Google Scholar (for published research)

### Phase 5: Compile Rankings

After all research agents complete, compile into tiered rankings:

- **Tier 1 (8+):** Strongly recommended — detailed profiles with action steps
- **Tier 2 (7-7.9):** Good fit — profiles with caveats noted
- **Tier 3 (6-6.9):** Worth considering — summary table format

Include for each ranked provider:
- Score and rationale
- Modalities/approach
- Credentials and experience
- External links (personal site, directories)
- Logistics (location, telehealth, phone)
- Specific fit analysis for the user's criteria
- Action step (book consult, call KP, verify license, etc.)

End with:
- **Action plan** prioritized by ease of next step (free consultations first)
- **Research coverage table** showing how many providers were reviewed per batch

### Phase 6: Present

Create a single-page HTML presentation using the `frontend-design` skill:
- Provider cards with photos, scores, key details
- Tiered sections with visual differentiation
- Click-to-call phone links, external profile links
- Deploy to Vercel for easy sharing: `cd /tmp/<name> && vercel --yes --prod`

## Key Learnings

- **106 providers → 25 worth considering → 4 standouts** is a typical funnel
- Parallel research with 10-15 per batch hits the sweet spot — enough depth, manageable context
- The #1 find (Anna Keeffe, 9/10) was in batch C1 — not the obvious top candidates from directory data alone. Deep web research surfaces what bios miss.
- Always include an action plan with phone numbers and free consultation availability
- Patient reviews (Zocdoc, Grow Therapy) provide signal that credentials alone don't

## Acceptance Checks

- [ ] All providers from directory scraped into structured CSV
- [ ] Photos downloaded for providers with available images
- [ ] Every provider scored against user criteria
- [ ] All 6+ providers have detailed research profiles
- [ ] Final rankings organized in tiers with action plan
- [ ] HTML presentation created and deployed
