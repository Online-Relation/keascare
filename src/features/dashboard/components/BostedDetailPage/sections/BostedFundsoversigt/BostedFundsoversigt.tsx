// src/features/dashboard/components/BostedDetailPage/sections/BostedFundsoversigt/BostedFundsoversigt.tsx

import { ShieldAlert, Info, Check, X, Minus, HelpCircle } from 'lucide-react';
import type { BostedDetail, FundItem, FundStatus } from '@/features/dashboard/types/dashboard.types';

type BostedFundsoversigtProps = {
  bosted: BostedDetail;
};

function rensVurdering(tekst: string): string {
  return tekst
    .replace(/--\s*\d+\s*of\s*\d+\s*--/gi, '')
    .replace(/Tilsynsrapport[\s\S]{0,80}?Side \d+ af \d+\s*/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
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
  const sektioner = harFundItems ? grupperItems(bosted.fundItems!) : null;

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
          <div className="bosted-fundsoversigt-sektion">
            <p className="fund-vurdering-tekst">{rensVurdering(bosted.pdfVurdering)}</p>
          </div>
        )}

        {harFundItems && sektioner && (
          <div className="fund-items-wrapper">
            {Object.entries(sektioner).map(([sektion, items]) => (
              <div key={sektion} className="fund-sektion">
                <h4 className="fund-sektion-titel">{sektion}</h4>
                <div className="fund-sektion-items">
                  {items.map((item) => (
                    <FundItemRække key={item.nummer} item={item} />
                  ))}
                </div>
              </div>
            ))}
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
