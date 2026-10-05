# RFD.PRESETS.2 — five trade presets from the taste-vault

Work on this session's claude/ branch, open a PR to main. All 27 tests stay green. Nothing from webedit is copied into this repo except the brief text saved in presets.json.

## Source
Clone https://github.com/jcolley2019/webedit into ../webedit (read-only). The vault is at ../webedit/taste-vault/data/gallery.json: {meta, dna, collections[7], entries[28]}. A copy-brief block is produced by briefFor(entryId) in ../webedit/taste-vault/index.html (~line 369) and src/lib/tasteBrief.ts. Read both; reproduce the block for each entry you choose by running the same logic (node script or by hand), do not paraphrase.

## Pick five
From the 7 collections pick the five best suited to a residential home-services trade (plumber/HVAC/electrician) — the customer is a homeowner with a problem, mobile, wants to call or book now. Reject collections whose vocabulary is editorial, luxury, SaaS, or portfolio-only. For each chosen collection pick its single best entry. Save the five as src/presets/presets.json: [{id (kebab), name (2 words, prospect-facing), collection, entryId, brief (verbatim block), palette {bg, surface, text, muted, accent, accent2}, type {display, body, source: "fontsource" | "system"}, heroTreatment (1 line), neverList string[]}]. Add src/presets/presets.test.ts: five entries, ids unique, every palette hex valid, brief contains "Aesthetic:" and "Never:".

## Rebuild the five variants, one per preset
Keep the five variant folders and their registration in src/variants/variants.ts (protected — the prompt names it, so you may change label/description/order but not the slug set: heritage, geospatial, cleanpro, texas, aerial). Each variant maps to one preset in order of best fit; record the mapping as a comment in variants.ts.
For each variant:
- Rewrite its CSS from its preset's palette, type, and vocabulary. Fonts via @fontsource (install what's needed; remove fonts no preset uses).
- Remove all survey/map visuals: topographic contour SVGs, PlaceholderImage's contour pattern, coordinate/locality tags (localityTag.ts, the "32.6866° N" style strip), "LiDAR"/"drone"/"North Texas"/"50 years" wording, Ticks, ParallaxLayer and AltitudeInterlude unless re-skinned to the preset's vocabulary.
- Hero: full-bleed image slot. If siteContent has photos (add photos: string[] to SiteContent from brief.photo_urls), use the first; else render a per-preset CSS/SVG placeholder in the preset's palette (gradient, grain, geometric — no contour lines). Headline/subhead/CTA on top, typography placed per the preset's heroTreatment.
- Sections stay: nav, hero, services, reviews (hidden when empty), hours/contact (hidden when all null), quote CTA (#quote), footer. Mobile-first: at 390px wide nothing overflows, CTA and phone visible above the fold.
- Honor the preset's neverList (e.g. if it says no icon-grid feature rows, services can't be an icon grid).

## Picker
src/PickerPage.tsx: cards show preset.name, a one-line description written from the preset's "Aesthetic:" line (not the old B&C blurbs), and four palette swatches from presets.json. Title stays `${site.name} — five design directions`. Remove the coordinate strip.

## PlaceholderImage
Keep the component API, replace the contour drawing with a neutral soft-gradient block that takes a palette prop; no variant may import contour code.

## Gate
- npm run typecheck && npm test && npm run build green; test count ≥ 32.
- grep -rniE "contour|topograph|lidar|drone|north texas|50 years|survey|fort worth|32\.68" src/ returns nothing.
- Playwright (install as dev dep, chromium only): script scripts/shots.mjs that starts vite preview, screenshots / and each of the 5 variant routes at 1280×800 and 390×844 into shots/ (gitignored), and fails if any page's document.scrollWidth > viewport width at 390. Run it; report the 12 files exist and the width check passed.
- Print src/presets/presets.json in full (new module) and src/variants/variants.ts (protected).
