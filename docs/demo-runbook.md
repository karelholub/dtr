# DERTOUR × Meiro demo

## What is live

The website sends events directly through Meiro's Web SDK. Meiro computes destination/lifecycle decisions and preview eligibility; the website polls the narrow `dertour-demo` Profile API and renders only a matching run and revision. A stale/missing response keeps the public personalization slot empty. The presenter can still inspect an explicitly labeled local rule preview.

Open `/demo` or click **Meiro · Demo Studio**. Accept analytics cookies to demonstrate live Meiro. No API token belongs in the website or Netlify environment. The Profile API is intentionally public and returns only DERTOUR synthetic decision/eligibility fields, not contact information.

## Twelve-minute presentation

1. Reset a Researcher scenario. Select Treatment and keep the explicitly synthetic marketing permission enabled. Reset keeps the experiment arm; the arm can be manually overridden for presentation only.
2. Research a destination and advance two demo hours. Wait for **Live Meiro decision**. Close the panel; the personalized card appears below the search/trust section.
3. Start a saved quote and advance 30 minutes. Open Email previews and preview the eligible recovery email. The CTA opens the exact stored trip in a new tab. The quote expires after 48 demo hours; changed/expired offers are blocked and require a new selection.
4. Confirm a demo booking. Recovery disappears; the pre-trip decision offers an unowned transfer. The trip hub shows dates, party, room, board and service checklist.
5. Purchase the synthetic €79 transfer (assumed €24 contribution). The upsell stops. Essential service content remains.
6. Complete the trip, submit feedback, and inspect rebooking. Open a service case to demonstrate marketing suppression. Cancellation also stops recovery and pre-trip offers and zeroes net trip/ancillary value.
7. Reset to Frequent traveler or Lapsed traveler to show distinct recognition and win-back decisions. Switch to Control or withdraw marketing permission to see neutral content.
8. Optional price-watch scene: seed an explicitly opted-in watch, simulate its price dropping to €950, and preview the alert. Watch expiry, cancellation and purchase suppress alerts. A watched quote has a specific hotel, dates, party, room and board; changed selections use the normal reference price.
9. Open Value & reporting, then Meiro Reporting. Explain observed synthetic activity separately from the editable hypothetical ROI example.

Time advances only for this synthetic scenario. It never changes instance time or other journeys. Marketing previews have a 24-demo-hour cap and a per-step/per-trip deduplication key, enforced in Meiro and mirrored locally. The template gallery is explicitly a design preview and does not count as an eligible communication.

## Meiro navigation

In Engage → Reporting, select:

- **DTR | 01 Booking funnel • synthetic demo** — run count, search, checkout, net booking conversion and destination results.
- **DTR | 02 Lifecycle & suppression • synthetic demo** — ancillary value/margin, repeat bookings, cancellations, open cases, acquisition exclusion and content touchpoints.
- **DTR | 03 Commercial value • illustrative margin, no ad spend** — cancellation-adjusted booking value, assumed contribution and treatment/control tables.

Nineteen reports use only DTR attributes. Filters include destination, experiment and persona where applicable. Reporting dates are actual event timestamps; the presenter clock is separate. Refresh after async profile calculation. A run is a demo scenario, not a unique person. Repeated state snapshots collapse to the latest state for each run. Goal event totals are gross events; the outcome dashboards provide deduplicated run totals and cancellation-adjusted value.

Engage → Journeys contains six **DTR … PREVIEW ONLY** drafts. Engage → Email contains eleven German DERTOUR drafts with Liquid destination/trip fallbacks. These are deliberately unlaunched and unscheduled. The website renders the selected email with the current synthetic quote; draft emails in Meiro are reviewable configuration, not evidence of a delivered email. The existing instance email provider was left unchanged. No real recipients were seeded and no send or schedule action was performed.

The catalogue contains ten synthetic/demo hotel offers sharing website IDs. Catalogue prices are reference per-person prices; room, board, party and explicit simulated price changes determine the current quote total. It is not a live inventory or price feed.

## Measurement boundaries

- Everything in these dashboards is synthetic demo data, including QA runs.
- The 12% booking contribution assumption and €24 transfer margin are illustrative, not DERTOUR economics.
- The ROI calculator is a what-if model. It does not claim measured incremental lift or significance.
- No paid-media spend feed or ad-platform export is connected. The demo shows audience eligibility/suppression, not actual spend savings or verified ROAS.
- Manually changing experiment arms is useful for presentation but invalidates causal interpretation. A real pilot needs persistent person-level randomization and an agreed observation window.
- Dynamic packaging and predictive next-trip timing remain the approved roadmap items; no predictive model is claimed.

## Configuration and recovery

`meiro/manifest.json` records object IDs; neighboring JSON/HTML files capture the created definitions. `meiro/validation.json` records bounded aggregate QA results. Existing travel-demo objects and its running order-confirmation journey were preserved. Two new custom event types were added to the existing DERTOUR source.

To roll back website changes, revert the implementation commit through the normal GitHub workflow. Meiro objects are independent additions; keep them for review or remove only the DTR objects after checking dependencies. Do not delete or repurpose shared travel-demo objects. No deployment was run from this workspace.

Local preview: `npm run dev -- --host 127.0.0.1 --port 5173`.
Build: `npm run build`.
Rule tests: `node --test tests/lifecycle.test.mjs`.
Browser tests: `npm test` (set `PLAYWRIGHT_EXECUTABLE_PATH` if using an existing local Chromium).

## Native Meiro Web Banners

Two additional examples are **authored and delivered by Meiro**, alongside the existing website-rendered lifecycle cards. They are enabled only on the DERTOUR SDK source, on `dtrdemo.netlify.app`, `127.0.0.1` and `localhost`. Customer content, layout, page/host conditions, trigger and frequency cap live in Engage → Channels → Web Banners.

| Example | Where / trigger | Frequency | Meiro editor |
| --- | --- | --- | --- |
| Mallorca family inspiration | Homepage, empty `#dtr-meiro-inpage` slot below search/lifecycle content | 5 impressions per SDK session | [In-page banner](https://travel.eu1.pipes.meiro.io/channels/web-banners/b356eb89-d31e-45c2-80e1-ef187bd109cc) |
| Price-watch guide | Hotel detail → **So funktioniert der Preisalarm** | 1 impression per SDK session | [Popup banner](https://travel.eu1.pipes.meiro.io/channels/web-banners/d454c38c-3df1-4fac-be6b-2735fdae78ff) |

1. Open a fresh private browser session and accept analytics cookies. The SDK and both banners are consent-gated.
2. On the homepage, show the Mallorca card and open its editor in Meiro. Change copy, save, confirm the banner remains enabled, and reload the site: creative updates require no website deployment. The repo HTML is a configuration snapshot, not the rendering source.
3. Click the card CTA to open the Mallorca hotel. Click **So funktioniert der Preisalarm** near the price-watch control. The native popup opens; its CTA opens the existing price-watch form. Close or press Escape to dismiss it.
4. Refresh the hotel page and try again: the session cap prevents another popup impression. Use a fresh private session to repeat. Resetting the lifecycle scenario does not reset native SDK caps.
5. Open [Meiro Reporting](https://travel.eu1.pipes.meiro.io/reporting) → **DTR | 04 Web Banners • demo interactions, not business uplift**. Click Refresh after ingestion/attribute processing. Filter by banner, format or host. Local QA traffic is included and can be separated using the Host filter.

These two examples demonstrate **contextual page targeting**, not lifecycle-audience or treatment/control targeting. Existing lifecycle cards still demonstrate live profile decisions. Banner metrics are SDK interaction counts, not unique visitors or causal uplift. The click/impression ratio may exceed 100% if a visitor clicks more than once per display. “Closes” includes closing after the popup CTA. No email is sent by either banner.

Implementation: React provides a stable empty anchor and a hotel-page trigger. The SDK creates an iframe inside the anchor or a popup at document level. On SPA navigation and consent changes, the SDK banner module is reinitialized to reevaluate page conditions and clean up old content. There is no local creative fallback. Banner CTA links stay on the current demo host; images use the existing Netlify assets.

Rollback: use Disable in each new banner's Meiro editor to stop future delivery, then reload open pages. Do not change the older travel demo's banners or source. The website hook can also set `web_banners.enabled` to false if a code rollback is needed.
