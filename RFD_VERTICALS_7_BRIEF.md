# RFD.VERTICALS.7 — HVAC and electrical presets from their vaults

## Goal
A brief with vertical "hvac" or "electrical" renders five looks derived from that trade's own vault, exactly as plumbing does today, with the picker and previews following the brief's vertical. Plumbing output is unchanged pixel-for-pixel (the existing previews prove it).

## Read first
vaults/REPORT.md, vaults/hvac.json and vaults/electrical.json (families F1–F4 each, with distilled brief blocks), src/presets/presets.json and presets.ts, RFD_PRESETS_5_BRIEF.md section 5 (how the plumbing presets were derived — repeat that method per vertical).

## Presets become per-vertical
- src/presets/presets.json becomes `{ "plumbing": Preset[5], "hvac": Preset[5], "electrical": Preset[5] }`. The plumbing array is today's file, byte-identical entries. Preset ids stay the same five across verticals (clean-trust, bold-local, premium-dark, friendly-family, modern-minimal) so VARIANT_PRESET and every variant component keep working.
- hvac and electrical: map each vault family to the preset id whose role it fills (the trustworthy one, the bold local one, the family one, the commercial-leaning one — pick by the family's aesthetic and house DNA, and say which went where in the report). `brief` = that family's distilled brief block verbatim; collection "rfd-vault:<vertical>", entryId "<vertical>/F<n>"; palette, type, heroTreatment and neverList from the family. premium-dark is shared: same object in all three verticals (keep it dark/gold; description already says it's the stand-out option).
- presets.ts: `presetForVariant(slug, vertical)` — resolve the vertical's array; a vertical with no presets falls back to plumbing (so a future "roofing" brief still renders). Every call site already has SiteContent in scope or one prop away; thread `site.vertical` through rather than reading a global. Keep `presets` exported as the plumbing array for existing tests, add `presetsFor(vertical)`.
- Fonts: each new family's type comes via @fontsource like the existing ones; add what the families need, remove nothing.

## Fixtures
- src/brief/fixtures/acme-hvac.json (residential, Meridian ID — "Acme Heating & Air") and acme-electric.json (residential, Boise — "Acme Electric"): same richness as acme-plumbing (8 service_areas, badges incl. license kind, stats, offers, founded_year, hours_note, crew_photo_urls from TRADE_PHOTOS hvac/electrical crew sets, review_quotes). sparse-electric.json stays as the sparse case.
- src/brief/current.ts: unchanged (globs fixtures).

## Previews and picker
- scripts/shots.mjs: screenshots go to public/previews/<vertical>/<slug>.jpg (and the phone shots likewise). Loop the three residential fixtures: acme-plumbing, acme-hvac, acme-electric. Move the existing plumbing jpgs into public/previews/plumbing/ (git mv) so plumbing's bytes don't change. Keep the width/fold/picker gates per fixture.
- src/presets/previews.ts and PickerPage: resolve preview paths by the current brief's vertical. Residential/Commercial toggle keeps swapping acme-plumbing ↔ acme-commercial only when the vertical is plumbing; for hvac/electrical the toggle is hidden (no commercial fixture yet).
- Card descriptions: per vertical, one line each in business-owner language, from the new presets.

## Styling pass
Load frontend-design before styling anything. Variants read palette/type from the preset, so most of the look should come free; where a variant hardcodes plumbing imagery or copy (grep for "plumb", "pipe", "drain", "water heater" in src/variants and src/components), route it through copy.ts / trade-photos.ts by family instead. Run /impeccable critique and audit on /heritage and /texas for acme-hvac and acme-electric; fix what it flags, record what you skipped and why.

## Tests
- presets.test.ts: each vertical has exactly five presets with the five ids; premium-dark deep-equals across verticals; presetsFor("roofing") returns plumbing; brief/palette/type non-empty per preset.
- fixtures: acme-hvac and acme-electric parse under DesignBriefSchema; toSiteContent gives vertical hvac/electrical, five+ services, crew photo set.
- previews: path resolution per vertical; plumbing paths equal the old ones with the vertical segment inserted.
- Variants: existing render tests run for all three residential fixtures (parametrize), not just acme-plumbing.
- 213 tests still pass; new ones added.

## Gate (CLAUDE.md) and report extras
typecheck, lint, test, build, `npm run shots` (all three fixtures), then confirm `git diff --stat -- public/previews/plumbing` shows renames only. Report: the family → preset mapping table for hvac and electrical with one line of reasoning each, the impeccable findings fixed/skipped, and both `VITE_BRIEF=acme-hvac npm run build` and `VITE_BRIEF=acme-electric npm run build` succeeding.

## Protected files
src/variants/variants.ts if touched (print diff). package.json only if a font dependency is added (print the dependencies diff). Branch rfd/verticals-7, PR to main titled "RFD.VERTICALS.7: HVAC and electrical presets from their vaults".
