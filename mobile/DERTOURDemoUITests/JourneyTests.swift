import XCTest
final class JourneyTests: XCTestCase {
    func testBookingAndOfflineDocuments() {
        let app = XCUIApplication()
        app.launchArguments = ["--uitest-reset"]
        app.launch()
        XCTAssertTrue(app.buttons["Personalisierung erlauben"].waitForExistence(timeout: 15))
        app.buttons["Personalisierung erlauben"].tap()
        let hotel = app.staticTexts["Calimera Fido Gardens"].firstMatch
        for _ in 0..<4 { if hotel.isHittable { break }; app.swipeUp() }
        XCTAssertTrue(hotel.waitForExistence(timeout: 10)); hotel.tap()
        let inclusive = app.buttons["All Inclusive"]
        for _ in 0..<5 { if inclusive.isHittable { break }; app.swipeUp() }
        XCTAssertTrue(inclusive.isHittable); inclusive.tap()
        let book = app.buttons["Reise vormerken"].firstMatch
        for _ in 0..<3 { if book.isHittable { break }; app.swipeUp() }
        book.tap()
        XCTAssertTrue(app.staticTexts["Deine Reise auf einen Blick"].waitForExistence(timeout: 10))
        let consent = app.switches["Ich bestätige eine reine Demo-Buchung ohne Zahlung."]
        for _ in 0..<4 { if consent.isHittable { break }; app.swipeUp() }
        consent.tap()
        app.buttons["Demo-Buchung bestätigen"].tap()
        let documents = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "Reiseunterlagen")).firstMatch
        XCTAssertTrue(documents.waitForExistence(timeout: 10)); documents.tap()
        XCTAssertTrue(app.staticTexts["DEMO · KEIN REISEDOKUMENT"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["Offline auf diesem iPhone gespeichert"].exists)
        let screenshot = XCTAttachment(screenshot: app.screenshot()); screenshot.name = "DERTOUR offline trip documents"; screenshot.lifetime = .keepAlways; add(screenshot)
        app.terminate(); app.launchArguments = []; app.launch()
        app.tabBars.buttons["Meine Reise"].tap()
        XCTAssertTrue(app.staticTexts["Calimera Fido Gardens"].waitForExistence(timeout: 5))
    }
    func testDeclinedConsentAndNativeNavigation() {
        let app = XCUIApplication(); app.launchArguments = ["--uitest-reset"]; app.launch()
        XCTAssertTrue(app.buttons["Ohne Analytics fortfahren"].waitForExistence(timeout: 10)); app.buttons["Ohne Analytics fortfahren"].tap()
        app.tabBars.buttons["Profil"].tap()
        XCTAssertEqual(app.switches["Analytics & Personalisierung"].value as? String, "0")
        app.buttons["Meiro Demo Studio"].tap()
        XCTAssertTrue(app.staticTexts["Tracking deaktiviert"].waitForExistence(timeout: 5))
        app.buttons["Create pre-departure trip"].tap()
        XCTAssertTrue(app.staticTexts["Calimera Fido Gardens"].waitForExistence(timeout: 5))
    }
    func testNativeMeiroInlineMessageAndLiveProfile() {
        let app = XCUIApplication(); app.launchArguments = ["--uitest-reset"]; app.launch()
        XCTAssertTrue(app.buttons["Personalisierung erlauben"].waitForExistence(timeout: 15)); app.buttons["Personalisierung erlauben"].tap()
        let headline = app.webViews.staticTexts["Ein kleiner Tap. Ein großer Urlaub."]
        Thread.sleep(forTimeInterval: 5)
        app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.70)).press(forDuration: 0.05, thenDragTo: app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.43)))
        if !headline.waitForExistence(timeout: 20) {
            print("HOME DIAGNOSTICS " + app.debugDescription)
            app.tabBars.buttons["Profil"].tap(); app.buttons["Meiro Demo Studio"].tap()
            print("DTR DIAGNOSTICS " + app.debugDescription)
            XCTFail("Native inline not found"); return
        }
        let shot = XCTAttachment(screenshot: app.screenshot()); shot.name = "Native Meiro inline message"; shot.lifetime = .keepAlways; add(shot)
        app.webViews.links.matching(NSPredicate(format: "label CONTAINS %@", "Mallorca entdecken")).firstMatch.tap()
        XCTAssertTrue(app.navigationBars["Dein Wunschhotel"].waitForExistence(timeout: 10))
        app.buttons["Fertig"].tap()
        app.tabBars.buttons["Profil"].tap(); app.buttons["Meiro Demo Studio"].tap()
        let status = app.staticTexts.matching(NSPredicate(format: "label BEGINSWITH %@", "Live Meiro")).firstMatch
        XCTAssertTrue(status.waitForExistence(timeout: 60))
    }
    func testNativeFeedbackModal() {
        let app = XCUIApplication(); app.launchArguments = ["--uitest-reset"]; app.launch()
        XCTAssertTrue(app.buttons["Personalisierung erlauben"].waitForExistence(timeout: 15)); app.buttons["Personalisierung erlauben"].tap()
        app.tabBars.buttons["Profil"].tap(); app.buttons["Meiro Demo Studio"].tap()
        app.buttons["Create pre-departure trip"].tap()
        app.tabBars.buttons["Profil"].tap(); app.buttons["Meiro Demo Studio"].tap()
        app.buttons["Complete trip / request feedback"].tap()
        let close = app.buttons["Close message"]
        XCTAssertTrue(close.waitForExistence(timeout: 30))
        let shot = XCTAttachment(screenshot: app.screenshot()); shot.name = "Native Meiro feedback modal"; shot.lifetime = .keepAlways; add(shot)
        app.webViews.links.matching(NSPredicate(format: "label CONTAINS %@", "Reise bewerten")).firstMatch.tap()
        XCTAssertTrue(app.buttons["Bewertung speichern"].waitForExistence(timeout: 10))
    }

    func testNativeSavedBookingRecovery() {
        let app = XCUIApplication(); app.launchArguments = ["--uitest-reset"]; app.launch()
        XCTAssertTrue(app.buttons["Personalisierung erlauben"].waitForExistence(timeout: 15)); app.buttons["Personalisierung erlauben"].tap()
        app.tabBars.buttons["Profil"].tap()
        let marketing = app.switches["Reiseangebote & Preisalarme"]
        marketing.coordinate(withNormalizedOffset: CGVector(dx: 0.92, dy: 0.5)).tap()
        XCTAssertEqual(marketing.value as? String, "1")
        app.tabBars.buttons["Entdecken"].tap()
        Thread.sleep(forTimeInterval: 5)
        let hotel = app.staticTexts["Calimera Fido Gardens"].firstMatch
        for _ in 0..<5 { if hotel.isHittable { break }; app.swipeUp() }
        hotel.tap()
        XCTAssertTrue(app.navigationBars["Dein Wunschhotel"].waitForExistence(timeout: 10))
        let book = app.buttons["Reise vormerken"].firstMatch
        for _ in 0..<5 { if book.isHittable { break }; app.swipeUp() }
        book.tap()
        let save = app.buttons["Für später speichern"]
        for _ in 0..<4 { if save.isHittable { break }; app.swipeUp() }
        save.tap()
        let resume = app.webViews.links.matching(NSPredicate(format: "label CONTAINS %@", "Angebot fortsetzen")).firstMatch
        XCTAssertTrue(resume.waitForExistence(timeout: 30)); resume.tap()
        XCTAssertTrue(app.staticTexts["Deine Reise auf einen Blick"].waitForExistence(timeout: 15))
    }

}
