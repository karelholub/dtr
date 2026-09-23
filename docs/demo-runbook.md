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
