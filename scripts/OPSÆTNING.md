# Lokal automatisk kørsel — Tilbudsportalen

Tilbudsportalen-scraperene blokeres af Cloudflare på live-serveren.
Dette script kører dem fra din lokale Mac mod live-databasen.

## Trin 1 — Gem dine hemmeligheder

Opret filen `~/.keascare.env` (ligger i din hjemmemappe, ikke i projektet):

```bash
APP_URL=https://keascare.onlinerelation.dk
SCRAPER_SECRET=<din-scraper-secret fra Railway>
```

Sæt korrekte rettigheder så kun du kan læse den:

```bash
chmod 600 ~/.keascare.env
```

## Trin 2 — Gør scriptet kørbart

```bash
chmod +x /sti/til/keascare/scripts/kør-tilbudsportalen.sh
```

## Trin 3 — Test det manuelt

```bash
~/keascare/scripts/kør-tilbudsportalen.sh
```

Du bør se output som:
```
=== Tilbudsportalen kørsel 2026-07-07 14:00 ===
→ Henter tilbudsliste...
  Resultat: {"ok":true,"behandlet":1958,...}
→ Henter detaljer (loop)...
  Runde 1: {"ok":true,"behandlet":30,...}
  ...
→ Kører matcher...
=== Færdig 2026-07-07 14:05 ===
```

## Trin 4 — Sæt det op som automatisk cron-job

Åbn cron-editoren:

```bash
crontab -e
```

Tilføj denne linje (kører søndag kl. 02:00):

```
0 12 * * 0 /Users/<dit-brugernavn>/keascare/scripts/kør-tilbudsportalen.sh >> ~/keascare-cron.log 2>&1
```

Gem og luk. Cron-jobbet kører nu automatisk hver søndag.

Log kan ses med:

```bash
tail -f ~/keascare-cron.log
```

## Hvad scriptet gør

1. **Tilbudsliste** — henter alle ~1.900 tilbud fra Tilbudsportalen
2. **Detaljer** — henter CVR, type og pladser for hvert tilbud (kører i loop)
3. **Matcher** — matcher Tilbudsportalen-data mod STPS-rapporter via CVR og navn

Tilbudsportalen opdateres sjældent — ugentlig kørsel er rigeligt.
