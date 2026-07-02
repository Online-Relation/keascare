'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { KundeKortPunkt } from '@/app/api/monday/kunder-kort/route';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    google: any;
    initKunderKort: () => void;
  }
}

export function KunderKort() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [punkter, setPunkter] = useState<KundeKortPunkt[]>([]);
  const [valgt, setValgt] = useState<KundeKortPunkt | null>(null);
  const [indlæst, setIndlæst] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

  useEffect(() => {
    fetch('/api/monday/kunder-kort')
      .then((r) => r.json())
      .then((d) => setPunkter(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!apiKey || typeof window === 'undefined') return;
    if (window.google?.maps) { setIndlæst(true); return; }

    window.initKunderKort = () => setIndlæst(true);
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initKunderKort&language=da&region=DK`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, [apiKey]);

  useEffect(() => {
    if (!indlæst || !mapRef.current || punkter.length === 0) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 56.0, lng: 10.0 },
      zoom: 7,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    const geocoder = new window.google.maps.Geocoder();
    const infoWindow = new window.google.maps.InfoWindow();

    punkter.forEach((punkt) => {
      geocoder.geocode({ address: punkt.adresse + ', Danmark' }, (results: any, status: any) => {
        if (status !== 'OK' || !results?.[0]) return;

        const marker = new window.google.maps.Marker({
          position: results[0].geometry.location,
          map,
          title: punkt.navn,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 9,
            fillColor: punkt.gruppe === 'aktive_forloeb' ? '#1d4ed8' : '#16a34a',
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 2,
          },
        });

        marker.addListener('click', () => {
          setValgt(punkt);
          infoWindow.setContent(`
            <div style="font-family:sans-serif;padding:4px 2px">
              <strong style="font-size:13px">${punkt.navn}</strong>
              <div style="font-size:11px;color:#666;margin-top:2px">${punkt.adresse}</div>
            </div>
          `);
          infoWindow.open(map, marker);
        });
      });
    });
  }, [indlæst, punkter]);

  if (!apiKey) return null;

  return (
    <div className="bosted-detail-kort" style={{ marginTop: '1.25rem' }}>
      <div className="bosted-detail-kort-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="bosted-detail-kort-titel">Kunder på kort</span>
        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#1d4ed8', display: 'inline-block' }} />
            Aktive forløb
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
            Nye forløb
          </span>
        </div>
      </div>
      <div ref={mapRef} style={{ width: '100%', height: 420 }} />
      {valgt && (
        <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 'var(--fw-semibold)', fontSize: 'var(--text-sm)' }}>{valgt.navn}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{valgt.adresse}</div>
          </div>
          <Link href={`/dashboard/bosteder/${valgt.stpsId}`} className="btn btn-primary btn-sm">
            Se bosted
          </Link>
        </div>
      )}
    </div>
  );
}
