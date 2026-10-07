---
target: src/variants/aerial/AerialPage.tsx
total_score: 20
max_score: 32
na_heuristics: 7,10
p0_count: 0
p1_count: 3
target_identity: "file:C:\\dev\\rapidforge-demos\\src\\variants\\aerial\\AerialPage.tsx"
target_fingerprint: "sha256:c6cec7ccb9df754237ce8f46433502746c8b2c3216724f9df6b3038b68ec51fe"
target_path: "C:\\dev\\rapidforge-demos\\src\\variants\\aerial\\AerialPage.tsx"
timestamp: 2026-10-07T00-11-29Z
slug: src-variants-aerial-aerialpage-tsx
---
Method: dual-agent (A: isolated design review of /aerial · B: isolated detector + browser pass over all five pages)

## Design Health Score
| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | 24/7 only in the utility bar; Hours says Sunday Closed |
| 2 | Match System / Real World | 3 | Coupons and "Request a bid" sound like the trade; a van illustrates Fixture installation |
| 3 | User Control and Freedom | 3 | Financing only peeks in on mobile |
| 4 | Consistency and Standards | 2 | Mixed brief: the nav says Request a bid, the hero says Book a Plumber |
| 5 | Error Prevention | 2 | Sparse #quote loop |
| 6 | Recognition Rather Than Recall | 3 | 24/7 must be remembered when reading Hours |
| 7 | Flexibility and Efficiency | n/a | One-page Persuade surface |
| 8 | Aesthetic and Minimalist Design | 2 | Book three times and Call three times in the top 400px |
| 9 | Error Recovery | 3 | Sparse footer hours copy |
| 10 | Help and Documentation | n/a | The phone is the help |
| **Total** | | **20/32** | Acceptable (63%) |

## Design Specificity Verdict
F2 above the fold (oxblood and black bands, the black stats tab cut into the photo, perforated coupons, Rubik caps, flat buttons); below "Our Services" it is the shared layout recoloured, with no jobsite imagery. Detector: side-tab on .ws-contact and on the phone tiles (4px red left edge); border-accent-on-rounded on 4px-radius tiles (minor).

## Priority Issues
- [P1] Hours contradict 24/7: show hours_note above the table and in the footer. (clarify)
- [P1] A mixed brief keeps "Book a Plumber" under commercial copy; the sparse #quote loop. (harden)
- [P1] The nav brand reads "BRITTAIN &" from the short-name helper. (harden)
- [P2] No jobsite imagery; tile photos assigned by position. (harden)
- [P2] The first viewport repeats itself; "LICENSED" at 37px while the 4.9 rating is 15px. (distill)

## Persona Red Flags
- Jordan: "done to spec" reads as builder jargon.
- Riley: the brand split, the mixed-brief label split, the sparse loop.
- Casey: CALL and BOOK only at the top; the big phone links are 25-35px tall; financing peeks with no cue.

## Minor Observations
.ww-tile-title inherits 1.6 leading; Rubik opens up the phone's parentheses; the mobile grade turns the crew into a brown smear; the tab loses its reviews link at 390.

## Questions to Consider
- If this is the jobsite preset, where is the jobsite?
- Should the commercial lean change a homeowner's headline at all?
