# DERTOUR travel demo

Responsive German travel prototype based on the DERTOUR website, with a direct Meiro Web SDK integration. No Google Tag Manager. No real bookings or payments.

## Run and build

```sh
npm ci
npm run dev
npm run build
```

Node 22 is recommended. Vite produces the static website in `dist/client`.

## Netlify

Connect this repository and deploy its `main` branch. `netlify.toml` sets:

- Build command: `npm run build`
- Publish directory: `dist/client`
- SPA fallback: all application paths serve `index.html`

No API token or secret is required. Optional public configuration overrides are documented in `.env.example`. Deployment is intentionally left to the repository owner.

## Demo journey

1. Choose cookie consent. Meiro loads only when analytics is accepted.
2. Select destination, airport, dates and travellers.
3. Search, filter by budget/family/category, and sort hotel offers.
4. Save favourites, open hotel details, select room and board.
5. Review the offer and enter invented traveller details.
6. Complete a clearly labelled simulated booking; no payment is collected.

The catalogue includes five Mallorca reference hotels and one synthetic example for each additional destination. Some hotel imagery is illustrative. Prices are static examples, not live availability. Auxiliary account, agency, magazine and newsletter experiences are bounded demo dialogs; round trips and other travel products are not full booking flows. Favourites and consent persist locally; the last simulated confirmation persists for the tab session.

## Meiro

- Instance: https://travel.eu1.pipes.meiro.io/
- Source: **DERTOUR Demo Web**
- Source ID: `0e72295b-cf85-41be-b46c-e48194e24779`
- SDK: `https://travel.eu1.pipes.meiro.io/mpt.js`
- Collection endpoint: `https://travel.eu1.pipes.meiro.io/collect/dertour-demo-web`
- Source template: `web-sdk`, version `2026-08-28`

See [the event contract](docs/event-contract.md). The SDK source is isolated from the existing travel demo. No downstream campaigns or advertising destinations were configured or changed.

Browser debug inspection: `window.__dtrEvents` contains the most recent 50 app event calls, without SDK-generated identifiers. Check the browser Network panel and Meiro source History for receipt. A successful browser call alone does not prove downstream activation.

Names and email entered in the booking and newsletter forms are never copied into analytics, browser persistence, or a backend. The SDK itself supplies browser/session metadata. Withdrawing consent blocks further app event calls and updates SDK persistence consent.

## Testing

```sh
npx playwright install chromium
npm test
```

Automated tests use a stubbed SDK and do not send analytics to the live instance. A separate bounded live smoke test was performed during implementation: full search-to-purchase flow, HTTP 200 collection responses, no JavaScript validation errors, and incoming events visible on the source page.

## Reference assets

Original public DERTOUR brand assets and fonts are stored locally; no production-site hotlinks or GTM are included. Image files were resized and converted to WebP for transfer size. Source URLs are listed in [asset provenance](docs/asset-provenance.json). Brand and image rights remain with their respective owners. This repository is a demonstration prototype, not an official DERTOUR service.
