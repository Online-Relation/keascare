'use client';

// src/features/kort/components/DanmarksKort/DanmarksKort.tsx

import { useEffect, useRef, useState } from 'react';
import type { Map as LeafletMap } from 'leaflet';

export type KortPin = {
  id: string;
  navn: string;
  lat: number;
  lng: number;
  fundNiveau: string | null;
  kommune: string | null;
  erKunde: boolean;
};

type Props = {
  pins: KortPin[];
  valgtKommune: string | null;
  onVælgKommune: (kommune: string | null) => void;
};

function pinFarve(fundNiveau: string | null): string {
  if (fundNiveau === 'kritisk') return '#ef4444';
  if (fundNiveau === 'stoerre') return '#f97316';
  if (fundNiveau === 'mindre') return '#eab308';
  if (fundNiveau === 'ingen') return '#22c55e';
  return '#6b7280';
}

export function DanmarksKort({ pins, valgtKommune, onVælgKommune }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let L: typeof import('leaflet');

    async function initMap() {
      L = await import('leaflet');

      // Fix Leaflet's default icon paths i Next.js
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(containerRef.current!, {
        center: [56.0, 10.0],
        zoom: 7,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 18,
      }).addTo(map);

      mapRef.current = map;
      opdaterPins(L, map, pins, onVælgKommune);
    }

    initMap();

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    import('leaflet').then((L) => {
      opdaterPins(L, mapRef.current!, pins, onVælgKommune);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pins]);

  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
      <div ref={containerRef} className="danmarkskort-container" />
    </>
  );
}

function opdaterPins(
  L: typeof import('leaflet'),
  map: LeafletMap,
  pins: KortPin[],
  onVælgKommune: (k: string | null) => void,
) {
  // Fjern eksisterende lag
  map.eachLayer((layer) => {
    if ((layer as { _isPinLayer?: boolean })._isPinLayer) map.removeLayer(layer);
  });

  // Tæl dubletter for at jittere overlappende koordinater
  const koordinatTæller = new Map<string, number>();

  pins.forEach((pin) => {
    if (!pin.lat || !pin.lng || (pin.lat === 0 && pin.lng === 0)) return;

    const nøgle = `${pin.lat.toFixed(5)},${pin.lng.toFixed(5)}`;
    const antal = koordinatTæller.get(nøgle) ?? 0;
    koordinatTæller.set(nøgle, antal + 1);

    // Jitter overlappende pins i en spiral (~300m radius per trin)
    const vinkel = (antal * 137.5 * Math.PI) / 180; // gylden vinkel
    const radius = antal === 0 ? 0 : 0.003 * Math.sqrt(antal);
    const lat = pin.lat + radius * Math.cos(vinkel);
    const lng = pin.lng + radius * Math.sin(vinkel);

    const farve = pinFarve(pin.fundNiveau);
    const ikon = L.divIcon({
      className: '',
      html: `<div style="
        width:16px;height:16px;border-radius:50%;
        background:${farve};border:2.5px solid white;
        box-shadow:0 1px 4px rgba(0,0,0,0.5);
      "></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
      popupAnchor: [0, -10],
    });

    const marker = L.marker([lat, lng], { icon: ikon });
    (marker as unknown as { _isPinLayer: boolean })._isPinLayer = true;

    marker.bindPopup(`
      <div style="min-width:160px;font-size:13px">
        <strong>${pin.navn}</strong><br/>
        <span style="color:#6b7280">${pin.kommune ?? ''}</span><br/>
        <a href="/dashboard/bosteder/${pin.id}" style="color:#4f46e5;font-size:12px">Se detaljer →</a>
        ${pin.kommune ? `<br/><button onclick="window.__vælgKommune('${pin.kommune}')" style="margin-top:6px;font-size:11px;cursor:pointer;color:#4f46e5;background:none;border:none;padding:0">Filtrer på ${pin.kommune}</button>` : ''}
      </div>
    `);

    marker.addTo(map);
  });

  // Global callback til popup-knap
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__vælgKommune = onVælgKommune;
}
