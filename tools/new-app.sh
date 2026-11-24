#!/usr/bin/env bash
# Start a new React product from this repo's full layered skeleton.
#
#   tools/new-app.sh billing-portal ~/Documents/projects/billing-portal
#
# Copies the committed tree (git archive HEAD), so the product keeps AGENTS.md, CLAUDE.md,
# tools/ (scaffolding + hook + arch-check), the Jenkinsfile and the arch-qube gate. Copying a
# few src/ folders into `npm create vite` loses all of that (AGENTS.md §1).
#
# No --no-demo option: the template has no demo-only module. The Users feature is the worked
# example tools/new-feature.sh copies and its anchors live in it (DI token, useUserService,
# routes); Projects/Tasks/Calendar/... are only PlaceholderPage routes in src/routes/index.tsx
# and navGraph.ts — delete those lines when you replace them, not whole layers.
set -euo pipefail

[ $# -eq 2 ] || { echo "usage: $0 <app-name> <dest-dir>" >&2; exit 1; }
APP="$1"
DEST="$2"
[[ "$APP" =~ ^[a-z][a-z0-9]*(-[a-z0-9]+)*$ ]] || { echo "app-name: lower-case letters/digits, words joined by '-' (it becomes the npm package, image and CI names)" >&2; exit 1; }
case "$APP" in arcana|arcana-react|react-app) echo "app-name must differ from the template's own names" >&2; exit 1 ;; esac
[ ! -e "$DEST" ] || { echo "$DEST already exists — refusing to overwrite" >&2; exit 1; }
command -v perl >/dev/null || { echo "perl is required" >&2; exit 1; }

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
git -C "$ROOT" diff --quiet HEAD -- AGENTS.md tools/ || echo "note: uncommitted changes in AGENTS.md/tools are NOT copied (git archive HEAD)" >&2

mkdir -p "$DEST"
git -C "$ROOT" archive HEAD | tar -x -C "$DEST"
SRC_SHA="$(git -C "$ROOT" rev-parse --short HEAD)"
APP_US="$(printf '%s' "$APP" | tr '-' '_')"
TITLE="$(printf '%s' "$APP" | perl -pe 's/(^|-)([a-z])/($1?" ":"").uc($2)/ge')"     # billing-portal → Billing Portal
PASCAL="$(printf '%s' "$TITLE" | tr -d ' ')"                                         # → BillingPortal
cd "$DEST"

# ---- Product identity. Every place the template name is load-bearing:
#  1. npm package arcana-react (package.json, package-lock.json), <title> in index.html, README.
#  2. Jenkins APP_NAME / image / Sonar key "react-app" and Sonar name "React App"; the per-build
#     CI containers react-app-test-* and arcana-arch-qube-react-* — two products building on one
#     Jenkins host must not share (and `docker rm -f`) each other's containers.
#  3. Browser storage: localStorage/sessionStorage keys arcana_* and the IndexedDB name ArcanaDB
#     — two products served from the same origin (localhost:5173 in dev) would read each
#     other's tokens and caches.
#  4. Visible app name APP_CONSTANTS.APP_NAME 'Arcana' and the header brand text.
# Not renamed on purpose: arcana.boo (registry / arch-qube host), the mock user
# admin@arcana.io in AuthProvider (demo login data — replace it with your real auth).
# tools/ is excluded: these scripts describe the template and must keep working in the product.
TEXT_FILES="$(grep -rIl -i -e arcana -e react-app -e "React App" . --exclude-dir=.git --exclude-dir=tools --exclude=CHANGELOG.md || true)"
printf '%s\n' "$TEXT_FILES" | xargs perl -pi -e "
    s/arcana-arch-qube-react-/${APP}-arch-qube-/g;
    s/\\barcana-react\\b/${APP}/g;
    s/\\breact-app\\b/${APP}/g;
    s/React App/${TITLE}/g;
    s/\\barcana_(?=[a-z])/${APP_US}_/g;
    s/\\bArcanaDB\\b/${PASCAL}DB/g;
    s/'Arcana'/'${TITLE}'/g;
    s/>Arcana</>${TITLE}</g;
"
LEFT="$(grep -rInE --exclude-dir=.git --exclude-dir=tools --exclude=CHANGELOG.md "\\barcana-react\\b|\\breact-app\\b|React App|arcana-arch-qube-react|\\barcana_[a-z]|\\bArcanaDB\\b|'Arcana'|>Arcana<" . || true)"
if [ -n "$LEFT" ]; then
    echo "new-app: template identities still present after rename:" >&2
    printf '%s\n' "$LEFT" | head >&2
    exit 1
fi

# ---- Fresh history: version 0.1.0, empty changelog.
rm -f CHANGELOG.md
printf '{\n  ".": "0.1.0"\n}\n' > .release-please-manifest.json
perl -0pi -e "s/(\"name\": \"${APP}\",\n(\\s*\"private\": true,\n)?\\s*\"version\": \")[^\"]+\"/\${1}0.1.0\"/g" package.json package-lock.json
grep -q '"version": "0.1.0"' package.json || { echo "new-app: could not reset package.json version" >&2; exit 1; }

cat >> AGENTS.md <<EOT

## Origin

Created from arcana-react @ \`${SRC_SHA}\` by \`tools/new-app.sh\` (package, image, CI, Sonar,
storage-key and IndexedDB names renamed to \`${APP}\`). The layers, rules and definition of
done above apply unchanged. Replace the Users example and the placeholder routes through
\`src/app/core/di/serviceConfig.ts\`, \`src/routes/index.tsx\` and \`navGraph.ts\`, not by flattening.
EOT

git init -q
tools/install-hooks.sh >/dev/null
git add -A
# --no-verify only for this import commit: every file counts as "added" here, so the hook
# would judge the template's own entry files (src/App.tsx, src/main.tsx) as new flat files.
# The template itself passes arch-check; every later commit in the product goes through the hook.
git -c user.name="${GIT_AUTHOR_NAME:-new-app}" -c user.email="${GIT_AUTHOR_EMAIL:-new-app@localhost}" \
    commit -q --no-verify -m "chore: start ${APP} from arcana-react ${SRC_SHA}"

echo "created $DEST (${APP}) from arcana-react ${SRC_SHA}; hooks: $(git config core.hooksPath)"
echo "next: cd $DEST && npm ci && tools/new-feature.sh <Name>"
