# RFD.VAULT.4 — per-vertical taste vault from real contractor sites

Branch claude/rfd-vault-4, PR to main. The variants, presets and picker do not change in this brick. 59 tests stay green. Output is research data plus a readable report.

## Why
Current presets come from a generic design system. Real local-trade sites that rank and convert have conventions a homeowner recognizes (trust bars, license badges, coupon blocks, service-area lists, big phone numbers, financing banners). This brick captures those conventions per vertical so the next preset brick builds from them.

## Verticals and segments
plumbing, hvac, electrical. For each, find 4 sites per segment: residential, commercial, new-construction (12 per vertical, 36 total). Use web search for "<city> plumber", "commercial plumbing contractor <city>", "new construction plumbing <city>" across 6–8 mid-size US metros (Boise, Spokane, Reno, Tucson, Omaha, Tulsa, Greenville, Fort Worth). Prefer independent local companies with their own site over franchises and lead-gen directories (reject Angi, Yelp, HomeAdvisor, Thumbtack, Networx pages). Prefer sites that look professionally built. Record the search query and rank position for each pick.

## Capture (scripts/vault-capture.mjs)
Playwright, chromium. For each site: desktop 1440×900 full-page PNG and mobile 390×844 full-page PNG into vaults/raw/<vertical>/<slug>/. Also save: final URL, <title>, meta description, every H1/H2 text, all tel: hrefs, all CTA button labels, the computed font-family of body and h1, the 6 most common computed background/text colours (hex), whether there is a sticky header, whether the phone number is visible in the first viewport at 390px, image count above the fold, and PageSpeed-style LCP from performance.timing. Write that as vaults/raw/<vertical>/<slug>/facts.json. Timeout 30s per site; skip and log failures. Respect robots.txt (skip disallowed).

## Ingest (scripts/vault-ingest.mjs)
For each captured site run a vision pass over the desktop screenshot using the Claude API (ANTHROPIC_API_KEY from env; model claude-sonnet-5-5; if the key is missing, STOP and say so — do not fake entries). Prompt it to return JSON with: aesthetic (one line), palette {bg, surface, text, accent, accent2}, typePairing {display, body, source guess}, sectionOrder [], heroTreatment, trustSignals [], ctaPattern, distinctiveMoves [] (max 4), weaknesses [] (max 3), segmentFit {residential|commercial|new_construction confidence}, vocabulary [] (8–12 words, the way webedit's taste-vault entries have vocabulary). Merge with facts.json into one entry per site.

## Distill (scripts/vault-distill.mjs)
Per vertical, cluster the 12 entries into 4–6 aesthetic families (by palette/type/hero treatment similarity; a simple heuristic is fine). For each family write a copy-brief block in the same shape as webedit's briefFor() output (Aesthetic / Vocabulary / Reference feel / House DNA / Never / One risk / WORKFLOW Step 1 hero prompt / Step 2) so a later brick can feed it straight into a preset. Also compute per-vertical conventions: how many of 12 have a sticky phone, a trust bar, a coupon/financing block, a service-area list, a reviews widget, a booking form vs phone-first; the median CTA label; the most common palette hues. Write vaults/<vertical>.json: {meta, conventions, families[], entries[]} and vaults/<vertical>-contact-sheet.jpg (12 desktop thumbnails in a grid, labelled, < 1.5 MB).

## Report file
Write vaults/REPORT.md, under 150 lines: per vertical, the conventions table, the families with one line each, the 3 sites you'd most want to borrow from and why, and 5 concrete things our five variants are missing compared to the real sites. This file is for Joey to read in the morning.

## Gate
- scripts run end to end with `node scripts/vault-capture.mjs && node scripts/vault-ingest.mjs && node scripts/vault-distill.mjs`; add "vault" to package.json scripts (protected; named here).
- ≥ 30 of 36 sites captured; every captured site has facts.json and an ingested entry; 3 vault JSONs and 3 contact sheets exist; REPORT.md exists.
- vaults/raw/ is gitignored (PNGs are large); vaults/*.json, *-contact-sheet.jpg and REPORT.md are committed.
- Add vaults/vaults.test.ts: each vertical JSON parses, has ≥ 10 entries, ≥ 4 families, every family brief contains "Aesthetic:" and "Never:". Test count ≥ 62.
- Existing typecheck/test/build/shots still green.
- Print vaults/REPORT.md in full at the end.
