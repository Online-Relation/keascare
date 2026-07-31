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

  pins.forEach((pin) => {
    if (!pin.lat || !pin.lng || (pin.lat === 0 && pin.lng === 0)) return;

    const farve = pinFarve(pin.fundNiveau);
    const ikon = L.divIcon({
      className: '',
      html: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="34" viewBox="0 0 24 34">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 22 12 22S24 21 24 12C24 5.373 18.627 0 12 0z"
          fill="${farve}" stroke="white" stroke-width="1.5"/>
        <circle cx="12" cy="12" r="5" fill="white" opacity="0.85"/>
      </svg>`,
      iconSize: [24, 34],
      iconAnchor: [12, 34],
      popupAnchor: [0, -34],
    });

    const marker = L.marker([pin.lat, pin.lng], { icon: ikon });
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
