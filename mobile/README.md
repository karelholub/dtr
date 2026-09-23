# DERTOUR iPhone demo

Native SwiftUI companion to the DERTOUR web demo, using Meiro's private iOS SDK `pipes` branch. German customer screens; English presenter controls under **Profil → Meiro Demo Studio**. All bookings, prices, trips and revenue are synthetic.

## Run locally

Xcode and an iOS simulator runtime are required. GitHub must have read access to `meiroio/mobile_sdk_ios`.

```sh
./mobile/scripts/run-simulator.sh
```

The script prepares the pinned SDK, builds, installs and opens the simulator. Override `DTR_SIMULATOR_ID` for another simulator from `xcrun simctl list devices available`. The checked-in Xcode project can also be opened after running `mobile/scripts/prepare-sdk.sh`. No Meiro management token is embedded in the app.

SDK revision: `e417c45bfdd5c84ce3e09545c8c1536e3b5165da`. Private SDK source stays in ignored `mobile/.build/MeiroSDK`; only reproducible integration patches are versioned. See `patches/` for consent-time initialization, dynamic SwiftUI placement height, removal of visible messages after SDK disable, and admission diagnostics. These are local integration patches for CTO review; the upstream repositories are unchanged.

## Demo journeys

- Browse bundled hotel photography, filter destinations, favorite hotels, choose dates/party/room/board, save a quote and confirm a demo booking. Quotes expire after 48 hours; no payment is taken.
- Open **Meine Reise** for locally cached documents, simulated check-in, a €79 transfer and service/feedback actions.
- Save a price watch for a specific hotel selection; enable travel offers separately in Profil. Demo Studio can simulate a lower price for that saved selection.
- Native Meiro messages use two inline placements (`dtr_home`, `dtr_trip`) and modal booking recovery, price alert and post-trip feedback. HTML, targeting, triggers and caps are configured in Meiro, not recreated as SwiftUI banners.
- **Im Web weiterstöbern** carries the anonymous mobile identity to the web demo. Web consent is still required. This demonstrates identity linkage; it does not synchronize bookings across devices.
- The notification action is an explicitly labelled **local simulator notification**, not a remote Meiro/FCM push. Real push requires APNs/FCM provisioning and a physical-device delivery test.

## Meiro and measurement

Instance: https://travel.eu1.pipes.meiro.io

Input: `dertour-demo-mobile`. Exact object IDs are in `meiro/manifest.json`.

Dashboard: **DTR | 05 Mobile app • synthetic journeys & native in-app engagement**. It reports demo runs, net bookings, booking value, ancillary value, check-ins, lifecycle distribution and native SDK impressions/clicks/closes. These are observed synthetic demo outcomes, not incremental ROI or ROAS. No ad spend or causal lift is inferred.

The SDK sends a `dtr_mobile_state` snapshot after business actions, with a run ID and revision. Meiro materializes `dtr_mobile_context`; the limited public profile endpoint returns that context. The presenter status says **Live Meiro** only after the current revision is returned. SDK-generated message events feed `dtr_mobile_in_app_activity`; the app does not manufacture impression/click counters.

For presentation, the instance-wide in-app frequency policy is enabled at **20 messages per hour**; individual message caps still apply. The previous one-per-12-hour policy and rollback instructions are recorded in `meiro/shared-frequency-policy.json`. Email, SMS, WhatsApp and push policies were not changed.

Consent is requested before SDK initialization. Analytics/personalization and promotional travel offers are separate. No IDFA collection, real payment, customer credentials or real email sending is implemented. Offline documents remain available without tracking. Reset creates a new demo run; it intentionally does not bypass server message frequency caps.

## Validation

UI tests live in `DERTOURDemoUITests/JourneyTests.swift` and run on the installed simulator:

```sh
xcodebuild -project mobile/DERTOURDemo.xcodeproj -scheme DERTOURDemo \
  -destination 'platform=iOS Simulator,id=B6D4BB94-26A1-4677-A060-1F873094B759' \
  -collect-test-diagnostics never CODE_SIGNING_ALLOWED=NO test
```

`mobile/scripts/generate-project.rb` regenerates the project using Ruby's `xcodeproj` gem if files or targets change. Ordinary builds use the checked-in project and do not need Ruby.

Verified screenshots: [native inline](screenshots/meiro-inline.png), [native popup](screenshots/meiro-popup.png), [offline documents](screenshots/offline-documents.png).

During a presentation, allow the current Meiro revision to arrive before demonstrating a targeted message. Native messages can be suppressed by audience eligibility or shared/per-message caps; this is real Meiro behavior. The presenter diagnostics expose admission decisions without printing profile values.

## Suggested presentation (5–7 minutes)

1. Launch **DERTOUR Demo**, allow personalization and scroll a little on Entdecken. Explain that the compact inline creative is delivered by Meiro. Tap **Mallorca entdecken** to open the native hotel sheet.
2. Choose **All Inclusive**, then **Reise vormerken**. To demonstrate recovery, enable **Profil → Reiseangebote & Preisalarme** first and choose **Für später speichern** in checkout. The native Meiro popup resumes the saved quote. Confirming a demo booking moves the journey to booked and removes recovery eligibility.
3. Open **Meine Reise → Reiseunterlagen**. Explain that the documents are cached locally, while permitted activity is sent through the mobile SDK. Prepare check-in or add the demo transfer to show additional outcomes.
4. In **Profil → Meiro Demo Studio**, choose **Complete trip / request feedback**. Meiro evaluates the completed-trip audience and displays a native popup that deep-links to the rating screen. Opening a service case changes the lifecycle to care and excludes marketing audiences for that journey.
5. In Meiro, open the mobile input, **DTR Mobile** messages and **DTR | 05 Mobile app • synthetic journeys & native in-app engagement**. Refresh the dashboard (report results can be cached for five minutes) to show the SDK's actual message engagement and synthetic booking totals. Explain that incremental ROI/ROAS would require real spend and a control-group measurement design.

Price-watch variation: start a fresh scenario, open a hotel, choose **Preis beobachten**, set a threshold and grant its offer permission. Save, then use **Simulate price drop** in Demo Studio. The price popup opens the same hotel/room/board/party selection with its simulated price. A booked/completed/care journey takes priority over a shopping price alert.
