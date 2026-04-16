#!/usr/bin/env bash
# Run in macOS Terminal (outside Cursor) if git init fails in the IDE sandbox.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Optional: clears macOS “provenance” flags that sometimes confuse tools
xattr -cr "$ROOT" 2>/dev/null || true

rm -rf .git
git init
git add -A
git status
git commit -m "Initial commit: Quarto 3D web game (React, R3F, FastAPI, i18n)"
git branch -M main
git remote add origin "https://github.com/mulieris/Quarto-Game.git"
echo "Pushing to origin/main …"
git push -u origin main
echo "Done: https://github.com/mulieris/Quarto-Game"
