import XCTest
@testable import MartialGodCore

/// Who a fight's ending is ABOUT.
///
/// The reference build phrases all four endings with the winner as subject, which
/// produces "You could not continue." for a fight you won by knockout. That bug
/// survived every playtest of M1 because it only appears in two of four endings and
/// only in one of the two voices. These tests exist so it cannot be retyped.
final class OutcomeSubjectTests: XCTestCase {

    private func outcome(_ reason: String, winner: String? = "player") -> Outcome {
        Outcome(winnerID: winner, reason: reason, terminal: nil, note: "")
    }

    // MARK: - the mapping itself

    func testEndingsThatNameWhatTheWinnerDid() {
        XCTAssertEqual(Outcome.Reason.finished.subject, .winner)
        XCTAssertEqual(Outcome.Reason.stopped.subject, .winner)
    }

    func testEndingsThatNameWhatTheLoserCouldNotDo() {
        XCTAssertEqual(Outcome.Reason.unconscious.subject, .loser)
        XCTAssertEqual(Outcome.Reason.yielded.subject, .loser)
    }

    /// The subject must actually differ across the set. A mapping that answered
    /// `.winner` for everything would pass both tests above if one of them were ever
    /// deleted, and would be exactly the reference's bug.
    func testTheSubjectIsNotConstant() {
        let subjects = Set(Outcome.Reason.allCases.map { $0.subject == .winner })
        XCTAssertEqual(subjects.count, 2,
                       "every ending resolves to the same subject — this is the reference's bug")
    }

    // MARK: - the reasons the simulation can actually produce

    /// Every `reason:` literal in the simulation must be a `Reason` this build knows.
    ///
    /// This is the guard that matters. A new ending added to `Fight.swift` without a
    /// case here would fall to `knownReason == nil` and be narrated as a bare "You
    /// won." — correct, silent, and impossible to notice. Read from source rather than
    /// played out, because reaching every ending from a fight requires conditions no
    /// unit test should have to stage.
    func testEveryReasonTheSimulationEmitsIsKnown() throws {
        let src = try String(contentsOf: fightSource(), encoding: .utf8)
        let code = strippingComments(src)

        var found = Set<String>()
        // `reason: "x"` as written at every construction site, plus the `.over` events.
        var search = code[...]
        while let r = search.range(of: #"reason: ""#) {
            let rest = search[r.upperBound...]
            guard let end = rest.firstIndex(of: "\"") else { break }
            found.insert(String(rest[..<end]))
            search = rest[end...]
        }

        XCTAssertFalse(found.isEmpty, "found no reason literals — this test has gone blind")
        for reason in found.sorted() {
            XCTAssertNotNil(Outcome.Reason(rawValue: reason),
                            "the simulation can end a fight with reason \"\(reason)\" and nothing "
                            + "knows who that sentence is about")
        }
    }

    /// The Final Inch picks its reason from a variable, not a literal, so the scan
    /// above cannot see it. Both of its values are asserted here by hand.
    func testTheFinalInchReasonsAreKnown() {
        XCTAssertNotNil(Outcome.Reason(rawValue: "stopped"))
        XCTAssertNotNil(Outcome.Reason(rawValue: "finished"))
        let src = try? String(contentsOf: fightSource(), encoding: .utf8)
        let code = strippingComments(src ?? "")
        XCTAssertTrue(code.contains(#"result.executed == "stop" ? "stopped" : "finished""#),
                      "the Final Inch no longer produces the two reasons this test pins — "
                      + "re-read Fight.swift and update Outcome.Reason with it")
    }

    /// An unknown ending must read as unknown, not as a confident guess.
    func testAnUnrecognisedReasonHasNoSubject() {
        XCTAssertNil(outcome("disqualified").knownReason)
    }

    // MARK: - source access, shared with PortContractTests

    private func fightSource() -> URL {
        URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()   // MartialGodCoreTests
            .deletingLastPathComponent()   // Tests
            .deletingLastPathComponent()   // package root
            .appendingPathComponent("Sources/MartialGodCore/Fight.swift")
    }

    /// Comments stripped so a doc comment naming an ending cannot stand in for code
    /// that produces one — the same reason `PortContractTests` does this.
    private func strippingComments(_ src: String) -> String {
        var out = ""
        var i = src.startIndex
        var depth = 0
        var inLine = false
        while i < src.endIndex {
            let c = src[i]
            let next = src.index(after: i)
            let two = next < src.endIndex ? String([c, src[next]]) : ""
            if inLine {
                if c == "\n" { inLine = false; out.append(c) }
            } else if depth > 0 {
                if two == "/*" { depth += 1; i = next }
                else if two == "*/" { depth -= 1; i = next }
                else if c == "\n" { out.append(c) }
            } else if two == "//" { inLine = true; i = next }
            else if two == "/*" { depth += 1; i = next }
            else { out.append(c) }
            i = src.index(after: i)
        }
        return out
    }
}
