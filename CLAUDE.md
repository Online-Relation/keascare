# CLAUDE.md – KeasCare Markedssignaler

## Projektmappe og kontekst
`CLAUDE.md` må ligge i roden af Next.js-projektet, så Claude Code finder instruktionen automatisk.

Alle øvrige Claude-referencefiler SKAL ligge samlet i én mappe:

`claude-project-reference/`

Der må ikke ligge løse Claude-dokumenter, referencebilleder, projektbriefs eller struktur-noter spredt rundt mellem kodefilerne.

Korrekt rodfordeling:

```txt
CLAUDE.md
claude-project-reference/
  README.md
  assets/
  docs/
src/
package.json
next.config.ts
```

Når du åbner projektet i VS Code eller Claude Code, skal du først læse `CLAUDE.md` og derefter altid læse filerne i `claude-project-reference/`, før du foreslår arkitektur, opretter filer eller skriver kode.

Du må ikke antage krav ud fra hukommelse eller generiske CRM-projekter. Dokumenterne i `claude-project-reference/docs/` er source of truth for dette projekt.

Før kodearbejde skal du orientere dig i:

1. `claude-project-reference/README.md`
2. `claude-project-reference/docs/project-brief.md`
3. `claude-project-reference/docs/dashboard-v1.md`
4. `claude-project-reference/docs/data-sources.md`
5. `claude-project-reference/docs/stps-parsing.md`
6. `claude-project-reference/docs/monday-integration.md`
7. `claude-project-reference/docs/nextjs-structure.md`
8. `claude-project-reference/assets/dashboard-reference.png`

Referencebilledet er kun visuel retning. Data, felter og logik skal følge dokumenterne og må ikke hardcodes.


## Din rolle
Du er udvikler på et Next.js-projekt for KeasCare for bosteder. ChatGPT fungerer som projektleder og produktansvarlig. Du skal kode efter instruktionerne her og holde projektet stramt, realistisk og vedligeholdelsesvenligt.

## Projektets formål
Projektet skal bygge et realistisk dashboard, der hjælper KeasCare med at finde nye relevante bosteder som kunder via automatisk indsamlede markedssignaler.

Systemet skal ikke være et nyt Sensum, dokumentationssystem eller fagsystem. Det skal være et markeds- og signalcenter, der viser:

- Bosteder fundet via eksterne datakilder
- Nye STPS-tilsynsrapporter
- Om bostedet allerede findes i Monday CRM
- En konkret handling, fx “Opret lead i Monday”

## Teknisk stack
Projektet skal bygges som et Next.js-projekt.

Brug moderne Next.js-struktur med:

- App Router
- TypeScript
- Komponentbaseret struktur
- Server-side datahåndtering hvor det giver mening
- API routes/server actions kun hvor det er arkitektonisk korrekt

## Absolutte regler

### Ingen hardcoding
Du må ikke hardcode forretningsdata direkte i UI-komponenter.

Eksempler på data der ikke må hardcodes i komponenter:

- Bostedsnavne
- CVR-numre
- Kommuner
- STPS-statusser
- Monday-statusser
- KPI-tal
- Rapportdatoer

Brug i stedet mock-data i separate datafiler, seed-filer eller services, indtil rigtige API’er kobles på.

### Filer må ikke blive for lange
Ingen filer må som udgangspunkt overstige 300 linjer.

Hvis en fil nærmer sig 300 linjer, skal den opdeles i mindre filer:

- Komponenter
- Services
- Types
- Utils
- Constants
- Mappers
- API-klienter

### Korrekt mappestruktur
Du skal placere filer i logiske mapper og undermapper. Du må ikke lægge alt i én components-mappe eller samle store mængder logik i én fil.

Alle betydelige filer skal have deres egen mappe. En komponent som `MarketSignalsPage.tsx` må derfor ikke ligge direkte i `components/`. Den skal ligge i `components/MarketSignalsPage/MarketSignalsPage.tsx` med en tilhørende `index.ts`.

Dette gælder hele projektet, ikke kun markedssignaler.

### Ingen falsk præcision
Dashboardet må ikke vise data, vi ikke realistisk kan hente eller forklare.

Undgå derfor i V1:

- Markedsværdi i kroner
- AI-score uden forklaring
- Præcis markedsandel
- Komplekse datakvalitetsprocenter uden faktisk tracking
- Fancy Danmarkskort uden reelle data

### Regelbaseret før AI
AI må ikke bruges som primær vurdering af alvor.

STPS-fund skal først klassificeres regelbaseret ud fra STPS’ egne konklusioner:

- Kritiske problemer
- Større problemer
- Mindre problemer
- Ingen problemer
- Ukendt / ikke fundet

AI kan senere bruges til opsummering og forslag til handling, men ikke til at opfinde alvorlighed.

## Realistisk V1
V1 skal fokusere på én kerneværdi:

“Vis bosteder med nye STPS-tilsynsrapporter, som ikke er kunder i Monday.”

Det vigtigste dashboard skal indeholde:

### KPI’er
- Bosteder fundet
- Matchet med Monday
- Bosteder med nye tilsynsrapporter
- Kommuner med størst behov, hvis Danmarks Statistik-data er tilgængelig

### Hovedtabel
Kolonner:

- Bosted
- Kommune
- Pladser
- Drift
- STPS fund
- Rapportdato
- Fokus i rapporten
- Kunde i Monday
- Handling

### Handlinger
- Opret lead i Monday
- Åbn eksisterende Monday-item
- Se rapportdetaljer

## Datakilder

### Tilbudsportalen
Bruges som baseliste over bosteder/tilbud.

Forventede felter:

- Navn
- Adresse
- Kommune
- Driftstype
- Pladser, hvis tilgængeligt

### STPS
Bruges til tilsynssignaler.

Forventede felter:

- Rapporttitel
- Rapportdato
- Link til rapport
- STPS-konklusion
- Fund-kategori

### Monday API
Bruges til CRM-status og handlinger.

Forventede felter:

- Eksisterende kunde/lead
- Pipeline-status
- Ansvarlig
- Sidste aktivitet

### Danmarks Statistik
Bruges kun til overordnet markedsbehov pr. kommune, ikke til konkrete bosteder.

Mulig brug:

- Borgere i botilbud pr. kommune
- §107 og §108-data, hvis tilgængeligt

## Obligatorisk mappestruktur

Dette projekt skal have en meget struktureret VS Code-opbygning. Claude må ikke lave flade mapper med mange enkeltfiler.

### Absolut regel

Alle betydelige filer skal ligge i deres egen mappe.

Forkert:

```txt
features/
  market-signals/
    components/
      MarketSignalsPage.tsx
```

Korrekt:

```txt
features/
  market-signals/
    components/
      MarketSignalsPage/
        MarketSignalsPage.tsx
        index.ts
```

Denne regel gælder i hele projektet for components, sections, cards, panels, services, mappers, hooks, utils og andre filer, der kan vokse.

Hvis en komponent får underdele, skal de placeres i undermapper under komponentens egen mappe. Hvis en mappe vokser, skal den opdeles igen.

### Korrekt eksempelstruktur

```txt
src/
  app/
    dashboard/
      market-signals/
        page.tsx
        loading.tsx
        error.tsx
  features/
    market-signals/
      components/
        MarketSignalsPage/
          MarketSignalsPage.tsx
          index.ts
          sections/
            MarketSignalsHeader/
              MarketSignalsHeader.tsx
              index.ts
            MarketSignalsKpis/
              MarketSignalsKpis.tsx
              index.ts
              MarketKpiCard/
                MarketKpiCard.tsx
                index.ts
            MarketSignalsMainTable/
              MarketSignalsMainTable.tsx
              index.ts
              MarketSignalsTableRow/
                MarketSignalsTableRow.tsx
                index.ts
            MarketSignalsSidebar/
              MarketSignalsSidebar.tsx
              index.ts
              MarketInsightPanel/
                MarketInsightPanel.tsx
                index.ts
              DataSourcesPanel/
                DataSourcesPanel.tsx
                index.ts
              DashboardUsagePanel/
                DashboardUsagePanel.tsx
                index.ts
            MarketSignalsSearch/
              MarketSignalsSearch.tsx
              index.ts
      data/
        MarketSignalsMockData/
          market-signals.mock.ts
          index.ts
      services/
        MarketSignalsService/
          marketSignals.service.ts
          index.ts
        TilbudsportalenService/
          tilbudsportalen.service.ts
          index.ts
        StpsService/
          stps.service.ts
          index.ts
        MondayService/
          monday.service.ts
          index.ts
        DstService/
          dst.service.ts
          index.ts
      mappers/
        StpsFindingMapper/
          stpsFinding.mapper.ts
          index.ts
        MondayMatchMapper/
          mondayMatch.mapper.ts
          index.ts
      types/
        marketSignals.types.ts
      utils/
        DateUtils/
          date.utils.ts
          index.ts
        MatchUtils/
          match.utils.ts
          index.ts
  lib/
    api/
      MondayClient/
        mondayClient.ts
        index.ts
      StpsClient/
        stpsClient.ts
        index.ts
      TilbudsportalenClient/
        tilbudsportalenClient.ts
        index.ts
      DstClient/
        dstClient.ts
        index.ts
    config/
      Env/
        env.ts
        index.ts
```

Se også `claude-project-reference/docs/nextjs-structure.md`, som er source of truth for projektets strukturregler.

## UI-retning
Der findes et dashboard-referencebillede i:

`claude-project-reference/assets/dashboard-reference.png`

Brug billedet som visuel retning, men implementér ikke fiktive tal eller fiktive datalag ukritisk.

Designretning:

- Professionelt SaaS-dashboard
- Rent, roligt og overskueligt
- KeasCare-stemme: patientsikkerhed først, klare rutiner, faglig troværdighed
- Ingen overfyldte widgets
- Tabellen er vigtigere end grafer

## Kodestandard

- Brug TypeScript types konsekvent
- Hold komponenter små
- Hold data-fetching ude af rene UI-komponenter
- Lav klare mapper til services, mappers, types og components
- Brug navne der forklarer formålet
- Undgå generiske navne som `helper.ts`, `utils.ts` uden kontekst
- Skriv kode der kan udskiftes fra mock-data til rigtige API’er uden omskrivning af UI

## Første udviklingsmål
Byg en statisk, datadrevet V1 med mock-data i separate filer.

Krav:

1. Dashboardside for Markedssignaler
2. KPI-række med realistiske felter
3. Hovedtabel med realistiske kolonner
4. Sidepanel med Danmarks Statistik-markedsbehov, hvis mock-data findes
5. Datakilder-panel
6. Ingen hardcoded data i komponenterne
7. Ingen filer over 300 linjer

## Næste udviklingsmål
Efter statisk V1 kan følgende kobles på:

1. Monday API-read
2. Monday API-create-lead
3. STPS-fetch/parsing
4. Tilbudsportalen-import
5. Danmarks Statistik API
6. Cron job hver 3. dag

## Vigtig arbejdsregel
Hvis noget er uklart, skal du hellere lave en lille, korrekt og udvidbar struktur end en stor “smart” løsning.

Byg simpelt først. Udvid bagefter.
