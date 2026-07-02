'use client';

// Viser et Google Maps embed for bostedets adresse

type Props = {
  adresse: string;
};

export function BostedKort({ adresse }: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

  if (!apiKey) return null;

  const src = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(adresse)}&language=da&region=DK&zoom=13`;

  return (
    <div className="bosted-detail-kort">
      <div className="bosted-detail-kort-header">
        <span className="bosted-detail-kort-titel">Beliggenhed</span>
      </div>
      <div style={{ padding: '0 1rem 1rem' }}>
        <div style={{ borderRadius: '0.5rem', overflow: 'hidden', lineHeight: 0 }}>
          <iframe
            src={src}
            width="100%"
            height="240"
            style={{ border: 0, display: 'block' }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`Kort over ${adresse}`}
          />
        </div>
      </div>
    </div>
  );
}
