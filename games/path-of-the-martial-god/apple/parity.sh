#!/usr/bin/env bash
# THE PORT GATE.
#
# Replays the oracle's own recorded inputs through the production Swift simulation and
# compares the result field by field. The native implementation does not pass because
# the fight feels similar; it passes when the numbers agree.
#
#   ./parity.sh
#
# Runs against a local Swift toolchain when there is one. When there is not — a Linux
# CI box, or the authoring environment this port was written in — it falls back to the
# official Swift image, because a gate that only runs on one person's laptop is a gate
# that does not run. MartialGodCore is platform-free by contract (PortContractTests
# enforces it), so it builds and passes identically on Linux; only the presentation
# layer needs a Mac.
set -euo pipefail
cd "$(dirname "$0")"

PKG="Packages/MartialGodCore"
TRACES="../reference/traces"
OUT="$(mktemp -d)"
trap 'rm -rf "$OUT"' EXIT

# Docker Hub rate-limits anonymous pulls; Google's mirror of the official images does
# not, so it is tried first and docker.io is the fallback rather than the default.
IMAGE="${SWIFT_IMAGE:-mirror.gcr.io/library/swift:5.10-noble}"

if command -v swift >/dev/null 2>&1; then
  echo "==> building TraceDump (local toolchain: $(swift --version 2>/dev/null | head -1))"
  swift build --package-path "$PKG" --product TraceDump -c release
  BIN="$(swift build --package-path "$PKG" -c release --show-bin-path)/TraceDump"
  dump() { "$BIN" "$1" "$2"; }
elif command -v docker >/dev/null 2>&1; then
  echo "==> no local Swift; building TraceDump in $IMAGE"
  SCRATCH="$(mktemp -d)"
  trap 'rm -rf "$OUT" "$SCRATCH"' EXIT
  docker run --rm -v "$PWD/$PKG:/pkg" -v "$SCRATCH:/scratch" -w /pkg "$IMAGE" \
    swift build --scratch-path /scratch --product TraceDump -c release
  docker run --rm -v "$PWD/$PKG:/pkg" -v "$SCRATCH:/scratch" \
    -v "$(cd "$TRACES" && pwd):/traces:ro" -v "$OUT:/out" -w /pkg "$IMAGE" \
    bash -c 'BIN=$(swift build --scratch-path /scratch -c release --show-bin-path)/TraceDump
             for f in /traces/*.json; do "$BIN" "$f" "/out/$(basename "$f")"; done'
  dump() { :; }   # already produced, all at once
else
  echo "parity.sh needs either a Swift toolchain or docker." >&2
  exit 2
fi

fail=0
for fixture in "$TRACES"/*.json; do
  name="$(basename "$fixture" .json)"
  dump "$fixture" "$OUT/$name.json"
  if ! node ../reference/tools/verify-trace.mjs "$fixture" "$OUT/$name.json"; then
    fail=1
  fi
done

if [ "$fail" -ne 0 ]; then
  echo
  echo "PARITY FAILED. The production simulation has diverged from the reference oracle."
  echo "Fix the first discrete divergence reported above; everything after it is noise."
  exit 1
fi
echo
echo "PARITY OK across all scenarios."
