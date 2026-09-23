# DERTOUR demo design QA

Final result: passed

## Evidence and scope

Source visual truth: https://www.dertour.de/ as rendered in the signed-in desktop browser and Codex browser on 2026-09-23. Reference hotel: https://www.dertour.de/hotel/calimera-fido-gardens-1114jc. The isolated automated browser received a 403 on the production homepage, so its early captures were discarded and never used as visual evidence.

Desktop source and implementation were captured together in the same browser-tool comparison, at 1265 × 712 pixels (CSS viewport, 1×; scrollbar reduces content width). The final paired screenshots are retained in the task's browser tool output. State: homepage, cookie panel closed, scroll position zero. The source's small floating account promotion is intentionally absent from the demo. No image-density normalization was needed.

Saved implementation evidence is in the sibling `../qa/` output directory: `demo-desktop.png` (1440 × 1000), `demo-mobile.png` (390 × 844), `demo-results.png`, `demo-detail.png`, `demo-confirmation.png`, `demo-mobile-results.png`, and `demo-mobile-detail.png`. Screenshots were visually inspected, not merely generated. Source mobile capture was 449 × 790; mobile review considered the width difference rather than treating wrapping differences as defects.

Full-view comparison checked the header, promotional strip, hero art, overlay headline, offer badge and overlapping search panel. These readable 1× images also provided the focused typography and control comparison; additional crops were unnecessary. Results, details and simulated checkout were reviewed for responsive usability against the captured reference patterns, rather than claiming complete pixel identity with the production booking engine.

## Iterations

1. P2: Mobile header/hero were too tall, causing the search CTA to fall below its intended position. Reduced header height, restored the source hero aspect ratio, simplified fields and placed promotional copy below search. Post-fix mobile screenshot shows all primary search controls and the start of the promotional panel in the viewport.
2. P2: Desktop hero used a fixed height at narrower widths, and its headline and badge were misplaced. Switched to the source aspect ratio and aligned the headline near the upper left and badge near the lower right. Repeated paired source/demo capture confirmed the major regions now align.
3. P2: Additional travel tabs caused horizontal page overflow on mobile. Restricted scrolling to the tab row. Browser assertion confirms no viewport overflow at 390 pixels.
4. Integration QA found strict SDK payload errors for page_view and form_submit. Removed unsupported arguments, moved shared demo markers to SDK set, and repeated a live synthetic journey: no browser errors and HTTP 200 collection responses.

## Required fidelity surfaces

- Typography: locally captured Source Sans Pro regular/600/700 and Roboto Slab bold; hierarchy, wrapping and weights reviewed. Header labels include a convenient demo favourites shortcut.
- Layout: source-derived max-width containers, overlapping desktop search, stacked mobile fields, four-card inspiration rows and responsive cards. Static demo inventory intentionally reduces result count and booking-option density.
- Color: original theme tokens for text, red CTA, warm page background, borders and blue review badges. Promotional strip matched to the rendered source.
- Assets: original local logos, fonts, hero, promotional badge, destination photos and hotel imagery; WebP optimization keeps imagery sharp. Standard UI icons are lightweight line icons; bespoke brand assets are retained. Some secondary hotel photographs are illustrative and labelled accordingly.
- Copy: German travel terminology, source headline and navigation concepts, bounded demo content. Booking simulation and static prices are explicit. Auxiliary destinations use visibly named synthetic demo hotels.

## Validation

Four Playwright tests pass across desktop and mobile: consent rejection/acceptance/withdrawal, complete booking journey, saved hotel, confirmation refresh without duplicate purchase, destination search, budget filter and empty state. No app JavaScript errors in the live smoke test; no Meiro requests before consent. Production build succeeds.

## Accepted differences and follow-up polish

P3: small icon and copy variations, reduced promotion inventory and simplified auxiliary pages. The scope is a faithful travel demonstration, not a production booking engine or full catalogue replica. No real payment, account login, reservation or newsletter delivery exists. Complete accessibility certification and production backend integration are outside this demo's scope.

Checklist: responsive visual comparison complete; original assets local; core flow tested; consent and event validation checked; build ready; deployment left to owner.

## Booking-control regression fix

Reproduced the reported `removeChild` DOMException by replacing room-button text nodes with browser-translation-style font wrappers, then selecting All Inclusive on the other room. The original UI went blank. Stable label/icon elements now avoid removing externally replaced text nodes; explicit meal-plan option values keep state independent of translated labels. The same regression passes on desktop and mobile, verifies both room switches, expected totals, and checkout continuity. All six browser tests and the production build pass after this fix.
