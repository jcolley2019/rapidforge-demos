# RFD.PRESETS.5 — vault-driven trade sites

Branch claude/rfd-presets-5, PR to main. 71 tests stay green. Read vaults/REPORT.md and vaults/plumbing.json first; every change below is justified by a count in that report.

## 1. Schema (src/brief/design-brief.ts — protected, named here; ADD ONLY, nothing existing changes)
Add optional fields:
- service_areas: string[] (max 24) — towns served
- badges: {label: string, kind: "bbb"|"license"|"award"|"dealer"|"association"|"rating"|"other", value?: string}[] (max 8)
- stats: {label: string, value: string}[] (max 4) — "Years in business" "40+", "Google reviews" "550+"
- offers: {title: string, detail: string, kind: "coupon"|"financing"|"special", expires?: string}[] (max 3)
- founded_year: number | null
- license_number: string | null
- crew_photo_urls: string[] (max 4) — owners, crew, branded vans; distinct from photo_urls
- segment: "residential"|"commercial"|"new_construction"|"mixed" (default "residential")
- hours_note: string | null — "24/7 emergency service"
All optional with defaults so every existing brief still parses. Update design-brief.test.ts: old fixtures parse unchanged; a brief with 25 service_areas fails.

## 2. Fixtures
- acme-plumbing.json: fill the new fields with realistic fictional Nampa data — 8 service_areas (Nampa, Caldwell, Meridian, Boise, Kuna, Star, Middleton, Eagle), badges (BBB A+, Idaho license "PLB-C-12345" as kind license, "Best of Treasure Valley 2025" award, rating 4.9 / 312), stats (Years 22, Reviews 300+, Licensed & insured), offers (coupon "$50 off any repair", financing "0% for 12 months"), founded_year 2004, license_number, hours_note "24/7 emergency service", 2 crew_photo_urls from TRADE_PHOTOS (add a crew/van category to trade-photos.ts: 3 verified Unsplash photos per family of people-with-trucks or crews at work), segment residential.
- sparse-electric.json: leave all new fields absent. This is the proof that every new section hides.
- Add acme-commercial.json: same company as a commercial/new-construction segment — segment "commercial", services for GCs and property managers, 2 stats, 1 badge, no offers, CTA "Request a bid" kind form.

## 3. SiteContent (src/brief/site-content.ts)
Map every new field through. trust chips now come from badges+stats when present (fallback to today's defaults). Add utilityLine: string | null built from hours_note + "Serving {first 3 service_areas} & more" when present.

## 4. Five sections, shared components in src/components/, every variant mounts them in its own CSS vocabulary
- UtilityBar (14/36): one line above the nav — utilityLine, Call link, Book/Request link. Hidden when utilityLine is null AND phone is null.
- BadgeRow (29/36): replaces the text-chip TrustStrip. Badges as marks (BBB shield, license seal, award ribbon, rating with count — simple inline SVG, no external logos), stats as big-number tiles. Hidden when badges and stats are both empty; falls back to today's chips when only the defaults exist.
- ServiceAreas (18/36): towns as chips with a pin icon, heading "Serving {city} and the Treasure Valley"-style from the data (no hardcoded region names — derive from service_areas). Hidden when empty.
- Offers (12/36, 8/12 HVAC): coupon-ticket style for kind coupon (dashed edge, perforation), card for financing/special. Hidden when empty. Place directly under the hero on residential; omit on commercial even if present.
- CrewHero: when crew_photo_urls is non-empty the hero uses crew_photo_urls[variantIndex % n] instead of the trade photo. Service tiles unchanged.
- Segment switch: when segment is commercial or new_construction — nav CTA "Request a bid", hero subhead names the audience (GCs, property managers, builders), Offers omitted, a "Who we work with" strip of 3–4 audience tiles replaces ServiceAreas' position. The acme-commercial fixture must render all five variants in this mode.

## 5. Re-derive the five presets from the plumbing vault
Read vaults/plumbing.json families (F1 Red Banner, F2 Jobsite Red Commercial, F3 Royal Blue Fleet, F4 Mountain Blue Heritage) and the three "borrow from" sites in REPORT.md. Rewrite src/presets/presets.json so the five presets are:
1. clean-trust → keep, but adopt F4's blue-with-license-marks feel
2. bold-local → F1 Red Banner Plumbers (white page, one saturated red, darkened photo hero, badge-led trust)
3. premium-dark → keep dark/gold, this is the one deliberate departure from the vault (no family is dark; it's the "look different from everyone in town" option — say so in its description)
4. friendly-family → F3 Royal Blue Fleet (royal blue panels, condensed caps, crew/van hero, card service grid) — it's the family-owned look the report describes for Goodson
5. modern-minimal → F2 Jobsite Red Commercial, and make this the preset that defaults to commercial-leaning copy
Each preset's brief field = the family's distilled brief block from plumbing.json verbatim (premium-dark keeps its UI UX Pro Max brief). Palettes and type come from the family; fonts via @fontsource; remove unused fonts. Load frontend-design before styling; run /impeccable critique and audit on all five after.

## 6. Picker
Card descriptions rewritten from the new presets, one line each, business-owner language. Add a small segment toggle at the top of the picker (Residential / Commercial) that swaps the fixture (VITE_BRIEF-style, at runtime via a module map, acme-plumbing ↔ acme-commercial) so the prospect sees both; regenerate previews for the residential set only.

## Gate
- typecheck, test, build, lint green; test count ≥ 85 (schema additions, each new component hides on sparse, commercial mode renders in all 5, crew hero chosen when present, BadgeRow fallback).
- npm run shots: width + fold checks pass; previews regenerated.
- grep -rniE "treasure valley|nampa|caldwell|boise" src/components src/variants returns nothing (region names must come from data).
- Print src/brief/design-brief.ts in full (protected).
