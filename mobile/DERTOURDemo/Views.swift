import SwiftUI

struct RootView: View {
    @EnvironmentObject var store: AppStore
    var body: some View {
        TabView(selection: $store.tab) {
            NavigationStack { DiscoverView() }.tabItem { Label("Entdecken", systemImage: "safari") }.tag(0)
            NavigationStack { SavedView() }.tabItem { Label("Merkliste", systemImage: "heart") }.tag(1)
            NavigationStack { TripView() }.tabItem { Label("Meine Reise", systemImage: "suitcase.rolling") }.tag(2)
            NavigationStack { ProfileView() }.tabItem { Label("Profil", systemImage: "person.crop.circle") }.tag(3)
        }
        .foregroundStyle(Brand.ink)
        .sheet(item: $store.selectedHotel) { hotel in NavigationStack { HotelView(hotel: hotel) }.environmentObject(store) }
        .sheet(isPresented: $store.showCheckout) { NavigationStack { CheckoutView() }.environmentObject(store) }
        .sheet(isPresented: $store.showStudio) { NavigationStack { StudioView(client: store.meiro) }.environmentObject(store) }
        .fullScreenCover(isPresented: Binding(get: { store.state.consent == nil }, set: { _ in })) { ConsentView().environmentObject(store) }
        .alert("DERTOUR Demo", isPresented: Binding(get: { store.notice != nil }, set: { if !$0 { store.notice = nil } })) { Button("Verstanden") { store.notice = nil } } message: { Text(store.notice ?? "") }
        .onChange(of: store.tab) { _, tab in store.screen(["home", "saved", "trip", "profile"][tab]) }
    }
}
struct ConsentView: View {
    @EnvironmentObject var store: AppStore
    var body: some View {
        VStack(alignment: .leading, spacing: 24) {
            Text("DERTOUR").font(.system(size: 30, weight: .black)).foregroundStyle(Brand.red)
            Spacer()
            Image(systemName: "sun.max").font(.system(size: 64, weight: .light)).foregroundStyle(Brand.red)
            Text("Dein Urlaub.\nImmer dabei.").font(.system(size: 42, weight: .bold)).tracking(-1.5)
            Text("Entdecke deine nächste Reise und behalte alle Urlaubsmomente an einem Ort.").font(.title3).foregroundStyle(.secondary)
            Text("Mit deiner Einwilligung senden wir App-Aktivitäten an Meiro, um personalisierte Inhalte zu demonstrieren. Keine Werbe-ID, keine echten Buchungen. Du kannst deine Wahl im Profil ändern.").font(.subheadline).foregroundStyle(.secondary)
            Spacer()
            RedButton(title: "Personalisierung erlauben") { store.consent(true); store.screen("home") }
            Button("Ohne Analytics fortfahren") { store.consent(false) }.frame(maxWidth: .infinity).padding(.bottom)
            Text("UNABHÄNGIGE DERTOUR DEMO").font(.caption2).tracking(1.5).frame(maxWidth: .infinity).foregroundStyle(.secondary)
        }.padding(28).background(Brand.cream)
    }
}
struct DiscoverView: View {
    @EnvironmentObject var store: AppStore
    @State var query = ""
    var hotels: [Hotel] { Hotel.all.filter { (store.state.destination == "Alle Reiseziele" || $0.destination == store.state.destination) && (query.isEmpty || ($0.name + $0.destination).localizedCaseInsensitiveContains(query)) } }
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                HStack { Text("DERTOUR").font(.system(size: 28, weight: .black)).foregroundStyle(Brand.red); Spacer(); Button { store.showStudio = true } label: { Image(systemName: "slider.horizontal.3").font(.title3).padding(12).background(Brand.cream, in: Circle()) }.accessibilityLabel("Meiro Demo Studio") }
                ZStack(alignment: .bottomLeading) {
                    Photo(hotel: Hotel.all[4], height: 260)
                    LinearGradient(colors: [.clear, .black.opacity(0.7)], startPoint: .center, endPoint: .bottom)
                    VStack(alignment: .leading, spacing: 6) { Text("DEIN NÄCHSTES LIEBLINGSZIEL").font(.system(size: 10, weight: .bold)).tracking(1.4); Text("Raus aus dem Alltag.\nRein ins Glück.").font(.system(size: 30, weight: .bold)).tracking(-0.7) }.foregroundStyle(.white).padding(22)
                }.clipShape(RoundedRectangle(cornerRadius: 20))
                HStack { Image(systemName: "magnifyingglass").foregroundStyle(Brand.red); TextField("Wohin zieht es dich?", text: $query).submitLabel(.search).onSubmit { store.search(store.state.destination) } }.padding(17).background(Brand.cream, in: RoundedRectangle(cornerRadius: 12))
                ScrollView(.horizontal, showsIndicators: false) { HStack(spacing: 8) { ForEach(["Alle Reiseziele", "Mallorca", "Griechenland", "Türkei", "Ägypten", "Malediven"], id: \.self) { destination in Button { store.search(destination) } label: { Text(destination == "Alle Reiseziele" ? "Alle" : destination).font(.subheadline.weight(.semibold)).padding(.horizontal, 16).padding(.vertical, 10).background(store.state.destination == destination ? Brand.red : Brand.cream, in: Capsule()).foregroundStyle(store.state.destination == destination ? .white : Brand.ink) } } } }
                NativeMessageSlot(placement: "dtr_home", client: store.meiro)
                if store.state.quote != nil {
                    Button { store.showCheckout = true } label: { HStack { Image(systemName: "clock.arrow.circlepath"); VStack(alignment: .leading) { Text("Dein Urlaub wartet").font(.headline); Text("Gespeichertes Angebot fortsetzen").font(.caption) }; Spacer(); Image(systemName: "arrow.right") }.padding(18).background(Brand.cream, in: RoundedRectangle(cornerRadius: 14)) }.buttonStyle(.plain)
                }
                HStack(alignment: .firstTextBaseline) { Text("Urlaub, der zu dir passt").font(.title2.bold()); Spacer(); Text("\(hotels.count) Hotels").font(.caption).foregroundStyle(.secondary) }
                if hotels.isEmpty { ContentUnavailableView.search(text: query) }
                ForEach(hotels) { HotelCard(hotel: $0) }
                Text("Demo-Angebote · keine Buchung oder Zahlung").font(.caption).foregroundStyle(.secondary).frame(maxWidth: .infinity)
            }.padding(20)
        }.background(.white).toolbar(.hidden, for: .navigationBar).task { store.screen("home") }
    }
}
struct HotelCard: View {
    @EnvironmentObject var store: AppStore
    let hotel: Hotel
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            ZStack(alignment: .topTrailing) {
                Button { store.selectedHotel = hotel } label: { Photo(hotel: hotel) }.buttonStyle(.plain)
                Button { store.favorite(hotel) } label: { Image(systemName: store.state.favorites.contains(hotel.id) ? "heart.fill" : "heart").foregroundStyle(Brand.red).padding(12).background(.white, in: Circle()) }.padding(12).accessibilityLabel("\(hotel.name) merken")
            }
            Button { store.selectedHotel = hotel } label: {
                VStack(alignment: .leading, spacing: 8) {
                    HStack { Text(hotel.destination + " · " + hotel.town).font(.caption).foregroundStyle(.secondary); Spacer(); Label("\(hotel.rating)%", systemImage: "hand.thumbsup.fill").font(.caption.bold()).foregroundStyle(.green) }
                    Text(hotel.name).font(.headline)
                    Text(String(repeating: "★", count: hotel.stars)).font(.caption).foregroundStyle(.orange)
                    HStack { Text("7 Nächte · inkl. Flug").font(.caption).foregroundStyle(.secondary); Spacer(); Text("ab \(hotel.price.euro)").font(.title3.bold()); Text("p. P.").font(.caption) }
                }.padding(16).foregroundStyle(Brand.ink)
            }.buttonStyle(.plain)
        }.background(.white).clipShape(RoundedRectangle(cornerRadius: 16)).overlay(RoundedRectangle(cornerRadius: 16).stroke(.black.opacity(0.08)))
    }
}
struct HotelView: View {
    @EnvironmentObject var store: AppStore
    @Environment(\.dismiss) var dismiss
    let hotel: Hotel
    @State var board = "Halbpension"
    @State var room = "Doppelzimmer Standard"
    @State var adults = 2
    @State var children = 0
    @State var nights = 7
    @State var departure = Calendar.current.date(byAdding: .day, value: 7, to: Date())!
    @State var showWatch = false
    @State var threshold = ""
    @State var watchConsent = false
    var quote: Quote {
        var result = Quote(hotel: hotel, board: board, room: room, adults: adults, children: children, departure: departure, nights: nights)
        if let watch = store.state.watch, watch.quote.hotelID == hotel.id,
           watch.quote.board == board, watch.quote.room == room,
           watch.quote.adults == adults, watch.quote.children == children,
           watch.quote.nights == nights, Calendar.current.isDate(watch.quote.departure, inSameDayAs: departure),
           let price = watch.simulatedPrice { result.total = price }
        return result
    }
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                Photo(hotel: hotel, height: 240).clipShape(RoundedRectangle(cornerRadius: 18))
                Eyebrow(text: "\(hotel.destination) · \(hotel.town)")
                Text(hotel.name).font(.largeTitle.bold()).tracking(-1)
                Label("\(hotel.rating)% Weiterempfehlung", systemImage: "hand.thumbsup.fill").font(.subheadline).foregroundStyle(.green)
                Text(hotel.amenities.joined(separator: "  ·  ")).font(.subheadline).foregroundStyle(.secondary)
                Divider()
                Text("Deine Reise, deine Wahl").font(.title2.bold())
                DatePicker("Abreise", selection: $departure, in: Date()..., displayedComponents: .date)
                Stepper("\(nights) Nächte", value: $nights, in: 3...21)
                Stepper("\(adults) Erwachsene", value: $adults, in: 1...6)
                Stepper("\(children) Kinder", value: $children, in: 0...4)
                Picker("Verpflegung", selection: $board) { Text("Halbpension").tag("Halbpension"); Text("All Inclusive").tag("All Inclusive") }.pickerStyle(.segmented)
                Picker("Zimmer", selection: $room) { Text("Standard").tag("Doppelzimmer Standard"); Text("Superior").tag("Doppelzimmer Superior") }.pickerStyle(.segmented)
                NativeMessageSlot(placement: "dtr_hotel", client: store.meiro)
                HStack { VStack(alignment: .leading) { Text("Gesamtpreis").font(.subheadline); Text("\(adults + children) Personen · \(nights) Nächte").font(.caption).foregroundStyle(.secondary) }; Spacer(); Text(quote.total.euro).font(.system(size: 30, weight: .bold)) }
                RedButton(title: "Reise vormerken") { let saved = quote; dismiss(); DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) { store.checkout(saved) } }
                Button { threshold = String(max(1, quote.total - 100)); showWatch.toggle() } label: { Label("Preis beobachten", systemImage: "bell.badge").frame(maxWidth: .infinity) }
                if showWatch {
                    VStack(alignment: .leading, spacing: 14) {
                        TextField("Dein Preislimit (€)", text: $threshold).keyboardType(.numberPad).textFieldStyle(.roundedBorder)
                        Toggle("Preisalarm für dieses Demo-Angebot erlauben", isOn: $watchConsent).font(.subheadline)
                        RedButton(title: "Preisalarm speichern") {
                            guard watchConsent, let amount = Int(threshold), amount > 0 else { store.notice = "Bitte ein gültiges Preislimit und deine Einwilligung angeben."; return }
                            store.state.marketing = true; store.state.watch = Watch(quote: quote, threshold: amount); store.update("watch_created"); showWatch = false; store.notice = "Preisalarm gespeichert. Kein echter Versand."
                        }
                    }.padding(18).background(Brand.cream, in: RoundedRectangle(cornerRadius: 14))
                }
                Text("Synthetische Preise · keine echte Verfügbarkeit").font(.caption).foregroundStyle(.secondary).frame(maxWidth: .infinity)
            }.padding(20)
        }.navigationTitle("Dein Wunschhotel").navigationBarTitleDisplayMode(.inline).toolbar { ToolbarItem(placement: .topBarTrailing) { Button("Fertig") { dismiss() } } }.task {
            if let watch = store.state.watch, watch.quote.hotelID == hotel.id {
                board = watch.quote.board; room = watch.quote.room; adults = watch.quote.adults
                children = watch.quote.children; departure = watch.quote.departure; nights = watch.quote.nights
            }
            store.meiro.event("dtr_hotel_view", ["hotel_id": hotel.id, "destination": hotel.destination]); store.screen("hotel") }
    }
}
struct CheckoutView: View {
    @EnvironmentObject var store: AppStore
    @Environment(\.dismiss) var dismiss
    @State var accepted = false
    var body: some View {
        ScrollView {
            if let q = store.state.quote {
                VStack(alignment: .leading, spacing: 22) {
                    Eyebrow(text: "Fast im Urlaub")
                    Text("Deine Reise auf einen Blick").font(.largeTitle.bold())
                    Photo(hotel: q.hotel).clipShape(RoundedRectangle(cornerRadius: 16))
                    Text(q.hotel.name).font(.title2.bold())
                    Text("\(q.departure.formatted(date: .abbreviated, time: .omitted)) · \(q.nights) Nächte\n\(q.adults) Erwachsene, \(q.children) Kinder\n\(q.room) · \(q.board)").foregroundStyle(.secondary)
                    HStack { Text("Gesamtpreis"); Spacer(); Text(q.total.euro).font(.title.bold()) }
                    Toggle("Ich bestätige eine reine Demo-Buchung ohne Zahlung.", isOn: $accepted).font(.subheadline)
                    RedButton(title: "Demo-Buchung bestätigen") { store.purchase() }.disabled(!accepted).opacity(accepted ? 1 : 0.5)
                    Button("Für später speichern") { dismiss(); store.update("checkout_saved"); store.triggerWhenProfileReady("dtr_booking_saved", values: ["hotel_id": q.hotelID]) }.frame(maxWidth: .infinity)
                }.padding(24)
            } else { ContentUnavailableView("Kein offenes Angebot", systemImage: "suitcase") }
        }.navigationTitle("Reise vormerken").navigationBarTitleDisplayMode(.inline).toolbar { ToolbarItem(placement: .topBarTrailing) { Button("Schließen") { dismiss() } } }.task { store.screen("checkout") }
    }
}
struct SavedView: View {
    @EnvironmentObject var store: AppStore
    var body: some View {
        ScrollView { VStack(alignment: .leading, spacing: 20) {
            if let watch = store.state.watch {
                VStack(alignment: .leading, spacing: 12) {
                    Eyebrow(text: "Dein Preisalarm")
                    Text(watch.quote.hotel.name).font(.headline)
                    Text("Preislimit: \(watch.threshold.euro) · \(watch.quote.board)").font(.subheadline)
                    if let price = watch.simulatedPrice { Text("Simulierter Preis: \(price.euro)").font(.headline).foregroundStyle(Brand.red) }
                    Button("Angebot ansehen") { store.selectedHotel = watch.quote.hotel }
                    Button("Preisalarm beenden", role: .destructive) { store.state.watch = nil; store.update("watch_stopped") }.font(.caption)
                }.padding(20).background(Brand.cream, in: RoundedRectangle(cornerRadius: 16))
            }
            ForEach(Hotel.all.filter { store.state.favorites.contains($0.id) }) { HotelCard(hotel: $0) }
            if store.state.favorites.isEmpty && store.state.watch == nil { ContentUnavailableView("Platz für Urlaubsträume", systemImage: "heart", description: Text("Merke dir ein Hotel oder lege deinen ersten Preisalarm an.")) }
        }.padding(20) }.navigationTitle("Deine Merkliste").task { store.screen("saved") }
    }
}
