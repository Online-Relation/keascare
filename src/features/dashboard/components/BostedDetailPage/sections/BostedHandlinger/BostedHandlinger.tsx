'use client';

import { PlusCircle, ExternalLink, PhoneOff, Clock, CheckCircle } from 'lucide-react';

type Props = {
  mondayItemId?: string | null;
};

export function BostedHandlinger({ mondayItemId }: Props) {
  const MONDAY_URL = mondayItemId
    ? `https://onlinerelation.monday.com/boards/${process.env.NEXT_PUBLIC_MONDAY_BOARD_ID}/pulses/${mondayItemId}`
    : null;

  return (
    <div className="bosted-detail-kort">
      <div className="bosted-detail-kort-header">
        <span className="bosted-detail-kort-titel">Handlinger</span>
      </div>
      <div className="bosted-detail-kort-body" style={{ gap: '1.25rem' }}>

        {/* CRM */}
        <div className="bosted-salg-sektion">
          <p className="bosted-salg-titel">CRM</p>
          <div className="bosted-salg-knapper">
            {MONDAY_URL ? (
              <a href={MONDAY_URL} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                <ExternalLink size={14} />
                Åbn i Monday
              </a>
            ) : (
              <button className="btn btn-primary btn-sm" disabled title="Kommer når Monday-write aktiveres">
                <PlusCircle size={14} />
                Opret lead i Monday
              </button>
            )}
          </div>
        </div>

        {/* Kold canvas salg */}
        <div className="bosted-salg-sektion">
          <p className="bosted-salg-titel">Kold canvas</p>
          <div className="bosted-salg-knapper">
            <button className="btn btn-outline btn-sm" disabled title="Kommer snart">
              <CheckCircle size={14} />
              Kontaktet
            </button>
            <button className="btn btn-outline btn-sm" disabled title="Kommer snart">
              <Clock size={14} />
              Kontakt senere
            </button>
            <button className="btn btn-outline btn-sm" disabled title="Kommer snart" style={{ color: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}>
              <PhoneOff size={14} />
              Afvist
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
