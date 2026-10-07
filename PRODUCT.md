# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary (inferred from the brief fixtures and RFD.PRESETS.2b/2c prompts): a homeowner with a plumbing, HVAC, or electrical problem, usually urgent, usually on a phone, deciding within seconds whether to call this contractor. Secondary (confirmed by the repo purpose): the contractor who owns the business, reviewing five demo directions on the picker page during RapidForgeAI outreach.

## Product Purpose

A brief-driven demo-site generator. One `DesignBrief` JSON (business name, vertical, services, reviews, hours, phone, address, primary CTA) renders a picker page plus five complete one-page sites, one per visual direction, so a prospect can see their own business on a finished site before buying. Success is a homeowner who would call, and an owner who picks a direction.

## Positioning

Every site is built from the prospect's real audit data (verbatim reviews, real hours, real phone) rather than lorem ipsum, and every direction is a working mobile-first page, not a mockup. Inferred: no neighboring agency demo can show five finished directions on the prospect's own content in one link.

## Operating Context

Vite + React + TypeScript single-page app. Routes: `/` picker, `/heritage`, `/geospatial`, `/cleanpro`, `/texas`, `/aerial`. Content comes from `src/brief/fixtures/*.json` through `toSiteContent`: `VITE_BRIEF` picks the default at build time, and a `?brief=<fixture>` query picks another at run time (the picker's Residential / Commercial toggle swaps `acme-plumbing` and `acme-commercial` this way). Screenshot gate `scripts/shots.mjs` captures every route at 1280×800 and 390×844 and enforces no horizontal overflow at 390 plus a fold check. Work ships one brick per PR under `CLAUDE.md` discipline.

## Capabilities and Constraints

- Section order per site: utility bar, nav, hero, offers (residential only), badge row (under or inside the hero), services, service areas (residential) or "Who we work with" (commercial), reviews, hours and location, quote band, footer. Every section the brief has no data for is hidden.
- A brief's `segment` sets the mode. Commercial and new-construction briefs get "Request a bid", a subhead that names the audience, audience tiles, and no offers. The modern-minimal preset leans commercial: on a residential brief it speaks in a jobsite register without claiming commercial clients; on a mixed brief it alone takes the commercial switch.
- Copy is template-generated in contractor voice (`src/brief/copy.ts`); headlines are eight words or fewer; templates never invent a year, license number, or price. Years, license numbers, ratings, stats, offers and towns appear only when the brief carries them.
- Trust proof: badges render as marks (BBB shield, license seal, award ribbon, rating with count) and stats as big-number tiles; without either, the strip falls back to "Licensed & insured", "Same-day service", "Upfront pricing", and "Serving {city}".
- Photos: brief `crew_photo_urls` lead the hero when present; otherwise `photo_urls`, else free Unsplash trade photos from `src/brief/trade-photos.ts`. No desaturating or grayscale filters; darkened heroes (bold-local, modern-minimal, clean-trust) use a gradient grade deepest behind the copy so text keeps at least 4.5:1.
- Headline, CTA, phone, and the top of the services section must sit above the fold at 1280×800 and 390×844.
- Sparse briefs (no phone, reviews, hours, address, or any RFD.PRESETS.5 field) must render cleanly.
- Region names come from brief data only; none is written into `src/components` or `src/variants`.
- Fonts are self-hosted through `@fontsource` packages.

## Brand Commitments

None for the prospects: each site is generic until a brief names the business. Since RFD.PRESETS.5 the five directions come from the plumbing taste vault (`vaults/plumbing.json`, `vaults/REPORT.md`): clean-trust is F4 Mountain Blue Heritage, bold-local F1 Red Banner Plumbers, friendly-family F3 Royal Blue Fleet, modern-minimal F2 Jobsite Red Commercial; premium-dark keeps its UI/UX Pro Max dark/gold direction as the one deliberate departure (no vault family is dark).

## Evidence on Hand

- `src/brief/fixtures/acme-plumbing.json` (full residential brief: 6 services, 3 reviews, hours, phone, address, towns, badges, stats, offers, crew photos), `acme-commercial.json` (the same company's commercial brief) and `sparse-electric.json` (minimal brief). Acme's license number, awards, stats and offers are fictional fixture data, not claims about a real business.
- 44 verified Unsplash photos (hero, detail and crew sets per trade) with credits in `src/brief/photos-credits.md`.
- No real customer logos or certifications exist; marks are drawn as plain inline SVG, never third-party logos.

## Product Principles

1. The phone number is the product: click-to-call is visible in the first viewport on every direction.
2. Real data only; a missing fact renders as absence, never as a placeholder claim.
3. Five directions must be distinct to a business owner at a glance, not to a designer on inspection.
4. A homeowner on a phone decides in seconds; the fold carries the whole decision.
5. Every direction is a finished page, not a style sample.

## Accessibility & Inclusion

Text contrast at least 4.5:1, visible keyboard focus, reduced-motion respected, 44px touch targets on calls to action.
