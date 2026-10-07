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

## Live tweaks with webedit

Deploy a lead with the webedit hook switched on:

```
npm run deploy -- --slug <lead slug> --edit
```

Then open the alias in webedit's Viewer with `?edit` on a variant path, e.g. `https://<sub>.demos.rapidforge.ai/cleanpro?edit`. The page loads `webedit-connect.js` only when it was built with `--edit`, is framed, and has `?edit`, and it talks only to webedit on `localhost:5173`/`5174` (or the origins in `VITE_WEBEDIT_ORIGINS`). Without `--edit`, the script never loads.

The edits are browser-only: nothing changes on the deployed site. What carries over is the brief webedit produces, which gets applied to the real variant.

## Intake

Turn a prospect's live site into a lead brief under `leads/<slug>/` (gitignored):

```
npm run intake -- --url https://prospect.com [--brief path/to/design-brief.json] [--slug name]
```

Or take the DesignBrief the leads app already made for a business, then crawl its site to fill the rest:

```
npm run intake -- --lead <businessId> [--url https://prospect.com] [--dry]
```

`--lead` reads the business and its newest completed audit's design brief straight from the leads Supabase, so the leads worker does not need to be running. `--url` is optional when the business has a website in the leads app, `--dry` stops after the read (it still writes `leads/<slug>/lead-api-brief.json`), and `--lead` can't be combined with `--brief`. The brief's photos are worker-only URLs, so the site's own photos are used instead. It needs two keys in `.env` (see `.env.example`):

- `LEADS_SUPABASE_URL`: the leads app's Supabase project URL
- `LEADS_SUPABASE_SERVICE_ROLE_KEY`: that project's service-role key; local only, never pushed
