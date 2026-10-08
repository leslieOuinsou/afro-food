#!/usr/bin/env bash
# Appelle une URL jusqu'à obtenir un code 2xx (10 essais, 15 s d'écart). Usage : verifier-sante.sh <url>
set -u
url="${1:?URL manquante}"
for i in $(seq 1 10); do
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "$url" || echo 000)
  echo "Essai $i/10 : $url → $code"
  if [[ "$code" =~ ^2 ]]; then echo "Site en bonne santé."; exit 0; fi
  sleep 15
done
echo "Échec : $url ne répond pas correctement." >&2
exit 1
