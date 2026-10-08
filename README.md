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

It reads the business and its newest completed audit's design brief straight from the leads Supabase, crawls the business's website to fill the rest (the intake), then builds and deploys that lead and points `<subdomain>.demos.rapidforge.ai` at it (the deploy). `--as` defaults to the business name's first DNS-safe word, e.g. `allplumbing` for "All Plumbing & Sewer". `--edit` and `--skip-previews` pass through to the deploy.

If the lead has no design brief yet, it stops at once: open the lead in RapidForge Leads, Design Brief tab, click Design brief, then rerun.

All progress goes to stderr. The last line on stdout is the result as one JSON object, for the leads worker:

```
{"ok":true,"businessId":"…","slug":"…","sub":"…","previewUrl":"https://….vercel.app","aliasUrl":"https://<sub>.demos.rapidforge.ai","aliasOk":true,"durationMs":123456}
{"ok":false,"stage":"brief|intake|build|previews|deploy|alias","error":"…"}
```

A failure exits 1. A failed alias is not a failure: the deployment is live at `previewUrl` (login-protected) either way, so it reports `"aliasOk":false`.

It needs two keys in `.env` (see `.env.example`), and a one-time `npx vercel login`:

- `LEADS_SUPABASE_URL`: the leads app's Supabase project URL
- `LEADS_SUPABASE_SERVICE_ROLE_KEY`: that project's service-role key; local only, never pushed

## Live tweaks with webedit

Deploy a lead with the webedit hook switched on:

```
npm run demo -- --lead <businessId> --edit
```

Then open the alias in webedit's Viewer with `?edit` on a variant path, e.g. `https://<sub>.demos.rapidforge.ai/cleanpro?edit`. The page loads `webedit-connect.js` only when it was built with `--edit`, is framed, and has `?edit`, and it talks only to webedit on `localhost:5173`/`5174` (or the origins in `VITE_WEBEDIT_ORIGINS`). Without `--edit`, the script never loads.

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

Then deploy an intaken lead by its slug:

```
npm run deploy -- --slug <lead slug> [--as <subdomain>] [--edit] [--skip-previews] [--check-only]
```

`--check-only` runs only the leak scan against the build already in `.vercel/output`.
