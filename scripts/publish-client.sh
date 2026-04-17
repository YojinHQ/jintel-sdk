#!/usr/bin/env bash
set -euo pipefail

CLIENT_DIR="packages/client"
PACKAGE_JSON="$CLIENT_DIR/package.json"

# --- helpers ---
die()  { echo "ERROR: $*" >&2; exit 1; }
info() { echo "=> $*"; }

# --- pre-checks ---
command -v jq  >/dev/null 2>&1 || die "jq is required (brew install jq)"
command -v npm >/dev/null 2>&1 || die "npm is required"
[ -f "$PACKAGE_JSON" ] || die "Run this script from the repo root"

CURRENT=$(jq -r .version "$PACKAGE_JSON")
PUBLISHED=$(npm view @yojinhq/jintel-client version 2>/dev/null || echo "0.0.0")

info "Published: $PUBLISHED | Local: $CURRENT"

# --- determine bump type ---
BUMP="${1:-}"
if [ -z "$BUMP" ]; then
  echo ""
  echo "Usage: pnpm publish:client <patch|minor|major> [--otp CODE]"
  echo ""
  echo "  patch  — bug fixes (0.9.0 -> 0.9.1)"
  echo "  minor  — new features, backwards-compatible (0.9.0 -> 0.10.0)"
  echo "  major  — breaking changes (0.9.0 -> 1.0.0)"
  echo ""
  exit 1
fi
shift

# validate bump type
case "$BUMP" in
  patch|minor|major) ;;
  *) die "Invalid bump type '$BUMP'. Use patch, minor, or major." ;;
esac

# --- skip bump if local is already ahead of published and not on npm ---
CURRENT_ON_NPM=$(npm view "@yojinhq/jintel-client@$CURRENT" version 2>/dev/null || true)
HIGHER=$(printf '%s\n%s' "$PUBLISHED" "$CURRENT" | sort -V | tail -1)
SKIPPED_BUMP=0

if [ "$CURRENT" != "$PUBLISHED" ] && [ "$HIGHER" = "$CURRENT" ] && [ -z "$CURRENT_ON_NPM" ]; then
  info "Local ($CURRENT) already ahead of published ($PUBLISHED) and not on npm — skipping $BUMP bump"
  NEW_VERSION="$CURRENT"
  SKIPPED_BUMP=1
else
  cd "$CLIENT_DIR"
  NEW_VERSION=$(npm version "$BUMP" --no-git-tag-version | tr -d 'v')
  cd - > /dev/null
  info "Bumped $CURRENT -> $NEW_VERSION"
fi

# --- build ---
info "Building client..."
pnpm --filter @yojinhq/jintel-client build

# --- publish ---
info "Publishing @yojinhq/jintel-client@$NEW_VERSION..."
cd "$CLIENT_DIR"
npm publish --access public "$@"
cd - > /dev/null

info "Published @yojinhq/jintel-client@$NEW_VERSION"

# --- git ---
if [ "$SKIPPED_BUMP" = "0" ]; then
  info "Committing version bump..."
  git add "$PACKAGE_JSON"
  git commit -m "chore: bump jintel-client to v$NEW_VERSION

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
  git push origin "$(git branch --show-current)"
else
  info "No version bump to commit (used existing local version)."
fi

info "Done! https://www.npmjs.com/package/@yojinhq/jintel-client"
