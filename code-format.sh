#!/usr/bin/env bash
# Formats this library's hand-written native source — cpp/ (C++, via
# clang-format, config at .clang-format) and android/src (Kotlin, via
# ktfmt). Deliberately scoped to just those directories: nitrogen/generated
# is generated code and must not be reformatted, and TS/JS formatting is
# `pnpm format` (oxfmt), not this script.
#
# Avoids bash 4+ builtins (mapfile/readarray) — macOS ships bash 3.2.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

CHECK_ONLY=false
if [[ "${1:-}" == "--check" ]]; then
  CHECK_ONLY=true
fi

echo "==> Formatting C++ (clang-format) in cpp/"
if ! command -v clang-format >/dev/null 2>&1; then
  echo "error: clang-format not found. Install it (e.g. \`brew install clang-format\`) and re-run." >&2
  exit 1
fi

if [[ "$CHECK_ONLY" == true ]]; then
  find cpp -type f \( -name "*.hpp" -o -name "*.cpp" \) -print0 | xargs -0 clang-format --dry-run --Werror
else
  find cpp -type f \( -name "*.hpp" -o -name "*.cpp" \) -print0 | xargs -0 clang-format -i
fi

echo "==> Formatting Kotlin (ktfmt) in android/src"
if ! command -v ktfmt >/dev/null 2>&1; then
  echo "error: ktfmt not found. Install it (e.g. \`brew install ktfmt\`) and re-run." >&2
  exit 1
fi

if [[ "$CHECK_ONLY" == true ]]; then
  find android/src -type f -name "*.kt" -print0 |
    xargs -0 ktfmt --google-style --dry-run --set-exit-if-changed --quiet
else
  find android/src -type f -name "*.kt" -print0 | xargs -0 ktfmt --google-style
fi

echo "==> Done"
