---
target: src/variants/cleanpro/CleanProPage.tsx
total_score: 20
max_score: 32
na_heuristics: 7,10
p0_count: 0
p1_count: 3
target_identity: "file:C:\\dev\\rapidforge-demos\\src\\variants\\cleanpro\\CleanProPage.tsx"
target_fingerprint: "sha256:3bd7bb2f5e35b79b99972e9a374f69ed13b154e219bb48c5c12b24ec4db04126"
target_path: "C:\\dev\\rapidforge-demos\\src\\variants\\cleanpro\\CleanProPage.tsx"
timestamp: 2026-10-07T00-11-28Z
slug: src-variants-cleanpro-cleanpropage-tsx
---
Method: dual-agent (A: isolated design review of /cleanpro · B: isolated detector + browser pass over all five pages)

## Design Health Score
| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | Nothing says whether anyone answers now; Sunday Closed under 24/7 |
| 2 | Match System / Real World | 3 | Right voice; Cormorant old-style digits make the phone read like an invitation |
| 3 | User Control and Freedom | 3 | Sparse #quote loop |
| 4 | Consistency and Standards | 2 | Gold on 21 elements stops meaning "action" |
| 5 | Error Prevention | 2 | 312 vs 300+; call links 26px and 38px tall |
| 6 | Recognition Rather Than Recall | 3 | 24/7 shown once, then contradicted |
| 7 | Flexibility and Efficiency | n/a | Single-purpose page |
| 8 | Aesthetic and Minimalist Design | 2 | Seven-item proof row with repeats |
| 9 | Error Recovery | 3 | Graceful image fallback; sparse hours copy |
| 10 | Help and Documentation | n/a | The help is the call |
| **Total** | | **20/32** | Acceptable (63%) |

## Design Specificity Verdict
Distinct from every plumber in the vault (none is dark), but black, gold and Cormorant with Montserrat is the stock luxury look; the gold-framed crew photo and the big serif number are its own. Detector: one overused-font (Montserrat, brief-specified); the All concepts chip pairs a thin border with a wide shadow.

## Priority Issues
- [P1] Too much gold and repeated proof: stat numerals in gold, with "Licensed" the largest gold text. Fix: stats in the text colour, non-numeric stats smaller. (distill)
- [P1] Prospect names break ("Brittain &") and a long CTA can squeeze the brand to 0px. (harden)
- [P1] 24/7 is buried: show hours_note under the Hours heading. (clarify)
- [P2] Old-style digits: add lining figures to phone numbers and stats. (typeset)
- [P2] 9px of phone fold headroom; the first coupon snaps flush to the edge. (adapt)

## Persona Red Flags
- Jordan: three Book and three phone links before scrolling.
- Riley: the "Brittain &" brand; the sparse #quote loop.
- Casey: the contact and quote-band phone links are under 44px; the All concepts chip sits in the thumb zone.

## Minor Observations
"Need a / plumber today?" breaks badly (18ch measured on Cormorant's narrow zero); tiles turn gold on hover but are not links; commercial boilers get the residential water-heater blurb.

## Questions to Consider
- Should gold move to Call when hours_note says 24/7?
- Would a Cormorant menu of services between hairlines read more premium than the photo grid?
