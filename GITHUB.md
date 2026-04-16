# Push to GitHub — `mulieris/Quarto-Game`

Repository: **https://github.com/mulieris/Quarto-Game**

## Option A — one script (recommended)

In **Terminal.app** (or iTerm), not inside a restricted sandbox:

```bash
chmod +x /Users/kasperka/quarto/scripts/push-to-github.sh
/Users/kasperka/quarto/scripts/push-to-github.sh
```

If `git push` asks for login, use **HTTPS + Personal Access Token** or switch the remote to SSH:

```bash
cd /Users/kasperka/quarto
git remote set-url origin git@github.com:mulieris/Quarto-Game.git
git push -u origin main
```

## Option B — manual commands

```bash
cd /Users/kasperka/quarto
xattr -cr . 2>/dev/null || true   # optional, macOS
rm -rf .git
git init
git add .
git commit -m "Initial commit: Quarto 3D web game (React, R3F, FastAPI, i18n)"
git branch -M main
git remote add origin https://github.com/mulieris/Quarto-Game.git
git push -u origin main
```

## If Cursor shows `Operation not permitted` on `.git/hooks`

That comes from the IDE sandbox. Always run `git init` / first `git push` from a normal terminal on your machine, or use the script above.
