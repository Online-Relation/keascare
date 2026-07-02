// src/app/api/monday/kunder-kort/route.ts
// Returnerer kunder med geocodede koordinater (Nominatim/OSM, ingen API-nøgle)

import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';

export type KundeKortPunkt = {
  navn: string;
  adresse: string;
  gruppe: string;
  stpsId: string;
  lat: number;
  lng: number;
};

async function geocodeAdresse(adresse: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(adresse + ', Danmark')}&format=json&limit=1&countrycodes=dk`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'KeasCare/1.0 mads@onlinerelation.dk' },
      next: { revalidate: 86400 },
    });
    const data = await res.json();
    if (!data?.[0]) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

export async function GET() {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from('stps_rapporter')
    .select('id, stps_tilbud_navn, tp_adresse, adresse, monday_gruppe')
    .not('monday_item_id', 'is', null)
    .or('tp_adresse.not.is.null,adresse.not.is.null');

  if (error) return NextResponse.json([], { status: 500 });

  const rækker = (data ?? [])
    .map((r) => ({
      navn: r.stps_tilbud_navn ?? 'Ukendt',
      adresse: r.tp_adresse ?? r.adresse ?? '',
      gruppe: r.monday_gruppe ?? 'aktive_forloeb',
      stpsId: r.id,
    }))
    .filter((p) => p.adresse);

  // Geocode med 300ms pause mellem kald for at respektere Nominatim usage policy
  const punkter: KundeKortPunkt[] = [];
  for (const r of rækker) {
    const coords = await geocodeAdresse(r.adresse);
    if (coords) punkter.push({ ...r, ...coords });
    await new Promise((res) => setTimeout(res, 300));
  }

  return NextResponse.json(punkter);
}
