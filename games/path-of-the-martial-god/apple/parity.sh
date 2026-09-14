#!/usr/bin/env bash
# THE PORT GATE.
#
# Replays the oracle's own recorded inputs through the production Swift simulation and
# compares the result field by field. The native implementation does not pass because
# the fight feels similar; it passes when the numbers agree.
#
#   ./parity.sh
set -euo pipefail
cd "$(dirname "$0")"

TRACES="../reference/traces"
OUT="$(mktemp -d)"
trap 'rm -rf "$OUT"' EXIT

echo "==> building TraceDump"
swift build --package-path Packages/MartialGodCore --product TraceDump -c release
BIN="$(swift build --package-path Packages/MartialGodCore -c release --show-bin-path)/TraceDump"

fail=0
for fixture in "$TRACES"/*.json; do
  name="$(basename "$fixture" .json)"
  "$BIN" "$fixture" "$OUT/$name.json"
  if node ../reference/tools/verify-trace.mjs "$fixture" "$OUT/$name.json"; then
    :
  else
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
