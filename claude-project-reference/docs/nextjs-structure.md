# Next.js struktur

## Grundprincipper

- Projektet er et Next.js-projekt med App Router og TypeScript.
- Brug en feature-baseret struktur.
- Hold UI-komponenter små og sammensatte.
- Services håndterer data.
- Mappers oversætter eksterne data til interne typer.
- Types ligger separat.
- Mock-data ligger separat.
- Ingen forretningsdata må hardcodes direkte i UI-komponenter.

## Absolut strukturregel

Alle betydelige filer skal ligge i deres egen mappe.

Det betyder, at en komponent ikke må ligge sådan:

```txt
features/
  market-signals/
    components/
      MarketSignalsPage.tsx
```

Den skal ligge sådan:

```txt
features/
  market-signals/
    components/
      MarketSignalsPage/
        MarketSignalsPage.tsx
        index.ts
```

Samme regel gælder for:

- Components
- Sections
- Tables
- Cards
- Panels
- Services
- Mappers
- Hooks
- Utils
- Types, hvis området vokser

Når en mappe vokser, skal den opdeles igen i undermapper.

## Hvorfor

Mads ønsker maksimal struktur i VS Code. Claude må ikke skabe flade mapper med mange filer, fordi det hurtigt bliver uoverskueligt og giver store filer.

Hver komponentmappe skal kunne udvides med:

- selve komponenten
- underkomponenter
- lokale helpers
- lokale constants
- lokale types
- test/story senere, hvis nødvendigt

## Filstørrelse

Ingen fil må som udgangspunkt overstige 300 linjer.

Hvis en fil nærmer sig 250 linjer, skal Claude aktivt overveje opdeling.

Hvis en fil nærmer sig 300 linjer, skal den opdeles, før der bygges videre.

## Korrekt komponentstruktur

Eksempel:

```txt
src/
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
```

## Korrekt service-struktur

Services må heller ikke samles som mange flade filer i én mappe, hvis de kan vokse.

Brug denne type struktur:

```txt
src/
  features/
    market-signals/
      services/
        MarketSignalsService/
          marketSignals.service.ts
          index.ts
        StpsService/
          stps.service.ts
          index.ts
        MondayService/
          monday.service.ts
          index.ts
        TilbudsportalenService/
          tilbudsportalen.service.ts
          index.ts
        DstService/
          dst.service.ts
          index.ts
```

## Korrekt mapper-struktur

```txt
src/
  features/
    market-signals/
      mappers/
        StpsFindingMapper/
          stpsFinding.mapper.ts
          index.ts
        MondayMatchMapper/
          mondayMatch.mapper.ts
          index.ts
```

## Korrekt type-struktur

Hvis typerne er få, kan de ligge samlet. Hvis de vokser, skal de opdeles.

Start gerne sådan:

```txt
src/
  features/
    market-signals/
      types/
        marketSignals.types.ts
```

Hvis filen vokser, opdel sådan:

```txt
src/
  features/
    market-signals/
      types/
        MarketSignal/
          marketSignal.types.ts
          index.ts
        StpsFinding/
          stpsFinding.types.ts
          index.ts
        MondayMatch/
          mondayMatch.types.ts
          index.ts
```

## Dataflow

1. App Router page loader feature-komponenten.
2. Service henter eller returnerer data.
3. Mapper normaliserer data.
4. UI-komponenter modtager typed props.
5. UI-komponenter må ikke hente eksterne API-data direkte.

## Importregel

Brug `index.ts` i komponentmapper, så imports forbliver rene.

Eksempel:

```ts
export { MarketSignalsPage } from './MarketSignalsPage'
```

Derefter importeres komponenten sådan:

```ts
import { MarketSignalsPage } from '@/features/market-signals/components/MarketSignalsPage'
```

## Forbudte mønstre

Claude må ikke oprette denne type flade struktur:

```txt
components/
  MarketSignalsPage.tsx
  MarketKpiRow.tsx
  MarketKpiCard.tsx
  MarketSignalsTable.tsx
  MarketSignalsTableRow.tsx
  MarketInsightPanel.tsx
```

Det er for fladt og bliver for hurtigt rodet.

Brug altid mapper omkring betydelige filer.
