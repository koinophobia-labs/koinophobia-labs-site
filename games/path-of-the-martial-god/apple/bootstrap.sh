#!/usr/bin/env bash
# Generate the Xcode project and verify the port before opening it.
#
#   ./bootstrap.sh
#
# Requires macOS with Xcode. XcodeGen is installed via Homebrew if absent.
set -euo pipefail
cd "$(dirname "$0")"

if ! command -v xcodegen >/dev/null 2>&1; then
  echo "==> installing XcodeGen"
  brew install xcodegen
fi

echo "==> generating MartialGod.xcodeproj"
xcodegen generate

echo "==> building and testing the simulation package (no GPU or device needed)"
swift build --package-path Packages/MartialGodCore
swift test --package-path Packages/MartialGodCore

echo "==> running the parity gate against the reference oracle"
./parity.sh

echo
echo "Done. Open MartialGod.xcodeproj and run on a device or simulator."
