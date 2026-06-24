# Monday integration

## Formål
Monday bruges som CRM og skal ikke være dataplatformen.

## Læs fra Monday
- Eksisterende kunder
- Eksisterende leads
- Pipeline-status
- Ansvarlig
- Sidste aktivitet

## Skriv til Monday
- Opret nyt lead
- Tilføj note om STPS-rapport
- Opret opfølgningsopgave

## Arkitekturregel
Dashboardet må ikke loade alle data direkte fra Monday hver gang. KeasCare-backend bør gemme egne importerede signaldata og kun synkronisere nødvendige CRM-felter.
