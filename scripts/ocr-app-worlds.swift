import Foundation
import Vision
import AppKit
// Read-only OCR of the exact product crops displayed on the pages.
struct Record: Codable { let path: String; let lines: [String] }
var records: [Record] = []
for path in CommandLine.arguments.dropFirst() {
 let url = URL(fileURLWithPath:path)
 let request = VNRecognizeTextRequest()
 request.recognitionLevel = .accurate
 request.usesLanguageCorrection = false
 try VNImageRequestHandler(url:url).perform([request])
 records.append(Record(path:path, lines:(request.results ?? []).compactMap { $0.topCandidates(1).first?.string }))
}
let encoder = JSONEncoder(); encoder.outputFormatting = [.prettyPrinted,.sortedKeys]
print(String(data:try encoder.encode(records),encoding:.utf8)!)
