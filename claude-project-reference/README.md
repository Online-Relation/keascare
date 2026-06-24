# KeasCare Claude Project

Denne mappe indeholder alt Claude skal bruge som projektkontekst.

Start altid med at læse:

1. `CLAUDE.md`
2. `docs/project-brief.md`
3. `docs/dashboard-v1.md`
4. `docs/data-sources.md`
5. `docs/stps-parsing.md`
6. `docs/monday-integration.md`
7. `docs/nextjs-structure.md`
8. `assets/dashboard-reference.png`

Projektet er et Next.js-projekt med App Router og TypeScript.

## Vigtigste regler

- Claude må ikke hardcode forretningsdata i UI-komponenter.
- Filer skal generelt holdes under 300 linjer.
- Hvis en fil nærmer sig 250 linjer, skal den overvejes opdelt.
- Hvis en fil nærmer sig 300 linjer, skal den opdeles.
- Projektet skal have en meget struktureret VS Code-mappestruktur.
- Alle betydelige filer skal ligge i deres egen mappe.

Eksempel:

```txt
features/
  market-signals/
    components/
      MarketSignalsPage/
        MarketSignalsPage.tsx
        index.ts
```

Claude må ikke lave flade mapper som:

```txt
components/
  MarketSignalsPage.tsx
  MarketKpiCard.tsx
  MarketSignalsTable.tsx
```

Læs `docs/nextjs-structure.md` for de fulde strukturregler.
