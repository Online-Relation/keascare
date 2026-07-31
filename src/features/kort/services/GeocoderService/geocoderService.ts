// src/features/kort/services/GeocoderService/geocoderService.ts
// Bruger DAWA (Danmarks Adressers Web API) til at slå adresser op

export type GeoKoordinater = {
  lat: number;
  lng: number;
};

export async function geocodeDawaAdresse(adresse: string): Promise<GeoKoordinater | null> {
  try {
    const url = `https://api.dataforsyningen.dk/adresser?q=${encodeURIComponent(adresse)}&format=json&per_side=1`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;

    const data = await res.json();
    const hit = data?.[0];
    if (!hit?.adgangsadresse?.vejpunkt?.koordinater) return null;

    const [lng, lat] = hit.adgangsadresse.vejpunkt.koordinater;
    return { lat, lng };
  } catch {
    return null;
  }
}
