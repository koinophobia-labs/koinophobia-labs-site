import Foundation

/// StanceSystem — the intent grammar, ported from `reference/sim/grammar.js`.
///
/// "The inputs never change. The meaning of the inputs changes."
/// Milestone 1 loads one style; the signature is already plural.
public enum Grammar {
    /// Resolve an intent into a concrete technique. Returns nil when the grammar has
    /// no sentence for this combination at this range.
    public static func resolve(style: String, verb: Verb, intent: Intent, band: Band) -> Technique? {
        // Defensive verbs are intent-agnostic and registered under `any`.
        var t = TechniqueDB.grammar(style, verb, intent)
        if t == nil { t = TechniqueDB.grammar(style, verb, .any) }
        guard let tech = t else { return nil }
        if !tech.band.contains(band) { return nil }
        return tech
    }
}
