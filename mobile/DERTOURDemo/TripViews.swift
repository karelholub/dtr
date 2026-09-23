import SwiftUI

struct TripView: View {
    @EnvironmentObject var store: AppStore
    @State var showDocuments = false
    @State var rating = 5
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                if let trip = store.state.trip {
                    Photo(hotel: trip.quote.hotel, height: 190).clipShape(RoundedRectangle(cornerRadius: 18))
                    Eyebrow(text: trip.cancelled ? "Reise storniert" : trip.completed ? "Willkommen zurück" : "Vorfreude, gut organisiert")
                    Text(trip.quote.hotel.name).font(.title.bold())
                    Text("\(trip.quote.departure.formatted(date: .abbreviated, time: .omitted)) · \(trip.quote.nights) Nächte · \(trip.reference)").font(.subheadline).foregroundStyle(.secondary)
                    if trip.cancelled { Text("Deine Demo-Reise wurde storniert. Reiseangebote für diese Buchung werden nicht mehr ausgelöst.") }
                    else {
                        if store.state.stage == "booked" && store.state.marketing && !trip.transfer { NativeMessageSlot(placement: "dtr_trip", client: store.meiro) }
                        VStack(spacing: 0) {
                            tripRow("Reiseunterlagen", subtitle: "Auch ohne Internet verfügbar", icon: "doc.text", action: { showDocuments = true; store.meiro.event("dtr_documents_opened") })
                            Divider().padding(.leading, 55)
                            tripRow(trip.checkedIn ? "Check-in vorgemerkt" : "Check-in vorbereiten", subtitle: "Demo · kein Airline-Check-in", icon: "airplane", action: { store.state.trip?.checkedIn = true; store.update("checkin_completed"); store.meiro.event("dtr_checkin_ready") })
                            Divider().padding(.leading, 55)
                            tripRow(trip.transfer ? "Transfer ist organisiert" : "Entspannt zum Hotel", subtitle: trip.transfer ? "Für deine Reise vorgemerkt" : "Flughafentransfer · 79 € (Demo)", icon: "bus", action: { if !trip.transfer { store.state.trip?.transfer = true; store.update("transfer_added") } })
                        }.background(Brand.cream, in: RoundedRectangle(cornerRadius: 16))
                        if trip.completed {
                            VStack(alignment: .leading, spacing: 16) {
                                Text("Wie war dein Urlaub?").font(.title2.bold())
                                HStack { ForEach(1...5, id: \.self) { n in Button { rating = n } label: { Image(systemName: n <= rating ? "star.fill" : "star").font(.title2).foregroundStyle(.orange) }.accessibilityLabel("\(n) Sterne") } }
                                RedButton(title: trip.feedback == nil ? "Bewertung speichern" : "Bewertung aktualisieren") { store.state.trip?.feedback = rating; store.update("feedback_submitted"); store.notice = "Danke für deine Demo-Bewertung." }
                            }
                        }
                        Button { store.state.serviceCase = true; store.update("service_case_opened"); store.notice = "Dein Demo-Servicefall ist eröffnet. Werbliche In-app-Nachrichten für diese Reise werden unterdrückt." } label: { Label("Hilfe zu meiner Reise", systemImage: "bubble.left.and.bubble.right").frame(maxWidth: .infinity) }
                        Text("Alle Reiseaktionen sind simuliert. Deine Unterlagen werden lokal gespeichert.").font(.caption).foregroundStyle(.secondary)
                    }
                } else {
                    ContentUnavailableView("Dein Urlaub beginnt hier", systemImage: "suitcase.rolling", description: Text("Nach deiner Demo-Buchung findest du hier Reiseplan, Unterlagen und Extras."))
                    RedButton(title: "Urlaub entdecken") { store.tab = 0 }
                }
            }.padding(20)
        }.navigationTitle("Meine Reise").task { store.screen("trip") }
        .sheet(isPresented: $showDocuments) { NavigationStack { DocumentsView() }.environmentObject(store) }
    }
    func tripRow(_ title: String, subtitle: String, icon: String, action: @escaping () -> Void) -> some View {
        Button(action: action) { HStack(spacing: 14) { Image(systemName: icon).foregroundStyle(Brand.red).frame(width: 25); VStack(alignment: .leading, spacing: 4) { Text(title).font(.headline); Text(subtitle).font(.caption).foregroundStyle(.secondary) }; Spacer(); Image(systemName: "chevron.right").font(.caption) }.padding(18) }.buttonStyle(.plain)
    }
}
struct DocumentsView: View {
    @EnvironmentObject var store: AppStore
    @Environment(\.dismiss) var dismiss
    var body: some View {
        VStack(alignment: .leading, spacing: 24) {
            Text("DERTOUR").font(.system(size: 30, weight: .black)).foregroundStyle(Brand.red)
            if let t = store.state.trip {
                Eyebrow(text: "Deine Reiseübersicht")
                Text(t.quote.hotel.name).font(.largeTitle.bold())
                Label("Offline auf diesem iPhone gespeichert", systemImage: "checkmark.icloud").font(.subheadline).foregroundStyle(.green)
                Divider()
                Text("\(t.reference)\n\(t.quote.departure.formatted(date: .long, time: .omitted))\n\(t.quote.nights) Nächte · \(t.quote.adults + t.quote.children) Personen\n\(t.quote.room)\n\(t.quote.board)").lineSpacing(10)
                Divider()
                Text("DEMO · KEIN REISEDOKUMENT").font(.headline).foregroundStyle(Brand.red)
                Text("Nicht als Ticket, Bordkarte oder Buchungsbestätigung verwendbar.").font(.subheadline).foregroundStyle(.secondary)
            }
            Spacer()
        }.padding(26).background(Brand.cream).navigationTitle("Reiseunterlagen").navigationBarTitleDisplayMode(.inline).toolbar { Button("Fertig") { dismiss() } }
    }
}
struct ProfileView: View {
    @EnvironmentObject var store: AppStore
    @Environment(\.openURL) var openURL
    var body: some View {
        List {
            Section { HStack(spacing: 16) { Image(systemName: "person.crop.circle.fill").font(.system(size: 48)).foregroundStyle(Brand.red); VStack(alignment: .leading) { Text("Dein Demo-Reiseprofil").font(.headline); Text("Keine echten Kundendaten").font(.caption).foregroundStyle(.secondary) } } }
            Section("Deine Entscheidungen") {
                Toggle("Analytics & Personalisierung", isOn: Binding(get: { store.state.consent == true }, set: { store.consent($0) }))
                Toggle("Reiseangebote & Preisalarme", isOn: Binding(get: { store.state.marketing }, set: { store.state.marketing = $0; store.update("marketing_permission") }))
                Text("App-Tracking und Reiseangebote sind getrennte Entscheidungen. Es werden keine Werbe-IDs verwendet.").font(.caption).foregroundStyle(.secondary)
            }
            Section("App & Web verbinden") {
                Button { if let url = store.handoff() { openURL(url) } } label: { Label("Im Web weiterstöbern", systemImage: "safari") }
                Text("Öffnet die Web-Demo mit deiner anonymen Meiro-App-ID. Nach Zustimmung im Web kann Meiro beide Geräteaktivitäten zusammenführen.").font(.caption).foregroundStyle(.secondary)
            }
            Section("Präsentation") { Button("Meiro Demo Studio") { store.showStudio = true } }
        }.navigationTitle("Dein Profil")
    }
}
struct StudioView: View {
    @EnvironmentObject var store: AppStore
    @Environment(\.dismiss) var dismiss
    @ObservedObject var client: MeiroClient
    var body: some View {
        List {
            Section("Live connection") {
                Label(client.profileStatus, systemImage: client.serverStage == nil ? "clock" : "checkmark.circle.fill").foregroundStyle(client.serverStage == nil ? Color.secondary : Color.green)
                Text(client.inAppAvailable ? "Native Meiro in-app SDK installed" : "Tracking SDK active. Updated native SDK required for in-app delivery.").font(.caption)
                Text("Source: DERTOUR Demo Mobile").font(.caption)
                if let uid = client.userID { Text("Mobile ID: \(uid)").font(.caption2.monospaced()).textSelection(.enabled) }
                Text("Synthetic data · no payments · no live email or remote push").font(.caption).foregroundStyle(.secondary)
            }
            Section("Demonstrate the journey") {
                Button("Create pre-departure trip") { store.seedTrip(); dismiss() }
                Button("Show home in-app message") { store.tab = 0; dismiss(); DispatchQueue.main.asyncAfter(deadline: .now() + 1) { store.meiro.event("dtr_show_home", ["stage": store.state.stage]) } }
                Button("Show saved-booking reminder") { dismiss(); DispatchQueue.main.asyncAfter(deadline: .now() + 1) { if store.state.stage == "checkout" && store.state.marketing { store.triggerWhenProfileReady("dtr_booking_saved") } else { store.notice = "Speichere zuerst ein Angebot und erlaube Reiseangebote im Profil." } } }
                Button("Simulate price drop") { dismiss(); DispatchQueue.main.asyncAfter(deadline: .now() + 1) { store.simulatePrice() } }
                Button("Complete trip / request feedback") { guard store.state.trip != nil else { store.notice = "Bitte zuerst eine Demo-Reise anlegen."; return }; store.state.trip?.completed = true; store.update("trip_completed"); store.tab = 2; dismiss(); DispatchQueue.main.asyncAfter(deadline: .now() + 2) { store.triggerWhenProfileReady("dtr_feedback_prompt") } }
                Button("Cancel demo trip", role: .destructive) { store.state.trip?.cancelled = true; store.update("trip_cancelled") }
            }
            Section("Mobile-specific") {
                Button("Preview local notification") { Task { await store.previewNotification() } }
                Text("This is an iOS local notification, not Meiro/FCM delivery. Tap it to deep-link into the trip. Real remote push needs Firebase and APNs setup.").font(.caption).foregroundStyle(.secondary)
                Text("Offline: open a saved trip, disconnect networking, then reopen Reiseunterlagen. Meiro queues permitted SDK events for retry.").font(.caption)
            }
            Section("Recent SDK calls · not delivery receipts") { ForEach(Array(client.recentEvents.enumerated()), id: \.offset) { _, event in Text(event).font(.caption.monospaced()) } }
            Section { Button("Reset demo scenario", role: .destructive) { store.reset(); dismiss() }; Text("Preserves consent and SDK identity. Native message caps remain in effect.").font(.caption).foregroundStyle(.secondary) }
        }.navigationTitle("Meiro Demo Studio").navigationBarTitleDisplayMode(.inline).toolbar { Button("Fertig") { dismiss() } }
    }
}
