'use client';

// Viser et Google Maps embed for bostedets adresse

type Props = {
  adresse: string;
};

export function BostedKort({ adresse }: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

  if (!apiKey) return null;

  const src = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(adresse)}&language=da&region=DK`;

  return (
    <div className="bosted-detail-kort">
      <div className="bosted-detail-kort-header">
        <span className="bosted-detail-kort-titel">Beliggenhed</span>
      </div>
      <div style={{ borderRadius: '0 0 0.75rem 0.75rem', overflow: 'hidden', lineHeight: 0 }}>
        <iframe
          src={src}
          width="100%"
          height="260"
          style={{ border: 0, display: 'block' }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={`Kort over ${adresse}`}
        />
      </div>
    </div>
  );
}
