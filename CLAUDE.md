# rapidforge-demos

Brief-driven demo-site generator: a `DesignBrief` JSON (see `src/brief/design-brief.ts`) crossed with 5 visual variants (`src/variants/`) produces a picker page plus one demo site per variant, used for RapidForgeAI outreach to prospects. Seeded from the Brittain & Crawford bake-off, so the variants currently render B&C content; `src/content/content.ts` is the temporary content seam until RFD.LOADER.1 replaces it with brief-driven loading.

## Commands

```
npm run dev        # vite dev server
npm run build      # tsc -b && vite build
npm run typecheck  # tsc -b --noEmit
npm test           # vitest run
npm run lint       # oxlint
```

## Brick discipline

- One brick per prompt. The brick ID (e.g. `RFD.SCAFFOLD.0`) is line 1 of the prompt.
- Do only what the brick says. No drive-by refactors, renames, or "while I'm here" fixes.
- When blocked, stop and ask a numbered multiple-choice question. Do not guess.

## Git

- Work directly on `main`.
- Stage with explicit paths (`git add path/a path/b`). Never `git add -A` or `git add .`.
- Two-line commit message: line 1 is the brick ID as prefix, `RFD.AREA.N: title`; line 2 the files touched and the behavior change.
- One commit per brick, made only after the gate passes.
- Push to `origin main` without being asked.

## Protected files

Touch these only when the prompt names them:

- `CLAUDE.md`
- `src/brief/design-brief.ts`
- `src/variants/variants.ts`
- `vercel.json`
- `package.json` scripts

## Gate

Every brick must pass before commit:

```
npm run typecheck && npm test && npm run build
```

## REPORT

Under 60 lines, in this order:

1. **Outcome** — done/partial/blocked, commit hash, branch, PR URL.
2. **Spec departures** — each with a one-line reason, or "none".
3. **Verification table** — one row per gate step and per prompt check; pass/fail; test counts.
4. **git status** output.
5. **Notes** — up to three things worth knowing.

No code or diffs in the report unless the prompt names files to print.
