#!/usr/bin/env bash
set -euo pipefail

CLI_DIR="packages/cli"
PACKAGE_JSON="$CLI_DIR/package.json"

# --- helpers ---
die()  { echo "ERROR: $*" >&2; exit 1; }
info() { echo "=> $*"; }

# --- pre-checks ---
command -v jq  >/dev/null 2>&1 || die "jq is required (brew install jq)"
command -v npm >/dev/null 2>&1 || die "npm is required"
[ -f "$PACKAGE_JSON" ] || die "Run this script from the repo root"

CURRENT=$(jq -r .version "$PACKAGE_JSON")
PUBLISHED=$(npm view @yojinhq/jintel-cli version 2>/dev/null || echo "0.0.0")

info "Published: $PUBLISHED | Local: $CURRENT"

# --- determine bump type ---
BUMP="${1:-}"
if [ -z "$BUMP" ]; then
  echo ""
  echo "Usage: pnpm publish:cli <patch|minor|major> [--otp CODE]"
  echo ""
  echo "  patch  — bug fixes (0.2.0 -> 0.2.1)"
  echo "  minor  — new features, backwards-compatible (0.2.0 -> 0.3.0)"
  echo "  major  — breaking changes (0.2.0 -> 1.0.0)"
  echo ""
  exit 1
fi
shift

case "$BUMP" in
  patch|minor|major) ;;
  *) die "Invalid bump type '$BUMP'. Use patch, minor, or major." ;;
esac

# --- skip bump if local is already ahead of published and not on npm ---
CURRENT_ON_NPM=$(npm view "@yojinhq/jintel-cli@$CURRENT" version 2>/dev/null || true)
HIGHER=$(printf '%s\n%s' "$PUBLISHED" "$CURRENT" | sort -V | tail -1)
SKIPPED_BUMP=0

if [ "$CURRENT" != "$PUBLISHED" ] && [ "$HIGHER" = "$CURRENT" ] && [ -z "$CURRENT_ON_NPM" ]; then
  info "Local ($CURRENT) already ahead of published ($PUBLISHED) and not on npm — skipping $BUMP bump"
  NEW_VERSION="$CURRENT"
  SKIPPED_BUMP=1
else
  cd "$CLI_DIR"
  NEW_VERSION=$(npm version "$BUMP" --no-git-tag-version | tr -d 'v')
  cd - > /dev/null
  info "Bumped $CURRENT -> $NEW_VERSION"
fi

# --- build ---
info "Building cli..."
pnpm --filter @yojinhq/jintel-cli build

# --- git (record bump before the irreversible publish step) ---
if [ "$SKIPPED_BUMP" = "0" ]; then
  info "Committing version bump..."
  git add "$PACKAGE_JSON"
  git commit -m "chore: bump jintel-cli to v$NEW_VERSION

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
  git push origin "$(git branch --show-current)"
else
  info "No version bump to commit (used existing local version)."
fi

# --- publish ---
info "Publishing @yojinhq/jintel-cli@$NEW_VERSION..."
cd "$CLI_DIR"
pnpm publish --access public --no-git-checks "$@"
cd - > /dev/null

info "Published @yojinhq/jintel-cli@$NEW_VERSION"

info "Done! https://www.npmjs.com/package/@yojinhq/jintel-cli"
