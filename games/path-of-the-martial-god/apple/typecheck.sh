#!/usr/bin/env bash
# Type-check the presentation layer without an iOS SDK.
#
# The files under MartialGod/ import UIKit, MetalKit, AVFoundation, CoreHaptics,
# GameController, QuartzCore and SwiftUI. None of those exist on Linux, so
# `swiftc -parse` is all that has been possible: syntax only, no types.
# (The count is computed below, never written here — a hardcoded number is a claim
#  that silently stops being true the next time a file is added.)
#
# This builds minimal stub MODULES with those names and type-checks the real files
# against them. It catches everything wrong inside our own code. It cannot catch a stub
# that misremembers Apple's API — read tools/typecheck/README.md before trusting a pass.
set -euo pipefail
cd "$(dirname "$0")"

IMAGE="${SWIFT_IMAGE:-mirror.gcr.io/library/swift:5.10-noble}"

run() {
  if command -v swiftc >/dev/null 2>&1; then
    bash -c "$1"
  elif command -v docker >/dev/null 2>&1; then
    docker run --rm -v "$PWD:/w" -w /w "$IMAGE" bash -c "$1"
  else
    echo "typecheck.sh needs either a Swift toolchain or docker." >&2
    exit 2
  fi
}

# Stub modules must be built in dependency order: UIKit before MetalKit and SwiftUI.
read -r -d '' SCRIPT <<'INNER' || true
set -euo pipefail
OUT=/tmp/tcmods
rm -rf "$OUT" && mkdir -p "$OUT"
S=tools/typecheck/stubs

for m in simd QuartzCore UIKit GameController AVFoundation CoreHaptics MetalKit SwiftUI; do
  swiftc -emit-module -module-name "$m" -emit-module-path "$OUT/$m.swiftmodule" \
         -I "$OUT" "$S/$m.swift" -O -wmo 2>&1 | sed "s|^|[$m] |"
done

echo "==> building MartialGodCore"
swift build --package-path Packages/MartialGodCore --scratch-path /tmp/tcbuild >/dev/null
CORE=$(swift build --package-path Packages/MartialGodCore --scratch-path /tmp/tcbuild --show-bin-path)

# Linux Swift has no ObjC runtime: `@objc` and `#selector` cannot compile. They are
# rewritten in a THROWAWAY COPY so the shipping sources stay exactly as they are. The
# cost is stated in the README: the selector expression itself goes unchecked.
echo "==> preparing sources (shipping files untouched)"
SRC=/tmp/tcsrc
rm -rf "$SRC" && mkdir -p "$SRC"
cp -r MartialGod "$SRC/"
find "$SRC" -name '*.swift' -print0 | xargs -0 sed -i \
  -e 's/@objc //g' \
  -e 's/#selector(\([A-Za-z_][A-Za-z0-9_]*\))/Selector("\1")/g'

FILES=$(find "$SRC" -name '*.swift' | wc -l | tr -d ' ')
echo "==> type-checking the presentation layer ($FILES files)"
swiftc -typecheck -I "$OUT" -I "$CORE/Modules" -I "$CORE" \
  $(find "$SRC" -name '*.swift' | sort)
INNER

FILES=$(find MartialGod -name '*.swift' | wc -l | tr -d ' ')
run "$SCRIPT"
echo
echo "TYPE-CHECK OK — no internal contradictions in $FILES presentation files."
echo "This is NOT proof it compiles on a Mac; see tools/typecheck/README.md."
