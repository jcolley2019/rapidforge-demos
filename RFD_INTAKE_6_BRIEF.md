# RFD.INTAKE.6 — Lead intake: real business in, filled brief + current-site card out

## Goal
One command turns a prospect into a renderable lead: `npm run intake -- --url https://prospect.com [--brief path/to/design-brief.json] [--slug name]`. It reads the prospect's current site (and the leads DesignBrief when given), extracts the real logo, brand colors, photos, services, hours, phone, license, reviews, service areas, founded year, detects segment, and writes a validated DesignBrief the app renders in all five variants via `VITE_BRIEF=lead-<slug>` or `?brief=lead-<slug>`. The picker shows a "Your site today" card above the five options when the brief carries current-site screenshots. Lead data is per-prospect and gitignored; nothing from one prospect can leak into another.

## Where things go
- Code: `src/intake/` (TypeScript, app code — not a scripts/*.mjs). Entry `src/intake/cli.ts`; run with `tsx` (add as devDependency) via the new script `"intake": "tsx src/intake/cli.ts"`. package.json scripts are protected — this is the one line you add; print the scripts block in the report.
- Output per lead: `leads/<slug>/` containing `brief.json`, `intake-report.md` (what was found / inferred / missing, one line per field), `photos/NN.jpg`, `logo.<ext>`, `current-desktop.jpg`, `current-mobile.jpg`. Then copy for the app: brief → `src/brief/fixtures/lead-<slug>.json`, photos/logo/screenshots → `public/leads/<slug>/`, with the brief's URLs rewritten to `/leads/<slug>/...`. Gitignore `leads/`, `src/brief/fixtures/lead-*.json`, `public/leads/`. `src/brief/current.ts` already globs fixtures, so no change there.
- AI calls go through `@rapidforge/ai-core` — add dependency `"@rapidforge/ai-core": "github:jcolley2019/rapidforge-ai-core#v0.9.0"`, then read its README and type declarations in node_modules before writing a call; do not use @anthropic-ai/sdk directly in src/intake. Key: ANTHROPIC_API_KEY from .env (already present; load with dotenv or Node's --env-file). Use the cheapest image-capable model ai-core exposes for photo tagging and Sonnet 5.5 for text extraction.

## Schema additions (src/brief/design-brief.ts is protected — print the full diff)
All optional with defaults so leads' existing briefs still parse:
- `website_url: string|null` (default null)
- `logo_url: string|null` (default null)
- `brand_colors: string[]` hex `#rrggbb`, max 4, default [] — primary first
- `current_site: { desktop_url: string, mobile_url: string, captured_at: string } | null` (default null)
Update the three Acme fixtures only if parsing requires it (it shouldn't).

## Pipeline (src/intake/*, one module per step, each a pure function where possible)
1. fetch.ts — fetch homepage; follow up to 5 same-host internal links whose path/text mentions about|services|contact|reviews|areas. Timeout 15s each, UA string identifying RapidForge. Keep raw HTML in memory only.
2. extract.ts — deterministic first: phone from tel: links then regex; hours from JSON-LD openingHours then text; license from `Lic(ense)?\.?\s*#?\s*[A-Z0-9-]+`; founded from `since (19|20)\d\d` / `est\. \d{4}`; reviews from JSON-LD Review/AggregateRating; service areas from text lists near "serving|service area"; services from nav + h2/h3 candidates; logo = img whose src/alt/class contains "logo", else og:image, else largest <link rel=icon>; brand colors = CSS custom props and most frequent non-neutral colors in inline <style> and linked same-host stylesheets (ignore white/black/grays), top 4 by frequency.
3. photos.ts — collect <img> and og:image URLs, same host or CDN, drop svg/gif/icons, dedupe by URL, download up to 20, keep those ≥ 600px on the long edge (use sharp), re-encode to jpg ≤ 1600px.
4. vision.ts — tag each kept photo via ai-core vision in one call per photo: `{kind: building|crew|van|job|logo|stock|other, quality: 1-5, note}`. Stock = obviously generic stock imagery. Map: crew/van → crew_photo_urls (max 4), building/job → photo_urls (max 8), ordered by quality; stock/other only if fewer than 3 real photos exist, and flag it in intake-report.md.
5. refine.ts — one Sonnet call with the extracted text + candidates: clean services to ≤ 12 real offerings, tone_descriptors (3–5), segment (residential|commercial|new_construction|mixed) with one-line reason, current_site_problem if no lead brief supplied, hours normalization. Structured output through ai-core; validate with zod; on failure fall back to deterministic values and log it.
6. screenshot.ts — Playwright (already installed): desktop 1440×900 and mobile 390×844, full page off, first viewport only, jpg quality 80.
7. merge.ts — precedence: lead brief value wins when non-empty; site-extracted fills nulls/empties; schema defaults last. Output passes DesignBriefSchema.parse before anything is written.
8. cli.ts — args, slug default = kebab of business_name (from brief) else hostname; prints a summary table of fields found/inferred/missing and the two run commands (`VITE_BRIEF=lead-<slug> npm run dev` and the ?brief= URL). Exit non-zero if the brief fails validation.

## App changes
- Variant headers: when `logo_url` is set, render the logo image (max-height ~40px, alt = business_name) in place of the text wordmark in all five variants; keep the text when null. `brand_colors` are stored only — do not restyle variants with them in this brick (that is a later, deliberate brick).
- Picker: new `CurrentSiteCard` above the five options when `current_site` is non-null — desktop screenshot large, mobile shot small beside it, heading "Your site today", the brief's `current_site_problem` as the caption, and a thin arrow/label "Five ways forward" leading into the grid. Hidden entirely when null, so the existing picker gate is unchanged.

## Tests (vitest, no network, no AI — inject a fake ai-core client)
- `tests/fixtures/intake/acme-site.html` — a synthetic contractor homepage you write, containing a tel: link, JSON-LD with openingHours and two Reviews, "Lic #PL-12345", "Since 1998", a nav of services, a "Serving Boise, Meridian, Nampa" paragraph, an <img class="logo">, a <style> with `--brand: #1d4ed8` used repeatedly, and three <img> photos.
- extract: each field above asserted; logo pick order; brand colors exclude neutrals.
- photos: size filter and dedupe (use in-memory buffers, no download).
- vision mapping: crew/van vs building/job vs stock fallback rules.
- merge: lead value beats site value; site fills null; result parses.
- CurrentSiteCard renders with current_site and renders nothing when null.
- Existing 131 tests still pass.

## Live verification (not committed)
Run the real pipeline once against one residential plumbing site from scripts/vault-sites.json (your pick; say which). Then `VITE_BRIEF=lead-<slug> npm run build` must succeed, and `npm run dev` must show the lead in /heritage and the picker with the current-site card (check one half-scale Playwright screenshot of each yourself; don't commit previews from a lead). Then run `npm run shots` on the default fixture so the committed previews stay Acme. Include in the report: the intake summary table, the photo tag table (kind/quality per photo), segment + reason, and the brand colors found.

## Guardrails
- Never write a lead's files anywhere but `leads/<slug>/`, `public/leads/<slug>/`, `src/brief/fixtures/lead-<slug>.json`.
- No real business's assets committed. Confirm with `git status` before the final commit.
- Protected files touched: package.json (scripts: intake only), src/brief/design-brief.ts. Print both diffs in the report.
- Branch rfd/intake-6, PR to main titled "RFD.INTAKE.6: lead intake — real site → brief + current-site card".
