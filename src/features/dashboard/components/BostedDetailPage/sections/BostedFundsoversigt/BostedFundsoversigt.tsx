// src/features/dashboard/components/BostedDetailPage/sections/BostedFundsoversigt/BostedFundsoversigt.tsx

'use client';
import React, { useState } from 'react';
import { ShieldAlert, Info, Check, X, Minus, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type { BostedDetail, FundItem, FundStatus } from '@/features/dashboard/types/dashboard.types';

type BostedFundsoversigtProps = {
  bosted: BostedDetail;
};

// STPS-rapporter indsætter ofte sektionsoverskrifter midt i en linje uden linjeskift,
// fx "...vurderet, at der på Perlen er: Mindre problemer ... Journalføring Vi konstaterede ...".
// Disse kendte overskrifter brydes derfor eksplicit ud, så de ikke flyder sammen med brødtekst.
const KENDTE_OVERSKRIFTER = [
  'Samlet vurdering efter tilsyn',
  'Journalføring',
  'Medicinhåndtering',
  'Instrukser',
  'Hygiejne',
  'Utilsigtede hændelser',
  'Magtanvendelse',
  'Patientrettigheder og inddragelse',
  'Patientrettigheder',
  'Selvbestemmelse',
  'Vi afslutter tilsynet',
];

function bryOverskrifterUd(tekst: string): string {
  let resultat = tekst;
  for (const overskrift of KENDTE_OVERSKRIFTER) {
    const regex = new RegExp(`(^|[^\\n])\\s*(${overskrift})(?=\\s+[A-ZÆØÅ])`, 'g');
    resultat = resultat.replace(regex, (_match, foran, fundet) => {
      const adskiller = foran && foran !== '\n' ? `${foran}\n\n` : foran;
      return `${adskiller}${fundet}\n`;
    });
  }
  return resultat;
}

function rensVurdering(tekst: string): string {
  return bryOverskrifterUd(tekst)
    .replace(/--\s*\d+\s*of\s*\d+\s*--/gi, '')
    .replace(/Tilsynsrapport[\s\S]{0,80}?Side \d+ af \d+\s*/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function erOverskrift(linje: string): boolean {
  if (KENDTE_OVERSKRIFTER.includes(linje)) return true;
  // Kort linje uden afsluttende punktum — typisk en sektionsoverskrift
  return linje.length > 0 && linje.length <= 65 && !/[.!?,]$/.test(linje) && /^[A-ZÆØÅ]/.test(linje);
}

// Deler meget lange afsnit op i mindre stykker af nogle få sætninger ad gangen,
// så brødteksten bliver læsbar i stedet for én lang mur af tekst.
const MAX_AFSNIT_LÆNGDE = 380;

function delLangtAfsnitOp(tekst: string): string[] {
  if (tekst.length <= MAX_AFSNIT_LÆNGDE) return [tekst];

  const sætninger = tekst.match(/[^.!?]+[.!?]+(\s+|$)/g) ?? [tekst];
  const stykker: string[] = [];
  let nuværende = '';

  for (const sætning of sætninger) {
    if (nuværende && (nuværende + sætning).length > MAX_AFSNIT_LÆNGDE) {
      stykker.push(nuværende.trim());
      nuværende = sætning;
    } else {
      nuværende += sætning;
    }
  }
  if (nuværende.trim()) stykker.push(nuværende.trim());

  return stykker.length > 0 ? stykker : [tekst];
}

function formatVurdering(tekst: string): React.ReactNode[] {
  const renset = rensVurdering(tekst);

  // Split på dobbelt linjeskift = naturlige afsnit
  const afsnit = renset.split(/\n\n+/);
  const elementer: React.ReactNode[] = [];

  for (const afsnit_ of afsnit) {
    // Saml PDF-brudte linjer inden for et afsnit til én sammenhængende tekst
    const linjer = afsnit_.split('\n').map((l) => l.trim()).filter(Boolean);
    const sammensatte: string[] = [];
    let nuværende = '';

    for (const linje of linjer) {
      if (!nuværende) {
        nuværende = linje;
      } else if (/[.!?:]$/.test(nuværende) || KENDTE_OVERSKRIFTER.includes(nuværende)) {
        // Forrige linje sluttede en sætning, eller var en kendt overskrift → nyt punkt
        sammensatte.push(nuværende);
        nuværende = linje;
      } else {
        // Fortsæt på samme linje
        nuværende += ' ' + linje;
      }
    }
    if (nuværende) sammensatte.push(nuværende);

    for (let i = 0; i < sammensatte.length; i++) {
      const linje = sammensatte[i];
      if (erOverskrift(linje)) {
        elementer.push(
          <strong key={`${afsnit_}-${i}`} className="fund-vurdering-overskrift">{linje}</strong>
        );
      } else {
        const stykker = delLangtAfsnitOp(linje);
        stykker.forEach((stykke, j) => {
          elementer.push(
            <p key={`${afsnit_}-${i}-${j}`} className="fund-vurdering-afsnit">{stykke}</p>
          );
        });
      }
    }
  }

  return elementer;
}

const STATUS_IKON: Record<FundStatus, React.ReactNode> = {
  opfyldt:      <span className="fund-status-ikon fund-status-opfyldt"><Check size={12} strokeWidth={3} /></span>,
  ikke_opfyldt: <span className="fund-status-ikon fund-status-ikke-opfyldt"><X size={12} strokeWidth={3} /></span>,
  ikke_aktuelt: <span className="fund-status-ikon fund-status-ikke-aktuelt"><Minus size={12} strokeWidth={3} /></span>,
  ukendt:       <span className="fund-status-ikon fund-status-ukendt"><HelpCircle size={12} /></span>,
};

const STATUS_LABEL: Record<FundStatus, string> = {
  opfyldt:      'Opfyldt',
  ikke_opfyldt: 'Ikke opfyldt',
  ikke_aktuelt: 'Ikke aktuelt',
  ukendt:       'Ukendt',
};

function FundItemRække({ item }: { item: FundItem }) {
  return (
    <div className={`fund-item fund-item--${item.status.replace('_', '-')}`}>
      <div className="fund-item-top">
        <div className="fund-item-status">
          {STATUS_IKON[item.status]}
          <span className="fund-item-status-label">{STATUS_LABEL[item.status]}</span>
        </div>
        <p className="fund-item-tekst">
          <span className="fund-item-nummer">{item.nummer}.</span> {item.målepunkt}
        </p>
      </div>
      {item.kommentar && (
        <div className="fund-item-kommentar">
          <Info size={12} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
          <span>{item.kommentar}</span>
        </div>
      )}
    </div>
  );
}

function grupperItems(items: FundItem[]): Record<string, FundItem[]> {
  return items.reduce<Record<string, FundItem[]>>((acc, item) => {
    if (!acc[item.sektion]) acc[item.sektion] = [];
    acc[item.sektion].push(item);
    return acc;
  }, {});
}

function IkkeAktueltGruppe({ items }: { items: FundItem[] }) {
  const [åben, setÅben] = useState(false);
  return (
    <div className="fund-ikke-aktuelt-gruppe">
      <button className="fund-ikke-aktuelt-toggle" onClick={() => setÅben((v) => !v)}>
        <span className="fund-status-ikon fund-status-ikke-aktuelt"><Minus size={12} strokeWidth={3} /></span>
        <span>{items.length} ikke aktuelt</span>
        {åben ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>
      {åben && (
        <div className="fund-ikke-aktuelt-liste">
          {items.map((item) => (
            <FundItemRække key={item.nummer} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

export function BostedFundsoversigt({ bosted }: BostedFundsoversigtProps) {
  if (!bosted.pdfBehandlet) {
    return (
      <div className="bosted-fundsoversigt-kort">
        <div className="bosted-detail-kort-header">
          <ShieldAlert size={15} />
          <span className="bosted-detail-kort-titel">Fundsoversigt fra rapporten</span>
        </div>
        <div className="bosted-detail-kort-body">
          <div className="bosted-detail-mangler-boks">
            <Info size={14} style={{ flexShrink: 0 }} />
            <span>Rapportdetaljer er endnu ikke hentet. Kør detail-scraperen.</span>
          </div>
        </div>
      </div>
    );
  }

  const harFundItems = bosted.fundItems && bosted.fundItems.length > 0;
  const aktiveItems    = harFundItems ? bosted.fundItems!.filter((i) => i.status !== 'ikke_aktuelt') : [];
  const ikkeAktuelt    = harFundItems ? bosted.fundItems!.filter((i) => i.status === 'ikke_aktuelt') : [];
  const sektioner      = aktiveItems.length > 0 ? grupperItems(aktiveItems) : null;

  return (
    <div className="bosted-fundsoversigt-kort">
      <div className="bosted-detail-kort-header">
        <ShieldAlert size={15} />
        <span className="bosted-detail-kort-titel">Fundsoversigt fra rapporten</span>
        {harFundItems && (
          <div className="fund-oversigt-badges">
            {(() => {
              const tæl = (s: FundStatus) => bosted.fundItems!.filter(i => i.status === s).length;
              return (
                <>
                  {tæl('opfyldt') > 0 && <span className="fund-badge fund-badge--opfyldt">{tæl('opfyldt')} opfyldt</span>}
                  {tæl('ikke_opfyldt') > 0 && <span className="fund-badge fund-badge--ikke-opfyldt">{tæl('ikke_opfyldt')} ikke opfyldt</span>}
                  {tæl('ikke_aktuelt') > 0 && <span className="fund-badge fund-badge--ikke-aktuelt">{tæl('ikke_aktuelt')} ikke aktuelt</span>}
                </>
              );
            })()}
          </div>
        )}
      </div>

      <div className="bosted-fundsoversigt-body">
        {bosted.pdfVurdering && (
          <div className="bosted-fundsoversigt-sektion fund-vurdering-wrapper">
            {formatVurdering(bosted.pdfVurdering)}
          </div>
        )}

        {harFundItems && (
          <div className="fund-items-wrapper">
            {sektioner && Object.entries(sektioner).map(([sektion, items]) => (
              <div key={sektion} className="fund-sektion">
                <h4 className="fund-sektion-titel">{sektion}</h4>
                <div className="fund-sektion-items">
                  {items.map((item) => (
                    <FundItemRække key={item.nummer} item={item} />
                  ))}
                </div>
              </div>
            ))}
            {ikkeAktuelt.length > 0 && (
              <IkkeAktueltGruppe items={ikkeAktuelt} />
            )}
          </div>
        )}

        {!harFundItems && bosted.pdfFund && (
          <div className="bosted-fundsoversigt-sektion">
            <p className="fund-vurdering-tekst" style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
              Struktureret parsing ikke tilgængelig for denne rapport. Kør &quot;STPS — Udtræk fund-items&quot; scraperen.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
