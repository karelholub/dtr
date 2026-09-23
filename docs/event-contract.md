# Direct Meiro SDK event contract

Implementation: `src/tracking.js`. The SDK is loaded only after analytics consent. Shared attributes use `mpt('set', {demo: true, demo_site: 'dertour'})`. The SDK supplies browser/session identifiers.

| Event | Trigger | Fields |
|---|---|---|
| page_view | Route entry or initial consent | page_title, url, referrer |
| search | Submit travel search | search_term, destination, departure_airport, start_date, end_date, adults, children, travel_type |
| view_search_results | Results page | search_term, items |
| select_item | Open hotel | item_list_name, items |
| view_item | Hotel detail | currency, value, items |
| add_to_wishlist | Save hotel | currency, value, items |
| add_to_cart | Choose room | currency, value, items, room_type, board_type |
| begin_checkout | Offer check | currency, value, items, destination, dates, travellers |
| form_start | First booking form focus | form_id |
| form_submit | Valid booking form submission | form_id |
| purchase | Simulated booking submission | transaction_id, order_id, currency, value, items, booking_type: simulated |
| sign_up | Simulated newsletter signup | method: newsletter_demo |
| select_promotion | Homepage offer card | promotion_name |
| filter_results | Sorting change | sort |

Item fields: item_id, item_name, item_category (hotel), item_category2 (destination), price, quantity. All monetary amounts are EUR example values. Order ID is generated on form submission; reloading confirmation does not send another purchase.

The installed SDK strictly validates page_view and form_submit. Their arguments must not include arbitrary fields; shared demo markers belong in `set`. Named custom events accept object payloads. Automatic link tracking and tracking rules are disabled, avoiding duplicate automatic events and form scraping.

Names and email entered into forms are never sent or persisted. Do not add them when extending the demo. No payment/passport data is requested. Consent rejection blocks SDK loading; withdrawal blocks new app event calls and updates SDK persistence consent; re-acceptance restores consent. Events before consent are not replayed.

No downstream advertising pipes or campaigns were changed. Receipt in the input is separate from CDP attributes and activation setup.

## DERTOUR lifecycle extension

`dtr_demo_state` is a synthetic-only snapshot event with `demo_site: dertour`, a random run ID, revision, producer event time, lifecycle action, experiment arm, separate marketing/media permissions, quote/booking/watch context, owned extras, contact-step keys and outcome values. Meiro derives decisions and eligibility from the inputs; a client-provided decision is not used. Events are ordered by producer time then receipt time to withstand batching.

`dtr_touchpoint` records a live web impression/click or eligible email preview with event ID, run ID, decision, channel, experiment and destination. Gallery previews do not count as communication. This is not an email-delivered/open event.

`begin_checkout` now includes stable quote/booking-session IDs plus room and board. `purchase` includes quote, dates, party and booked selection; no checkout form names/emails are collected. A synthetic confirmation/cancellation updates Meiro run outcomes. Repeated state snapshots are deduplicated per run for reporting.

See [demo-runbook.md](demo-runbook.md) and `meiro/manifest.json` for implementation details and limits.

## Native Web Banner events

The Meiro SDK automatically emits `web_banner_impression`, `web_banner_click` and `web_banner_close` for the two DTR native banners. Do not also emit these through `track()` or duplicate them as `dtr_touchpoint`. Standard payloads include `banner_id`, `banner_name`, `banner_type`, `placement`, `source_slug`, `url`, `path` and `host`; click events also include `action_text` and `href`. The DERTOUR source already defines these event types and resolves the SDK `user_id`.

`dtr_native_banner_activity` selects only these event type IDs and the two DTR banner IDs. Dashboard 04 aggregates native interaction counts independently of synthetic lifecycle run outcomes and ROI. Event acceptance, responsive delivery, CTA navigation, popup close, session suppression, declined consent and React DOM ownership were checked with the live SDK and focused browser regressions.
