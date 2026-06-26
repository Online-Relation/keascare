'use client';
// src/features/dashboard/components/BostedDetailPage/sections/BostedSalgsAfsnit/BostedSalgsAfsnit.tsx

import { useState } from 'react';
import { Sparkles, Phone, Lightbulb, ArrowRight, Copy, Check, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type { SalgsAnbefalinger } from '@/features/dashboard/types/salg.types';

type Props = {
  bostedId: string;
  cachetAnbefalinger: SalgsAnbefalinger | null;
};

const YDELSE_FARVE: Record<string, string> = {
  'Minitilsyn': 'salg-ydelse--blaa',
  'Kursus': 'salg-ydelse--lilla',
  'Instrukser': 'salg-ydelse--groen',
  'Abonnement': 'salg-ydelse--orange',
  'Akuthjælp': 'salg-ydelse--roed',
  'Brand': 'salg-ydelse--gul',
};

function ydelseFarve(ydelse: string): string {
  for (const [nøgle, klasse] of Object.entries(YDELSE_FARVE)) {
    if (ydelse.includes(nøgle)) return klasse;
  }
  return 'salg-ydelse--blaa';
}

function KopiérKnap({ tekst }: { tekst: string }) {
  const [kopieret, setKopieret] = useState(false);

  async function kopiér() {
    await navigator.clipboard.writeText(tekst);
    setKopieret(true);
    setTimeout(() => setKopieret(false), 2000);
  }

  return (
    <button className="salg-kopiér-knap" onClick={kopiér} title="Kopiér åbningssætning">
      {kopieret ? <Check size={13} /> : <Copy size={13} />}
      <span>{kopieret ? 'Kopieret' : 'Kopiér'}</span>
    </button>
  );
}

function AnbefalingerVisning({ data }: { data: SalgsAnbefalinger }) {
  const [åbneSignaler, setÅbneSignaler] = useState<Set<number>>(new Set());

  function toggleSignal(i: number) {
    setÅbneSignaler(prev => {
      const næste = new Set(prev);
      næste.has(i) ? næste.delete(i) : næste.add(i);
      return næste;
    });
  }

  return (
    <div className="salg-resultat">
      {/* Åbningssætning */}
      <div className="salg-åbning-boks">
        <div className="salg-åbning-label">
          <Phone size={13} />
          <span>Start samtalen med</span>
        </div>
        <p className="salg-åbning-tekst">&ldquo;{data.åbning}&rdquo;</p>
        <KopiérKnap tekst={data.åbning} />
      </div>

      {/* Salgssignaler */}
      <div className="salg-signaler">
        <p className="salg-sektion-label">
          <Lightbulb size={13} />
          <span>Salgssignaler fra rapporten</span>
        </p>
        <div className="salg-signal-liste">
          {data.signaler.map((signal, i) => (
            <div key={i} className="salg-signal-kort">
              <button
                className="salg-signal-header"
                onClick={() => toggleSignal(i)}
              >
                <div className="salg-signal-header-venstre">
                  <span className="salg-signal-nummer">{i + 1}</span>
                  <span className="salg-signal-titel">{signal.titel}</span>
                  <span className={`salg-ydelse-pill ${ydelseFarve(signal.ydelse)}`}>
                    {signal.ydelse}
                  </span>
                </div>
                {åbneSignaler.has(i) ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>

              {åbneSignaler.has(i) && (
                <div className="salg-signal-body">
                  <div className="salg-signal-række">
                    <span className="salg-signal-felt-label">Hvad rapporten viser</span>
                    <p className="salg-signal-tekst">{signal.observation}</p>
                  </div>
                  <div className="salg-signal-række">
                    <span className="salg-signal-felt-label">Hvorfor det er relevant nu</span>
                    <p className="salg-signal-tekst">{signal.relevans}</p>
                  </div>
                  <div className="salg-signal-salgspunkt">
                    <ArrowRight size={13} />
                    <p>{signal.salgspunkt}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tone + næste skridt */}
      <div className="salg-footer-række">
        <div className="salg-footer-kort salg-footer-tone">
          <span className="salg-footer-label">Tone i opkaldet</span>
          <p>{data.tone}</p>
        </div>
        <div className="salg-footer-kort salg-footer-næste">
          <span className="salg-footer-label">Afslut med at foreslå</span>
          <p>{data.næsteSteg}</p>
        </div>
      </div>
    </div>
  );
}

export function BostedSalgsAfsnit({ bostedId, cachetAnbefalinger }: Props) {
  const [anbefalinger, setAnbefalinger] = useState<SalgsAnbefalinger | null>(cachetAnbefalinger);
  const [indlæser, setIndlæser] = useState(false);
  const [fejl, setFejl] = useState<string | null>(null);

  async function genererAnbefalinger() {
    setIndlæser(true);
    setFejl(null);
    try {
      const res = await fetch('/api/salg/anbefalinger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bostedId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.fejl ?? 'Ukendt fejl');
      setAnbefalinger(json.anbefalinger);
    } catch (e) {
      setFejl(e instanceof Error ? e.message : 'Noget gik galt');
    } finally {
      setIndlæser(false);
    }
  }

  return (
    <div className="salg-afsnit-kort">
      <div className="salg-afsnit-header">
        <div className="salg-afsnit-header-venstre">
          <Sparkles size={15} />
          <span className="salg-afsnit-titel">Salgsindsigt</span>
          <span className="salg-afsnit-badge">AI</span>
        </div>
        {anbefalinger && (
          <button
            className="salg-generer-igen-knap"
            onClick={genererAnbefalinger}
            disabled={indlæser}
            title="Generer ny analyse"
          >
            Opdatér
          </button>
        )}
      </div>

      <div className="salg-afsnit-body">
        {anbefalinger ? (
          <AnbefalingerVisning data={anbefalinger} />
        ) : indlæser ? (
          <div className="salg-indlæser">
            <div className="salg-indlæser-animation">
              <span /><span /><span />
            </div>
            <p>Analyserer rapporten&hellip;</p>
          </div>
        ) : fejl ? (
          <div className="salg-fejl">
            <AlertCircle size={15} />
            <span>{fejl}</span>
          </div>
        ) : (
          <div className="salg-start-boks">
            <div className="salg-start-ikon-wrapper">
              <Sparkles size={28} />
            </div>
            <h3 className="salg-start-titel">Lad AI analysere rapporten</h3>
            <p className="salg-start-beskrivelse">
              Få konkrete salgspunkter og en skarp åbningssætning til dit næste opkald — baseret på de faktiske fund i tilsynsrapporten.
            </p>
            <button className="salg-generer-knap" onClick={genererAnbefalinger}>
              <Sparkles size={15} />
              Generér salgsindsigt
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
