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

Vite + React + TypeScript single-page app. Routes: `/` picker, `/heritage`, `/geospatial`, `/cleanpro`, `/texas`, `/aerial`. Content comes from `src/brief/fixtures/*.json` through `toSiteContent`. Screenshot gate `scripts/shots.mjs` captures every route at 1280×800 and 390×844 and enforces no horizontal overflow at 390 plus a fold check. Work ships one brick per PR under `CLAUDE.md` discipline.

## Capabilities and Constraints

- Section order is fixed per site: nav, hero, trust strip, services, reviews, hours and location, quote band, footer.
- Copy is template-generated in contractor voice (`src/brief/copy.ts`); headlines are eight words or fewer; nothing invents a year, license number, or price.
- Trust chips are limited to "Licensed & insured", "Same-day service", "Upfront pricing", and "Serving {city}".
- Photos: brief `photo_urls`, else free Unsplash trade photos from `src/brief/trade-photos.ts`; hero overlays stay at most 0.35 opacity with no desaturating or grayscale filters.
- Headline, CTA, phone, trust strip, and the top of the services section must sit above the fold at 1280×800 and 390×844.
- Sparse briefs (no phone, reviews, hours, or address) must render cleanly.
- Fonts are self-hosted through `@fontsource` packages.

## Brand Commitments

None for the prospects: each site is generic until a brief names the business. The five visual directions for RFD.PRESETS.2c were confirmed by the user from UI/UX Pro Max output: clean-trust, bold-local, premium-dark, friendly-family, modern-minimal.

## Evidence on Hand

- `src/brief/fixtures/acme-plumbing.json` (full brief: 6 services, 3 verbatim reviews, hours, phone, address) and `sparse-electric.json` (minimal brief).
- 32 verified Unsplash photos with credits in `src/brief/photos-credits.md`.
- No real customer logos, certifications, license numbers, or pricing exist; future work must not fabricate them.

## Product Principles

1. The phone number is the product: click-to-call is visible in the first viewport on every direction.
2. Real data only; a missing fact renders as absence, never as a placeholder claim.
3. Five directions must be distinct to a business owner at a glance, not to a designer on inspection.
4. A homeowner on a phone decides in seconds; the fold carries the whole decision.
5. Every direction is a finished page, not a style sample.

## Accessibility & Inclusion

Text contrast at least 4.5:1, visible keyboard focus, reduced-motion respected, 44px touch targets on calls to action.
