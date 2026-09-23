import SwiftUI
import UserNotifications

final class AppDelegate: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate {
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
        UNUserNotificationCenter.current().delegate = self; return true
    }
    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) { completionHandler([.banner, .sound]) }
    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
        if let route = response.notification.request.content.userInfo["route"] as? String, let url = URL(string: route) { DispatchQueue.main.async { UIApplication.shared.open(url) } }; completionHandler()
    }
}
@main
struct DERTOURApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var delegate
    @StateObject var store = AppStore()
    var body: some Scene {
        WindowGroup {
            RootView().environmentObject(store).tint(Brand.red).preferredColorScheme(.light)
                .onOpenURL { store.open($0) }
                .task {
                    while !Task.isCancelled {
                        await store.meiro.checkProfile(revision: store.state.revision)
                        try? await Task.sleep(for: .seconds(6))
                    }
                }
        }
    }
}
enum Brand {
    static let red = Color(red: 0.86, green: 0.03, blue: 0.13)
    static let ink = Color(red: 0.17, green: 0.14, blue: 0.13)
    static let cream = Color(red: 0.98, green: 0.96, blue: 0.93)
}
struct RedButton: View {
    let title: String; var action: () -> Void
    var body: some View { Button(action: action) { Text(title).font(.headline).frame(maxWidth: .infinity).padding(.vertical, 16).background(Brand.red, in: RoundedRectangle(cornerRadius: 12)).foregroundStyle(.white) }.buttonStyle(.plain) }
}
struct Eyebrow: View { let text: String; var body: some View { Text(text.uppercased()).font(.system(size: 11, weight: .bold)).tracking(1.4).foregroundStyle(Brand.red) } }
struct Photo: View {
    let hotel: Hotel; var height: CGFloat = 190
    var body: some View { GeometryReader { geometry in Image(uiImage: UIImage(contentsOfFile: Bundle.main.path(forResource: hotel.photo, ofType: "jpg") ?? "") ?? UIImage()).resizable().scaledToFill().frame(width: geometry.size.width, height: height).clipped() }.frame(height: height).contentShape(Rectangle()).allowsHitTesting(false) }
}
