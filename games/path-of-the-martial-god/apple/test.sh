#!/usr/bin/env bash
# The Swift unit suite. Same toolchain story as parity.sh: local Swift if present,
# the official image otherwise, because none of MartialGodCore needs a Mac.
set -euo pipefail
cd "$(dirname "$0")"
IMAGE="${SWIFT_IMAGE:-mirror.gcr.io/library/swift:5.10-noble}"
if command -v swift >/dev/null 2>&1; then
  swift test --package-path Packages/MartialGodCore "$@"
elif command -v docker >/dev/null 2>&1; then
  SCRATCH="$(mktemp -d)"; trap 'rm -rf "$SCRATCH"' EXIT
  docker run --rm -v "$PWD/Packages/MartialGodCore:/pkg" -v "$SCRATCH:/scratch" -w /pkg "$IMAGE" \
    swift test --scratch-path /scratch "$@"
else
  echo "test.sh needs either a Swift toolchain or docker." >&2
  exit 2
fi
