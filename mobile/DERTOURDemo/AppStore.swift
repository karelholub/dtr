import SwiftUI
import UserNotifications

@MainActor
final class AppStore: ObservableObject {
    @Published var state: MobileState
    @Published var tab = 0
    @Published var selectedHotel: Hotel?
    @Published var showCheckout = false
    @Published var showStudio = false
    @Published var notice: String?
    let meiro = MeiroClient()
    private var screenTask: Task<Void, Never>?
    private let key = "dtr-mobile-state-v1"
    init() {
        if ProcessInfo.processInfo.arguments.contains("--uitest-reset") { UserDefaults.standard.removeObject(forKey: key) }
        state = UserDefaults.standard.data(forKey: key).flatMap { try? JSONDecoder().decode(MobileState.self, from: $0) } ?? MobileState()
        if let consent = state.consent { meiro.consent(consent) }
    }
    func save() { if let data = try? JSONEncoder().encode(state) { UserDefaults.standard.set(data, forKey: key) } }
    func consent(_ enabled: Bool) {
        state.consent = enabled; meiro.consent(enabled); update("consent_changed")
    }
    func update(_ action: String) {
        state.revision = UUID().uuidString; save()
        let trip = state.trip
        let quote = trip?.quote ?? state.quote ?? state.watch?.quote
        meiro.event("dtr_mobile_state", ["action": action, "run_id": state.runID, "revision": state.revision,
            "stage": state.stage, "destination": quote?.hotel.destination ?? state.destination,
            "hotel_id": quote?.hotelID ?? "", "hotel_name": quote?.hotel.name ?? "",
            "marketing": state.marketing, "searched": state.searched, "checkout": state.quote != nil,
            "net_booking": trip != nil && trip?.cancelled != true ? 1 : 0,
            "net_value": trip?.cancelled == false ? (trip?.quote.total ?? 0) : 0,
            "ancillary_value": trip?.transfer == true && trip?.cancelled == false ? 79 : 0,
            "checked_in": trip?.checkedIn == true, "feedback": trip?.feedback ?? 0,
            "watch_active": state.watch != nil, "service_case": state.serviceCase])
    }
    func screen(_ screen: String) {
        meiro.screen(screen)
        // Named placement is already mounted before this delayed trigger fires.
        screenTask?.cancel()
        screenTask = Task {
            try? await Task.sleep(for: .milliseconds(650))
            guard !Task.isCancelled else { return }
            meiro.event("dtr_show_\(screen)", ["stage": state.stage])
        }
    }
    func triggerWhenProfileReady(_ name: String, values: [String: Any] = [:]) {
        let revision = state.revision
        Task {
            for _ in 0..<20 {
                guard state.revision == revision, meiro.allowed else { return }
                await meiro.checkProfile(revision: revision)
                if meiro.confirmedRevision == revision { meiro.event(name, values); return }
                try? await Task.sleep(for: .seconds(1))
            }
            notice = "Meiro verarbeitet dein Profil noch. Bitte versuche die Nachricht gleich erneut."
        }
    }
    func search(_ destination: String) { state.destination = destination; state.searched = true; update("search") }
    func favorite(_ hotel: Hotel) {
        if state.favorites.contains(hotel.id) { state.favorites.remove(hotel.id) } else { state.favorites.insert(hotel.id) }
        update("favorite")
    }
    func checkout(_ quote: Quote) { state.quote = quote; update("checkout_started"); showCheckout = true }
    func purchase() {
        guard let quote = state.quote, quote.expires > Date() else { notice = "Das Angebot ist abgelaufen. Bitte wähle deine Reise erneut."; return }
        state.trip = Trip(reference: "DTR-" + String(UUID().uuidString.prefix(6)), quote: quote)
        state.quote = nil; update("booking_confirmed"); showCheckout = false; selectedHotel = nil; tab = 2
    }
    func handoff() -> URL? {
        guard let mobileID = meiro.userID else { notice = "Für die verknüpfte Demo bitte zuerst Analytics erlauben."; return nil }
        var url = URLComponents(string: "https://dtrdemo.netlify.app/" + (state.quote.map { "hotel/\($0.hotelID)" } ?? ""))!
        url.queryItems = [.init(name: "meiro_mobile_identity", value: mobileID)]
        if let q = state.quote {
            url.queryItems?.append(contentsOf: [.init(name: "board", value: q.board), .init(name: "room", value: q.room), .init(name: "adults", value: String(q.adults)), .init(name: "children", value: String(q.children))])
        }
        meiro.link(url.url!); return url.url
    }
    func open(_ url: URL) {
        guard url.scheme == "dertour-demo" else { return }
        switch url.host {
        case "hotel": selectedHotel = Hotel.all.first { $0.id == url.lastPathComponent }; tab = 0
        case "trip": tab = 2; showStudio = false
        case "saved": tab = 1; showStudio = false
        case "resume": if state.quote != nil { showCheckout = true; showStudio = false }
        case "transfer":
            if state.trip != nil && state.trip?.cancelled != true && state.trip?.completed != true && !state.serviceCase { state.trip?.transfer = true; update("transfer_added"); tab = 2; showStudio = false }
        case "price":
            if let watch = state.watch { selectedHotel = watch.quote.hotel; tab = 0; showStudio = false }
        default: break
        }
        meiro.link(url)
    }
    func seedTrip() {
        let hotel = selectedHotel ?? Hotel.all[0]
        state.trip = Trip(reference: "DTR-DEMO", quote: Quote(hotel: hotel)); state.quote = nil
        update("demo_trip_created"); tab = 2
    }
    func reset() { let consent = state.consent; state = MobileState(); state.consent = consent; update("reset"); tab = 0 }
    func simulatePrice() {
        guard var watch = state.watch else { notice = "Speichere zuerst einen Preisalarm auf einer Hotelseite."; return }
        guard state.marketing else { notice = "Bitte Reiseangebote im Profil erlauben."; return }
        watch.triggered = true; watch.simulatedPrice = max(1, watch.threshold - 20); state.watch = watch; update("price_drop")
        triggerWhenProfileReady("dtr_price_drop", values: ["price": watch.simulatedPrice!, "hotel_id": watch.quote.hotelID])
    }
    func previewNotification() async {
        let center = UNUserNotificationCenter.current()
        do {
            guard try await center.requestAuthorization(options: [.alert, .sound]) else { notice = "Benachrichtigungen sind in iOS nicht erlaubt."; return }
            let content = UNMutableNotificationContent(); content.title = "DERTOUR · Deine Reise wartet"; content.body = "Öffne deine Reiseunterlagen. Lokale Simulator-Demo, kein Meiro-Push."; content.sound = .default; content.userInfo = ["route": "dertour-demo://trip"]
            try await center.add(.init(identifier: UUID().uuidString, content: content, trigger: UNTimeIntervalNotificationTrigger(timeInterval: 4, repeats: false)))
            meiro.event("dtr_local_notification_preview", ["delivery": "local_simulator"])
        } catch { notice = "Die lokale Vorschau konnte nicht erstellt werden." }
    }
}
