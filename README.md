# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## Demo for a lead

One command takes a business from the leads app to a deployed five-variant demo:

```
npm run demo -- --lead <businessId> [--as <subdomain>] [--edit] [--skip-previews]
```

It reads the business and its newest completed audit's design brief straight from the leads Supabase, crawls the business's website to fill the rest (the intake), then builds and deploys that lead and points `<subdomain>.demos.rapidforgeai.com` at it (the deploy). `--as` defaults to the subdomain recorded for the business (see below), else the business name up to its first symbol with the spaces taken out (`allplumbing` for "All Plumbing & Sewer"), else the slug; the run prints which one it used. `--edit` and `--skip-previews` pass through to the deploy.

If the lead has no design brief yet, it stops at once: open the lead in RapidForge Leads, Design Brief tab, click Design brief, then rerun.

All progress goes to stderr. The last line on stdout is the result as one JSON object, for the leads worker:

```
{"ok":true,"businessId":"…","slug":"…","sub":"…","previewUrl":"https://….vercel.app","aliasUrl":"https://<sub>.demos.rapidforgeai.com","aliasOk":true,"durationMs":123456,"dbRecorded":true}
{"ok":false,"stage":"brief|intake|build|previews|deploy|alias","error":"…","dbRecorded":true}
```

A failure exits 1. A failed alias is not a failure: the deployment is live at `previewUrl` (login-protected) either way, so it reports `"aliasOk":false`.

Every run records itself on the business row in the leads Supabase, the same columns the leads worker writes, so a demo built from the terminal shows in the leads app's Demo tab too. Once the business is read, `demo_status` is `building` (and `demo_error` cleared). On success it is `ready`, with `demo_sub`, `demo_url` (the alias URL), `demo_preview_url` and `demo_built_at`; on failure it is `failed`, with `demo_error` set to `<stage>: <message>` (at most 500 characters). Because `demo_sub` is read back as the default `--as`, the subdomain sticks: a rerun without `--as` lands on the URL already in use, and an `--as` run moves it. A failed write never changes the outcome: it is logged to stderr and the JSON says `"dbRecorded":false`. A run that stops before the business is read (bad arguments, unknown id) records nothing.

It needs two keys in `.env` (see `.env.example`), and a one-time `npx vercel login`:

- `LEADS_SUPABASE_URL`: the leads app's Supabase project URL
- `LEADS_SUPABASE_SERVICE_ROLE_KEY`: that project's service-role key; server-side only. `npm run env:push` copies both to Vercel so `/api/pick` can save picks to `demo_picks`

With `RESEND_API_KEY` and `PICK_TO_EMAIL` set, `/api/pick` also sends two plain-text emails per pick: first Joey's notice to `PICK_TO_EMAIL`, then, if the picker left a valid email, a confirmation to them naming the look and the business, with the page link and replies going to `PICK_TO_EMAIL`. Both come from `PICK_FROM_EMAIL` (blank means `onboarding@resend.dev`, which Resend delivers only to the account's own address, so confirmations need a verified sending domain). A failed confirmation is logged and changes nothing else. `npm run env:push` copies the three keys to Vercel (a blank one is skipped); redeploy after a change.

### Picker thumbnails

The picker's cards show screenshots of each look. The committed ones in `public/previews/<vertical>/` are of the Acme fixtures, so local dev on a lead (`VITE_BRIEF=lead-<slug> npm run dev`, with or without `?brief=lead-<slug>`) still shows Acme on every card. Only a deploy shoots a lead's own: its Previews step serves the lead's build, shoots each look at 1280x800 and 390x844, and writes the shots over the Acme copies in the build output (`public/previews/` is never touched). A shot at or over 300 KB fails the deploy.

`--skip-previews` (on `npm run demo` or `npm run deploy`) skips that step, so the deployed picker shows the Acme thumbnails too.

### Scroll Story look

A lead can carry a sixth look: a standalone scroll-driven page built with Nate Herk's [scroll-craft](https://github.com/nateherkai/scroll-craft) skill (plugin `nateherk-design`). The skill's workspace is `leads/scrollcraft/` (`.scrollcraft.json` at the repo root), so a lead's build lives at `leads/scrollcraft/builds/<slug>/` (`index.html`, `scrollcraft.js`, `scrollcraft.css`, `assets/`), gitignored with the rest of `leads/`. Building one per lead with the skill is the next brick; this one only publishes it.

`npm run demo` (and `npm run deploy`) publishes the build automatically when that folder has an `index.html`: the site is built with `VITE_SCROLL=1`, so the picker shows the "Scroll Story" card last, with its own "I like this" (variant `scroll`, preset `scroll-story`); the page and only what it references ship at `/scroll` (`index.html`, the engine, and the referenced files under `assets/` and `fonts/`; `BRIEF.md`, verify sheets and the like stay behind, and a reference the copy cannot satisfy fails the deploy); the Previews step shoots `/scroll/` into `scroll.jpg` and `scroll-mobile.jpg` under the same size gate; and the isolation scan covers it. `vercel.json` rewrites `/scroll` to the static page ahead of the React catch-all. Without the folder, nothing of it shows.

Every build also writes a `card.json` beside its `index.html`, for its picker card: `{ "description": "…", "swatches": ["#rrggbb", "#rrggbb", "#rrggbb", "#rrggbb"] }`. The description is one line of at most 140 characters that matches the page; the four swatches are read from the page's own CSS tokens, in the order the card shows them (the ground, a second tone, the accent, the ink). The deploy checks it before the build, builds with `VITE_SCROLL_CARD` set to it, and ships it at `/scroll/card.json`; the Scroll Story card then shows that blurb and those swatches instead of the defaults. A malformed `card.json` fails the deploy; a build without one keeps the default blurb and swatches.

`src/test/fixtures/scroll-min/` is a three-screen page on the real engine (MIT, scroll-craft at `75d81f7`) for the tests; copy it to `leads/scrollcraft/builds/<slug>/` to try the look locally or on a deploy.

## Live tweaks with webedit

Deploy a lead with the webedit hook switched on:

```
npm run demo -- --lead <businessId> --edit
```

Then open the alias in webedit's Viewer with `?edit` on a variant path, e.g. `https://<sub>.demos.rapidforgeai.com/cleanpro?edit`. The page loads `webedit-connect.js` only when it was built with `--edit`, is framed, and has `?edit`, and it talks only to webedit on `localhost:5173`/`5174` (or the origins in `VITE_WEBEDIT_ORIGINS`). Without `--edit`, the script never loads.

The edits are browser-only: nothing changes on the deployed site. What carries over is the brief webedit produces, which gets applied to the real variant.

## Advanced: intake and deploy separately

`npm run demo` is these two steps in one process. Run them yourself to intake a site without a leads-app business, to stop after the intake, or to redeploy a lead without crawling it again.

Turn a prospect's live site into a lead brief under `leads/<slug>/` (gitignored):

```
npm run intake -- --url https://prospect.com [--brief path/to/design-brief.json] [--slug name]
```

Or take the DesignBrief the leads app already made for a business, then crawl its site to fill the rest:

```
npm run intake -- --lead <businessId> [--url https://prospect.com] [--dry]
```

`--lead` reads the business and its newest completed audit's design brief straight from the leads Supabase, so the leads worker does not need to be running. `--url` is optional when the business has a website in the leads app, `--dry` stops after the read (it still writes `leads/<slug>/lead-api-brief.json`), and `--lead` can't be combined with `--brief`. The brief's photos are worker-only URLs, so the site's own photos are used instead.

Most leads have no website. When the business has no `website_url` and you pass no `--url`, intake runs brief-only: no fetch, extract, photos, vision or screenshot. The lead brief supplies everything as usual, the trade's stock photos (`src/brief/trade-photos.ts`) fill `photo_urls`, and `brand_colors`, `website_url` and `current_site` stay empty, so the preset palettes apply and the segment stays residential. The refine step still runs over the lead's own services and review text, and its wording of the services and tone replaces the lead's raw lists. The slug is the business name in kebab case ("Summit and Sage Plumbing LLC" gives `summit-and-sage-plumbing-llc`), the summary table is headed `no website — brief-only intake`, and `npm run demo -- --lead <businessId>` needs no extra flag. The picker shows "You don't have a website yet" in place of "Your site today", with no screenshots and no problem line.

Then deploy an intaken lead by its slug:

```
npm run deploy -- --slug <lead slug> [--as <subdomain>] [--edit] [--skip-previews] [--check-only]
```

`--check-only` runs only the leak scan against the build already in `.vercel/output`.

## Root page

`demos.rapidforgeai.com`, `rapidforge-demos.vercel.app` and every `*.demos.rapidforgeai.com` host without an alias serve the production deployment, which is `root-site/index.html`: one static page with no lead data, served for every path by `root-site/vercel.json`.
`npm run deploy:root` publishes it (`vercel deploy root-site --prod --yes`), first copying `.vercel/project.json` into `root-site/.vercel/` so the subfolder deploys to the same linked project.
Nothing else replaces it: lead deploys are preview deployments plus an alias and refuse `--prod`, and the root `vercel.json` turns off Git deployments of `main`, so a push deploys nothing.
