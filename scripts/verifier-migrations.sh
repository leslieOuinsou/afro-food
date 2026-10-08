#!/usr/bin/env bash
# Refuse les migrations destructrices (DROP TABLE / DROP COLUMN / TRUNCATE / DELETE sans WHERE) ajoutées par le changement courant.
# Pour une suppression volontaire, ajouter la ligne « -- migration-destructrice-validee » dans le fichier SQL.
set -euo pipefail
base="${GITHUB_BASE_REF:+origin/$GITHUB_BASE_REF}"
base="${base:-${CHANGE_TARGET:+origin/$CHANGE_TARGET}}"
base="${MIGRATIONS_BASE:-${base:-HEAD~1}}"
fichiers=$(git diff --name-only --diff-filter=A "$base" -- 'backend/prisma/migrations/*/migration.sql' 2>/dev/null || true)
if [ -z "$fichiers" ]; then echo "Aucune nouvelle migration."; exit 0; fi
echec=0
for f in $fichiers; do
  echo "Migration : $f"
  if grep -qi 'migration-destructrice-validee' "$f"; then echo "  → suppression validée explicitement."; continue; fi
  if grep -Eqi '(^|[^a-z])(drop[[:space:]]+(table|column|schema)|truncate|alter[[:space:]]+table.*drop[[:space:]]+column)' "$f"; then
    echo "  ✗ opération destructrice détectée." >&2; echec=1
  fi
done
exit $echec
