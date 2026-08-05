#!/usr/bin/env bash
# Kører regnskab-scrapers direkte mod Supabase fra Synology/lokalt.
# regnskab.virk.dk er DNS-blokeret på Railway — køres herfra i stedet.
#
# Forudsætning: Docker installeret og image bygget:
#   cd docker/regnskab && docker build -t keascare-regnskab .
#
# Anbefalet kørsel: Manuel eller tilføj til cron på Synology:
#   crontab -e
#   0 4 * * * /path/til/kør-regnskab.sh >> ~/keascare-regnskab.log 2>&1

set -euo pipefail

# Hent env-fil hvis den findes
ENV_FILE="$HOME/.keascare.env"
if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
fi

SUPABASE_URL="${SUPABASE_URL:?Sæt SUPABASE_URL i $ENV_FILE}"
SUPABASE_SERVICE_KEY="${SUPABASE_SERVICE_KEY:?Sæt SUPABASE_SERVICE_KEY i $ENV_FILE}"

echo "=== Regnskab kørsel $(date '+%Y-%m-%d %H:%M') ==="

# Byg image hvis det ikke er bygget endnu
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="$SCRIPT_DIR/../docker/regnskab"

if ! docker image inspect keascare-regnskab &>/dev/null; then
  echo "→ Bygger Docker image..."
  docker build -t keascare-regnskab "$DOCKER_DIR"
fi

# Kør scrapereren
echo "→ Starter regnskab-scraper..."
docker run --rm \
  -e SUPABASE_URL="$SUPABASE_URL" \
  -e SUPABASE_SERVICE_KEY="$SUPABASE_SERVICE_KEY" \
  keascare-regnskab

echo "=== Færdig $(date '+%Y-%m-%d %H:%M') ==="
