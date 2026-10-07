---
target: src/variants/geospatial/GeospatialPage.tsx
total_score: 19
max_score: 32
na_heuristics: 7,10
p0_count: 0
p1_count: 3
target_identity: "file:C:\\dev\\rapidforge-demos\\src\\variants\\geospatial\\GeospatialPage.tsx"
target_fingerprint: "sha256:335a189a453eeed72b12725fe4cf3712a36907692a99f9ba8489235043f60491"
target_path: "C:\\dev\\rapidforge-demos\\src\\variants\\geospatial\\GeospatialPage.tsx"
timestamp: 2026-10-07T00-11-28Z
slug: src-variants-geospatial-geospatialpage-tsx
---
Method: dual-agent (A: isolated design review of /geospatial · B: isolated detector + browser pass over all five pages)

## Design Health Score
| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | 24/7 in 13px, contradicted by Sunday Closed |
| 2 | Match System / Real World | 3 | Coupons and verbatim reviews ring true; "Licensed" as a big number does not |
| 3 | User Control and Freedom | 3 | The sparse #quote CTA links to itself |
| 4 | Consistency and Standards | 2 | Red means call in the nav and book in the hero |
| 5 | Error Prevention | 2 | Long CTA labels squeeze the brand at 390 |
| 6 | Recognition Rather Than Recall | 3 | 300+ vs 312 reviews to reconcile |
| 7 | Flexibility and Efficiency | n/a | Single-purpose page |
| 8 | Aesthetic and Minimalist Design | 2 | Seven trust items with two repeats |
| 9 | Error Recovery | 2 | "Call for current hours" with no phone |
| 10 | Help and Documentation | n/a | Nothing to document |
| **Total** | | **19/32** | Acceptable (59%) |

## Design Specificity Verdict
Clearly F1 on the In-Law recipe (stats on the crew photo, perforated tickets, pinned towns, red-barred H2s, an ink services panel) and distinct from the other four, but it copies the family's furniture rather than its priority: the vault plumbers lead with the call, while this hero's red pill books. Detector: stat cells flagged side-tab (4px red top), the "Licensed" stat overflows its cell, one hover-only accent border.

## Priority Issues
- [P1] The CTA hierarchy contradicts the page's job: make Call the red pill in the hero and Book the ghost. (clarify)
- [P1] Trust proof is two overlapping systems; the stat grid covers the crew's faces and "Licensed" overflows. Fix: one trust bar along the photo's base, non-numeric stats set smaller. (distill)
- [P1] 24/7 is buried and contradicted: show hours_note in Hours and the footer. (clarify)
- [P2] Long names, and the sparse #quote loop. (harden)
- [P2] Services tiles are stock photos with a hover affordance but no action. (distill)

## Persona Red Flags
- Jordan: two red buttons; which one is the main way?
- Riley: "Lasiter &" in the nav from the short-name helper; a fourth stat orphans a cell.
- Casey: the Call pill sits top-right; footer links are 20px; the first coupon sits flush to the edge.

## Minor Observations
The quote band repeats the hero subhead; on commercial pages Who we work with and Reviews share one grey; the utility line truncates on phones.

## Questions to Consider
- Should Book be above the fold at all on an urgent-repair page?
- Is the In-Law move really one trust bar of four items?
