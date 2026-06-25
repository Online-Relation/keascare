# KeasCare — Opgaveliste

Sidst opdateret: 2026-06-25

## Automatisering (cron-job.org)
- [x] STPS liste-scraper — kl. 02:00 hver nat
- [x] STPS detaljer/PDF-parser — kl. 02:30 hver nat
- [x] Tilbudsportalen matcher — kl. 03:00 hver nat

## Datakilder og scraping
- [x] STPS liste-scraper (nye tilsynsrapporter)
- [x] STPS detalje-scraper (PDF-parsing, fund, vurdering)
- [x] Tilbudsportalen liste-scraper (§107 + §108 bosteder)
- [x] Tilbudsportalen detalje-scraper (CVR, pladser, tilbudstype, kontaktinfo)
- [x] Tilbudsportalen matcher (kobler TP-data på STPS-rapporter)
- [ ] **Tilbudsportalen skal re-køres manuelt** ca. hver måned (Cloudflare blokerer Railway — kun lokalt)
- [ ] Danmarks Statistik API — borgere i botilbud pr. kommune (§107/§108)

## Dashboard og UI
- [x] Dashboard V1 — KPI'er, tabel, paginering
- [x] Bosted detaljeside med STPS-data og Tilbudsportalen-data
- [x] Kontaktperson, telefon, email på bosted-detailside
- [x] Mobil burgermenu
- [x] Work Sans font (matcher KeasCares hjemmeside)
- [x] KeasCare brand farver (navy sidebar, coral knapper)
- [ ] Verificer at kontaktdata vises korrekt på bosted-detailside (efter matcher kører)

## Monday CRM-integration (ikke nu — venter på grønt lys)
- [ ] Monday API-read — vis om bosted allerede er kunde/lead i Monday
- [ ] Monday API-opret lead — "Opret lead i Monday"-knappen skal virke
- [ ] Åbn eksisterende Monday-item direkte fra dashboard

## Oprydning
- [ ] Slet debug-endpoints: `/api/debug/pdf` og `/api/debug/reset-pdf`

## Fremtid (ikke V1)
- [ ] Cron job til automatisk re-scraping af Tilbudsportalen (kræver proxy eller løsning på Cloudflare)
- [ ] AI-opsummering af STPS-rapporter
- [ ] Notifikationer (email/Slack) ved nye kritiske rapporter
- [ ] Danmarks Statistik-panel i dashboard (kommuner med størst behov)
