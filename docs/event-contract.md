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
