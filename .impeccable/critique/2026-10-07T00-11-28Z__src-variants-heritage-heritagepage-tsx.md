---
target: src/variants/heritage/HeritagePage.tsx
total_score: 21
max_score: 32
na_heuristics: 7,10
p0_count: 0
p1_count: 3
target_identity: "file:C:\\dev\\rapidforge-demos\\src\\variants\\heritage\\HeritagePage.tsx"
target_fingerprint: "sha256:17130ef26b948b59e08ebb69cb4771ff299fcbe1099c3b69503406da78771955"
target_path: "C:\\dev\\rapidforge-demos\\src\\variants\\heritage\\HeritagePage.tsx"
timestamp: 2026-10-07T00-11-28Z
slug: src-variants-heritage-heritagepage-tsx
---
Method: dual-agent (A: isolated design review of /heritage · B: isolated detector + browser pass over all five pages)

## Design Health Score
| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | 24/7 note only in the utility bar; Hours says Sunday Closed |
| 2 | Match System / Real World | 3 | Coupon, seal and since-line read real; tile photos assigned by position |
| 3 | User Control and Freedom | 3 | Book leaves the site without warning |
| 4 | Consistency and Standards | 3 | Inert service tiles light up on hover |
| 5 | Error Prevention | 2 | Contradictory hours; thin fold margin |
| 6 | Recognition Rather Than Recall | 3 | 24/7 must be remembered from a bar that scrolls away |
| 7 | Flexibility and Efficiency | n/a | One-page Persuade surface |
| 8 | Aesthetic and Minimalist Design | 2 | Proof band repeats itself (312 vs 300+, license three times) |
| 9 | Error Recovery | 3 | Sparse footer says "Call for current hours" with no phone |
| 10 | Help and Documentation | n/a | The phone is the help |
| **Total** | | **21/32** | Acceptable (66%) |

## Design Specificity Verdict
Wears F4 (navy, pills, uppercase H2s, Cormorant since-line, dashed coupon, hand-drawn underline) but does not yet own it: the hero shares crew[0] with /aerial and /cleanpro by the CrewHero rule, and the mountain device is a thin, uniform zigzag. Detector: 11 overused-font hits (Montserrat and Open Sans, both brief-specified) and one border-accent-on-rounded (.ww-tile, commercial only).

## Priority Issues
- [P1] 24/7 vs "Closed": hours_note shows only in the utility bar. Fix: show it above the hours table and in the footer; drop the towns from the phone utility line. (clarify)
- [P1] Proof band repeats itself and BBB leads instead of the license seal. Fix: license first, a legible license number, quieter non-numeric stats. (distill)
- [P1] F4 signature is thin: uniform ridge, heavy mobile wash. Fix: a real summit silhouette echoed on the quote band, and a lighter mobile grade. (bolder)
- [P2] Inert service tiles carry a hover affordance. (clarify)
- [P2] Mobile edge cases: the offers row snaps flush to the edge, long names truncate, 47px of fold headroom. (harden)

## Persona Red Flags
- Jordan: Book three times and Call three times with no hint which is faster; town chips look tappable.
- Riley: 312 vs 300+ reviews; the same-day promise vs the scheduling review; 24/7 vs Closed.
- Casey: actions only at the top; footer links 20px tall; the All concepts chip covers the quote-band number.

## Minor Observations
The commercial band leaves a ~690px gap between one mark and the stats; the .ww-tile top rule curls around 14px corners; screen readers hear the rating twice; the quote band repeats the hero subhead.

## Questions to Consider
- Why is Call the outlined pill when the vault says the call is the primary conversion?
- Would one oversized license seal earn more trust than a seven-item strip?
