# RFD.DEPLOY.8 — one command: lead → live at <slug>.demos.rapidforge.ai, plus "I like this one"

## Goal
`npm run deploy -- --slug goodson` builds the five-variant site for an intaken lead on this machine and publishes it at https://goodson.demos.rapidforge.ai. The deploy contains that prospect's data and no other prospect's. Every variant page and the picker get an "I like this one" button that emails Joey the pick. Main's auto-deploy (Acme default) is unchanged.

## Why prebuilt
leads/, public/leads/ and src/brief/fixtures/lead-*.json are gitignored, so Vercel's build server can never see them. The deploy runs `vercel build` locally and ships the output with `vercel deploy --prebuilt`. Vercel facts already verified: project rapidforge-demos (prj_ibXIrTw2r2YjBhfykUaMnxTvGLee), team slug jcolley2019-1571s-projects; domains demos.rapidforge.ai and *.demos.rapidforge.ai are added to the project (DNS may still be propagating — see the gate); deployment protection is "all except custom domains", so aliases are public while *.vercel.app previews stay protected. That is what we want.

## Deploy CLI — src/deploy/cli.ts, script `"deploy": "tsx src/deploy/cli.ts"`
Add `vercel` as a devDependency (pinned, so `npx vercel` is deterministic). Steps, each printed as it runs:
1. Preflight: `vercel whoami` — if not logged in, print "Run `npx vercel login` once, then rerun" and exit 1. Require leads/<slug>/brief.json and src/brief/fixtures/lead-<slug>.json to exist (else print the `npm run intake` command to create them and exit 1). `--slug` is the intake slug; `--as <name>` overrides the subdomain (e.g. `--slug robgoodsonplumbing-com --as goodson`), validated as a DNS label (lowercase a-z0-9-, 1–40 chars).
2. `vercel link --yes --project rapidforge-demos --scope jcolley2019-1571s-projects` (writes .vercel/, already gitignored) then `vercel pull --yes --environment=preview`.
3. `vercel build` with env VITE_BRIEF=lead-<slug> (spawn with an env object; no cross-env, no shell string — this runs on Windows).
4. Isolation: the output must contain only this lead. The eager glob in src/brief/current.ts currently bundles every lead-*.json, so change it: Acme/sparse fixtures stay globbed; lead briefs load through a Vite virtual module (`virtual:lead-brief`) that vite.config.ts resolves to the one file named by VITE_BRIEF, or null when VITE_BRIEF isn't a lead. After `vercel build`, delete every .vercel/output/static/leads/<other>/ directory except this slug's. Then the gate: grep .vercel/output recursively for every other lead's business_name and slug (read them from leads/*/brief.json) — any hit aborts before deploy.
5. `vercel deploy --prebuilt --yes` → capture the deployment URL. Then `vercel alias set <url> <sub>.demos.rapidforge.ai`.
6. Print: deployment URL, alias URL, and a one-line reminder that the alias is public and the vercel.app URL is login-protected. Exit non-zero on any failed step.

## "I like this one" — api/pick.ts (Vercel Node function) + UI
- POST JSON { slug, business_name, preset_id, preset_name, variant_slug, page_url, name, email, phone, note, website } — `website` is a honeypot; non-empty → 200 and drop silently. Validate with zod; 400 on bad input; 405 on non-POST.
- Send via Resend REST (`fetch('https://api.resend.com/emails')`, bearer RESEND_API_KEY; no SDK). To PICK_TO_EMAIL, from PICK_FROM_EMAIL (default `onboarding@resend.dev`, which Resend only lets send to the account owner — fine for Joey). Subject: `[Demo pick] <business_name> likes <preset_name>`. Body: every field plus the alias URL. Return 200 {ok:true} or 502 with Resend's message.
- Env: append `RESEND_API_KEY=`, `PICK_TO_EMAIL=`, `PICK_FROM_EMAIL=onboarding@resend.dev` to .env (keep ANTHROPIC_API_KEY). Add script `"env:push": "tsx src/deploy/env-push.ts"` that reads those three from .env and runs `vercel env add <KEY> preview` and `… production` with the value on stdin (remove-then-add so reruns work). Joey fills .env, runs env:push once.
- vercel.json is protected: confirm the existing SPA rewrite does not swallow /api/* (Vercel matches functions before rewrites); if it does in practice, scope the rewrite to exclude /api and print the diff.
- UI: a floating "I like this one" button on every variant page (bottom-right, uses the preset's palette tokens so it belongs to each look; never overlaps the existing sticky call bar on phone) and a per-card "I like this" on the picker. Both open one shared modal (src/components/PickModal.tsx): name, email or phone (one required), optional note, hidden website field; posts to /api/pick; success state "Got it — Joey will be in touch." Pre-filled from SiteContent + presetForVariant. Load frontend-design before styling. Fold gates must still pass — run `npm run shots`.

## Tests (no network)
- api/pick: handler with injected fetch — 405, 400, honeypot drop, happy path builds the right Resend payload, 502 on Resend error.
- deploy: slug/`--as` validation; isolation check finds a planted other-lead name in a temp output dir; env spawning passes VITE_BRIEF.
- current.ts: Acme fixtures still resolve; `?brief=lead-x` resolves only when it's the built lead.
- PickModal: required-field logic, success state, honeypot hidden.
- 293 existing tests still pass.

## Gate and live verification
typecheck, lint, test, build, shots. Then the real thing: `npm run deploy -- --slug robgoodsonplumbing-com --as goodson`. Curl the deployment URL (expect Vercel's login page — protection working) and the alias. If the alias returns 200 with "Goodson" in the HTML, the DNS is live — report both URLs. If DNS isn't live yet (NXDOMAIN or Vercel's "domain not configured" page), do not fail: report the deployment URL, say the alias is pending DNS, and print the exact `vercel alias set` command so it can be rerun. POST a test pick to <alias or deployment>/api/pick with the honeypot filled (must 200 without emailing). Do not send a real email in the brick; Joey will click the button himself after env:push.

## Protected / report
vercel.json (print diff if changed), package.json (print scripts + devDependencies diff). Nothing under leads/, public/leads/ or .vercel/ is committed — `git status` before the final commit. Branch rfd/deploy-8, PR to main titled "RFD.DEPLOY.8: lead → live subdomain, plus I-like-this-one picks".
