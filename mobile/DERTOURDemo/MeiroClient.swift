import Foundation
import Meiro
import SwiftUI

@MainActor
final class MeiroClient: ObservableObject {
    static let endpoint = URL(string: "https://travel.eu1.pipes.meiro.io/collect/dertour-demo-mobile")!
    @Published var initialized = false
    @Published var recentEvents: [String] = []
    @Published var profileStatus = "Noch keine Einwilligung"
    @Published var serverStage: String? = nil
    private(set) var confirmedRevision: String? = nil
    @Published private(set) var allowed = false
    var userID: String? { initialized && allowed ? MeiroSDK.shared.userID : nil }
    var inAppAvailable: Bool {
        #if MEIRO_IN_APP
        true
        #else
        false
        #endif
    }
    func consent(_ granted: Bool) {
        allowed = granted
        if granted && !initialized {
            #if MEIRO_IN_APP
            var configuration = Configuration(endpoint: Self.endpoint, appID: "de.dertour.demo", pushNotifications: .disabled, automaticTrackingOptions: .init(screenViewTracking: false, lifecycleEventsTracking: true, idfaTracking: false), firebaseProjectID: nil)
            configuration.inAppMessagingEnabled = true
            #else
            let configuration = Configuration(endpoint: Self.endpoint, appID: "de.dertour.demo", pushNotifications: .disabled, automaticTrackingOptions: .init(screenViewTracking: false, lifecycleEventsTracking: true, idfaTracking: false), firebaseProjectID: nil)
            #endif
            MeiroSDK.setupShared(configuration: configuration, logger: DemoSDKLogger())
            initialized = true
            #if MEIRO_IN_APP
            MeiroSDK.shared.inAppMessaging?.onDiagnostic = { [weak self] message in
                NSLog("DTR in-app: %@", message)
                DispatchQueue.main.async { self?.recentEvents = Array((["In-app: " + message] + (self?.recentEvents ?? [])).prefix(10)) }
            }
            #endif
        }
        if initialized {
            MeiroSDK.shared.isEnabled = granted
            MeiroSDK.shared.language = "de"
            #if MEIRO_IN_APP
            if granted { MeiroSDK.shared.inAppMessaging?.resume() } else { MeiroSDK.shared.inAppMessaging?.pause() }
            #endif
        }
        profileStatus = granted ? "SDK aktiv · Profil wird geprüft" : "Tracking deaktiviert"
        if !granted { serverStage = nil; confirmedRevision = nil }
    }
    func event(_ name: String, _ values: [String: Any] = [:]) {
        guard initialized && allowed else { return }
        var payload = values
        payload["name"] = name; payload["synthetic"] = true; payload["demo_site"] = "dertour_mobile"
        payload["event_id"] = UUID().uuidString
        MeiroSDK.shared.trackCustomEvent(payload)
        recentEvents = Array(([name] + recentEvents).prefix(10))
    }
    func screen(_ name: String) {
        guard initialized && allowed else { return }
        MeiroSDK.shared.trackScreenView(name: name)
    }
    func link(_ url: URL) {
        guard initialized && allowed else { return }
        MeiroSDK.shared.trackLinkClick(url)
    }
    func checkProfile(revision: String) async {
        guard let id = userID else { return }
        var components = URLComponents(string: "https://travel.eu1.pipes.meiro.io/profile-api/dertour-mobile-demo")!
        components.queryItems = [.init(name: "identifier_type", value: "mobile_user_id"), .init(name: "identifier_value", value: id)]
        do {
            let (data, response) = try await URLSession.shared.data(from: components.url!)
            guard allowed, let response = response as? HTTPURLResponse, response.statusCode == 200,
                  let root = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let attrs = root["attributes"] as? [String: Any],
                  let rows = attrs["dtr_mobile_context"] as? [[String: Any]], let row = rows.first else {
                profileStatus = "Warte auf Meiro-Profil"; return
            }
            func scalar(_ name: String) -> String? { (row[name] as? [String])?.first ?? row[name] as? String }
            guard scalar("revision") == revision else { profileStatus = "Meiro verarbeitet die letzte Aktion"; return }
            confirmedRevision = revision; serverStage = scalar("stage"); profileStatus = "Live Meiro · \(serverStage ?? "bereit")"
        } catch { profileStatus = "Offline · SDK puffert Ereignisse" }
    }
}

struct NativeMessageSlot: View {
    let placement: String
    @ObservedObject var client: MeiroClient
    var body: some View {
        #if MEIRO_IN_APP
        if client.initialized && client.allowed {
            MeiroInAppMessage(placement: placement, messaging: MeiroSDK.shared.inAppMessaging)
                .fixedSize(horizontal: false, vertical: true)
        }
        #else
        EmptyView()
        #endif
    }
}

final class DemoSDKLogger: MeiroLogger {
    func log(message: String, error: Error?) {
        if message.contains("Event Response") {
            let safe = message.components(separatedBy: "\n").filter { $0.hasPrefix("Event Type:") || $0.hasPrefix("Status Code:") || $0.hasPrefix("Response Body:") }.joined(separator: " · ")
            NSLog("DTR SDK: %@", safe)
        } else if let error { NSLog("DTR SDK error: %@", error.localizedDescription) }
    }
}
