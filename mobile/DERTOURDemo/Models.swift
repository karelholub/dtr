import Foundation

struct Hotel: Codable, Identifiable, Hashable {
    let id: String
    let name: String
    let town: String
    let destination: String
    let price: Int
    let rating: Int
    let stars: Int
    let amenities: [String]
    var photo: String { id }
    static let all: [Hotel] = {
        guard let url = Bundle.main.url(forResource: "hotels", withExtension: "json"),
              let data = try? Data(contentsOf: url), let hotels = try? JSONDecoder().decode([Hotel].self, from: data) else { return [] }
        return hotels
    }()
}

struct Quote: Codable, Equatable {
    let id: String
    let hotelID: String
    var board: String
    var room: String
    var adults: Int
    var children: Int
    var nights: Int
    var departure: Date
    var total: Int
    var expires: Date
    init(hotel: Hotel, board: String = "Halbpension", room: String = "Doppelzimmer Standard", adults: Int = 2, children: Int = 0, departure: Date = Calendar.current.date(byAdding: .day, value: 7, to: Date())!, nights: Int = 7) {
        self.id = UUID().uuidString
        self.hotelID = hotel.id; self.board = board; self.room = room; self.adults = adults; self.children = children; self.departure = departure; self.nights = nights
        self.total = Self.price(hotel: hotel, board: board, room: room, adults: adults, children: children, nights: nights)
        self.expires = Date().addingTimeInterval(48 * 3600)
    }
    static func price(hotel: Hotel, board: String, room: String, adults: Int, children: Int, nights: Int) -> Int {
        let perPerson = hotel.price + (board == "All Inclusive" ? 95 : 0) + (room == "Doppelzimmer Superior" ? 120 : 0)
        return Int((Double(perPerson * adults) + Double(perPerson * children) * 0.65) * Double(nights) / 7)
    }
    var hotel: Hotel { Hotel.all.first { $0.id == hotelID } ?? Hotel.all[0] }
}
struct Trip: Codable {
    var reference: String
    var quote: Quote
    var transfer = false
    var checkedIn = false
    var completed = false
    var cancelled = false
    var feedback: Int?
}
struct Watch: Codable {
    var quote: Quote
    var threshold: Int
    var triggered = false
    var simulatedPrice: Int?
}
struct MobileState: Codable {
    var runID = UUID().uuidString
    var revision = UUID().uuidString
    var consent: Bool? = nil
    var marketing = false
    var favorites: Set<String> = []
    var quote: Quote? = nil
    var trip: Trip? = nil
    var watch: Watch? = nil
    var destination = "Alle Reiseziele"
    var serviceCase = false
    var searched = false
    var stage: String {
        if serviceCase { return "care" }
        if trip?.cancelled == true { return "cancelled" }
        if trip?.completed == true { return "completed" }
        if trip != nil { return "booked" }
        if quote != nil { return "checkout" }
        if watch?.triggered == true { return "price" }
        return searched ? "research" : "inspiration"
    }
}
extension Int {
    var euro: String { formatted(.currency(code: "EUR").precision(.fractionLength(0)).locale(Locale(identifier: "de_DE"))) }
}
