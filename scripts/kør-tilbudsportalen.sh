#!/usr/bin/env bash
# Kører Tilbudsportalen-scrapers mod live-serveren.
# Sæt APP_URL og SCRAPER_SECRET som miljøvariabler eller i ~/.keascare.env
#
# Anbefalet kørsel: én gang om ugen (fx søndag kl. 02:00)
# Tilføj til cron med: crontab -e
#   0 12 * * 0 /path/til/kør-tilbudsportalen.sh >> ~/keascare-cron.log 2>&1

set -euo pipefail

# Hent env-fil hvis den findes
ENV_FILE="$HOME/.keascare.env"
if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
fi

APP_URL="${APP_URL:-https://keascare.onlinerelation.dk}"
SECRET="${SCRAPER_SECRET:?Sæt SCRAPER_SECRET i $ENV_FILE eller som miljøvariabel}"

echo "=== Tilbudsportalen kørsel $(date '+%Y-%m-%d %H:%M') ==="

# ---- 0. Reset Cloudflare-blokkerede detaljer ----
echo "→ Nulstiller rækker der mangler CVR (Cloudflare-blokkerede)..."
RESET=$(curl -sS -X POST "$APP_URL/api/scrapers/tilbudsportalen/reset-detaljer" \
  -H "Content-Type: application/json" \
  -H "x-scraper-secret: $SECRET")
echo "  Resultat: $RESET"

# ---- 1. Hent tilbudsliste ----
echo "→ Henter tilbudsliste..."
LISTE=$(curl -sS -X POST "$APP_URL/api/scrapers/tilbudsportalen/liste" \
  -H "Content-Type: application/json" \
  -H "x-scraper-secret: $SECRET" \
  -d '{"maxSider": 50}')
echo "  Resultat: $LISTE"

# ---- 2. Hent detaljer i loop (kører til behandlet=0) ----
echo "→ Henter detaljer (loop)..."
RUNDE=1
while true; do
  DETALJER=$(curl -sS -X POST "$APP_URL/api/scrapers/tilbudsportalen/detaljer" \
    -H "Content-Type: application/json" \
    -H "x-scraper-secret: $SECRET" \
    -d '{"batch": 30}')
  echo "  Runde $RUNDE: $DETALJER"

  BEHANDLET=$(echo "$DETALJER" | grep -o '"behandlet":[0-9]*' | grep -o '[0-9]*' || echo "0")
  if [[ "$BEHANDLET" == "0" ]]; then
    break
  fi

  RUNDE=$((RUNDE + 1))
  sleep 3
done

# ---- 3. Kør matcher ----
echo "→ Kører matcher..."
MATCH=$(curl -sS -X POST "$APP_URL/api/scrapers/tilbudsportalen/match" \
  -H "Content-Type: application/json" \
  -H "x-scraper-secret: $SECRET" \
  -d '{}')
echo "  Resultat: $MATCH"

echo "=== Færdig $(date '+%Y-%m-%d %H:%M') ==="
