# RFD.VAULT.4: what real trade sites do

36 independent contractor homepages, 12 per trade (4 residential, 4 commercial, 4 new-construction), from Boise, Spokane, Reno, Tucson, Omaha, Tulsa, Greenville SC and Fort Worth. All 36 captured at 1440×900 and 390×844 (robots.txt allowed all of them), read by claude-sonnet-5-5, grouped into 4 families per trade. Start with `vaults/<trade>-contact-sheet.jpg`; the data is in `vaults/<trade>.json`.

Counts are out of 12. Rows marked (DOM) were measured in the browser; the rest are the vision model's read of the screenshot.

## Plumbing

| Convention | Sites |
|---|---|
| Phone number on the first mobile screen (DOM) | 9 |
| Tap-to-call link on the first mobile screen (DOM) | 8 |
| Phone or call button pinned while scrolling (DOM) | 6 |
| Sticky header on desktop (DOM) | 5 |
| Trust bar near the top | 6 |
| Coupon, special or financing block | 4 |
| Service-area list or map | 7 |
| Reviews section with ratings | 7 |
| Booking form or scheduler on the page | 3 |
| Phone-first / form-first / balanced | 6 / 0 / 6 |
| License number in the page text (DOM) | 3 |
| 24/7 or emergency wording (DOM) | 6 |
| Median CTA label | "Call (number)": first action button on 2 sites, used on 6 |
| Accent hues | red 6, blue 3, orange 2, green 1; light ground 10, dark-heavy 2 |
| Median LCP, lab (DOM) | 0.9 s desktop, 1.5 s mobile |

Families:
- **F1 Red Banner Plumbers** (Lasiter, Johnson, Tucson Plumbing, In-Law, Hyde Park): white pages, one saturated red, a darkened full-bleed photo hero, geometric sans, badge-led trust.
- **F2 Jobsite Red Commercial** (S&K, Goodson, All American): construction or van photos under dark overlays, flat red buttons, heavy caps, black bands.
- **F3 Royal Blue Fleet** (Gold Seal, Williams): royal-blue panels, condensed caps, branded-truck and crew heroes, card service grids.
- **F4 Mountain Blue Heritage** (Everest, Master Service): blue accents, mountain imagery, pill shapes, license and award marks.

Borrow from:
1. **Williams Plumbing & Drain** (Tulsa) has the best conversion hero in the set: a utility bar ("24/7 · Serving Tulsa & 40+ communities" with Call and Schedule), a Google 4.9 · 6,385 reviews chip above the H1, an "A+ BBB Rated · Licensed OK #…" line under the buttons, and perforated $500 and $250-off coupon tickets overlapping the bottom of the hero.
2. **In-Law Plumbing & Drain** (Omaha) puts a stat grid on the hero photo (40+ years, 550+ Google reviews, BBB, Licensed) that works as its trust bar, a Specials banner straight under the hero, and its service towns as pill chips with map pins.
3. **Goodson Plumbing** (Boise) makes "family-owned" visible: the two owners stand in front of their branded vans in the hero, the header carries the star rating and "Serving the Treasure Valley", and award badges sit under the CTAs.

## HVAC

| Convention | Sites |
|---|---|
| Phone number on the first mobile screen (DOM) | 10 |
| Tap-to-call link on the first mobile screen (DOM) | 12 |
| Phone or call button pinned while scrolling (DOM) | 4 |
| Sticky header on desktop (DOM) | 5 |
| Trust bar near the top | 3 |
| Coupon, special or financing block | 8 |
| Service-area list or map | 5 |
| Reviews section with ratings | 7, really 8 (Air Today's widget is blank in the capture) |
| Booking form or scheduler on the page | 3 |
| Phone-first / form-first / balanced | 0 / 1 / 11 |
| License number in the page text (DOM) | 2 |
| 24/7 or emergency wording (DOM) | 9 |
| Median CTA label | "Call (number)": first action button on 3 sites, used on 4; "Request service" used on 3 |
| Accent hues | red 6, orange 3, blue 1, yellow 1, pink 1; light ground 12 |
| Median LCP, lab (DOM) | 0.9 s desktop, 0.9 s mobile |

Families:
- **F1 Flag Red Full-Bleed** (TSS, Air Today, Mt. Rose, A-1 Heating, R&R): bright white under a full-bleed photo hero, red CTAs backed by royal or navy blue, bold geometric sans, badge-led trust.
- **F2 Navy Hero Yellow Signal** (B&K, DIVCO, North Tarrant): navy-tinted hero photos, grotesk or extended caps, yellow or orange signal buttons, colour-blocked service panels.
- **F3 Bright Photo Red Accent** (Dyna, Temperature Control): white ground, full-bleed photo heroes, one hot red or orange accent, soft grey or cream panels.
- **F4 Dealer Red Banner** (Arthur Hagar, A-1 United): the manufacturer-dealer template, with a lifestyle hero, heavy caps, red or orange block buttons and navy or charcoal bands.

Borrow from:
1. **Air Today Heating & Cooling** (Greenville SC) pins an offer bar at the top ("$0 diagnostic with approved repair" plus a Call button), embeds a live Google reviews widget (5.0 from 351 reviews), uses mascot coupon tiles with a red call strip, and tells the founder's three-generation family story.
2. **TSS HVAC Services** (Boise, commercial) puts audience tabs under the hero (property managers, facility managers, building owners, national service companies) that swap the copy, then a client-logo strip and three-state service-area cards with coverage maps. It's the model for a commercial variant.
3. **Temperature Control, Inc.** (Tucson) has a zip-code checker beside its service-area map and town list, frosted-glass service tiles on the hero, and a desert-sunset palette that reads local, not stock red and blue.

## Electrical

| Convention | Sites |
|---|---|
| Phone number on the first mobile screen (DOM) | 5 |
| Tap-to-call link on the first mobile screen (DOM) | 8 |
| Phone or call button pinned while scrolling (DOM) | 4 |
| Sticky header on desktop (DOM) | 6 |
| Trust bar near the top | 3 |
| Coupon, special or financing block | 0 |
| Service-area list or map | 6 |
| Reviews section with ratings | 8 |
| Booking form or scheduler on the page | 2 |
| Phone-first / form-first / balanced | 6 / 3 / 3 |
| License number in the page text (DOM) | 1 |
| 24/7 or emergency wording (DOM) | 6 |
| Median CTA label | no shared label; an estimate or quote request is the first action button on 4 sites, a call on 2 |
| Accent hues | blue 4, red 3, yellow 2, orange 2, purple 1; light ground 12 |
| Median LCP, lab (DOM) | 1.2 s desktop, 1.2 s mobile |

Families:
- **F1 Safety Amber Builders** (Lea, Jacob's, Buddy & Sons, Greenville Electric): light pages with charcoal or navy bands, safety-amber buttons, condensed or tracked caps, jobsite or landmark hero photos.
- **F2 Bright Split Electric** (Dennis, BrightLife, CTC): white ground, a split hero, flat saturated blue, grotesk sans, rounded photos and pill buttons.
- **F3 Brick Red Corporate Electric** (Houchin, Alpha, Cano): brick-red and maroon on white or black, darkened trade-photo heroes, card-based credibility blocks.
- **F4 Corporate Navy Commercial** (Hayes & Lunsford, Parish): off-white framed by navy header and footer bands, steel-blue accents, a full-bleed commercial project hero, copy written for builders.

Borrow from:
1. **Buddy & Sons Electrical** (Tucson) has the strongest personality in the set. Its mascot brand, hero proof row (4.9★, 347 reviews, 20+ years, Licensed), numbered "Buddy System" process timeline and tilted review cards all keep the call button pinned.
2. **Dennis Electric** (Omaha) runs a scrolling trust-claim ticker under the header, puts its Google 4.9 reviews band directly after the hero, and shows the real owners with branded vans in the hero. Don't copy its mobile layout, though: the phone number misses the first screen.
3. **Cano Electric** (Fort Worth) is the builder and commercial pattern: segment cards (commercial, multifamily) with overlapping panels, both office numbers in the header, a service-area map with a scrolling town list, and stats counters.

## What our five variants are missing

Our variants already have the basics: the phone in a sticky nav and on the first mobile screen, a trust strip under the hero, reviews, hours and a quote band. Real sites add these (counts out of 36):

1. **Their own people and trucks (19/36, 9 of them in the hero).** Owners, crews and branded vans carry the "local, family-owned" claim; our heroes are stock trade photos. This needs a crew/van photo slot in the brief and a hero composed around people.
2. **A badge row, not text chips (29/36).** BBB A+, manufacturer dealer marks (Trane, Carrier), Nextdoor and best-of awards, association logos, plus hard numbers (31/36 show years or stats; 11/36 a Google rating with its review count). Our TrustStrip is text chips and a star average.
3. **A service-area list (18/36).** Towns as chips with pins, a map with a town list, or a zip checker. Ours print the city in the footer only. This needs `service_areas` in the DesignBrief.
4. **A utility bar above the header (14/36).** A 24/7 line, the service area, "Open now", Call and Schedule buttons, often the current offer. Ours start at the nav.
5. **Offers: coupons, specials, financing (12/36, and 8/12 in HVAC).** Coupon tickets on the hero edge, a "$0 diagnostic" bar, financing cards. Ours have none, and HVAC presets need one most.

Only 8/36 put a form or scheduler on the homepage, so our call-or-quote-button pattern matches the norm.

## How this was made, and what to distrust

- **Search.** Claude Code WebSearch with the exact query templates per segment and metro. Plain results were almost all directories, job boards and franchise pages, so each query was re-run with a blocked-domains filter. `rank` is the position in that filtered list, not a Google rank. Picks, 18 alternates, queries, ranks and filters are in `scripts/vault-sites.json`.
- **Capture.** Playwright Chromium, robots.txt checked first. It dismisses cookie banners, un-hides scroll reveals that never fired (Lasiter had 24 hidden blocks), and re-shoots embedded cross-origin widgets, which a full-page capture paints blank. The final recapture with that widget fix was stopped by Windows running low on memory after 5 sites. Hyde Park and Air Today therefore still show blank review widgets, and their "empty reviews" weakness is a capture artifact. Family never-lists skip blank-area weaknesses for this reason.
- **Vision.** claude-sonnet-5-5 at medium effort read up to 6 strips of each desktop screenshot plus the DOM facts, about $1.20 for the 36 sites. Family names, never-lists, risks and hero prompts are claude-sonnet-5-5 text-only from the member entries, about $0.50. House DNA is the counted conventions above.
- **Families.** Exhaustive k-medoids on a palette/type/hero distance, at least 2 sites per family. k=4 won on silhouette in every trade (plumbing 0.24, HVAC 0.21, electrical 0.43), so the plumbing and HVAC families blur into each other more than electrical's do.
- **LCP.** Lab numbers from this machine, unthrottled. Use them to compare sites, not as PageSpeed scores.
