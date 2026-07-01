'use client';

import { useEffect, useState } from 'react';
import { UserPlus, Trash2, Users, Eye, EyeOff } from 'lucide-react';

type Bruger = {
  id: string;
  email: string;
  navn: string;
  oprettet: string;
  sidstLoggetInd: string | null;
};

export function BrugerAdminPage() {
  const [brugere, setBrugere] = useState<Bruger[]>([]);
  const [loader, setLoader] = useState(true);
  const [email, setEmail] = useState('');
  const [navn, setNavn] = useState('');
  const [kodeord, setKodeord] = useState('');
  const [visKodeord, setVisKodeord] = useState(false);
  const [opretter, setOpretter] = useState(false);
  const [fejl, setFejl] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);

  async function hentBrugere() {
    const res = await fetch('/api/auth/brugere');
    const data = await res.json();
    if (data.ok) setBrugere(data.brugere);
    setLoader(false);
  }

  useEffect(() => { hentBrugere(); }, []);

  async function opretBruger(e: React.FormEvent) {
    e.preventDefault();
    setOpretter(true);
    setFejl(null);
    setSucces(null);

    const res = await fetch('/api/auth/brugere', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, navn, kodeord }),
    });
    const data = await res.json();

    if (!data.ok) {
      setFejl(data.fejl);
    } else {
      setSucces(`${email} er oprettet.`);
      setEmail('');
      setNavn('');
      setKodeord('');
      hentBrugere();
    }
    setOpretter(false);
  }

  async function sletBruger(id: string, brugerEmail: string) {
    if (!confirm(`Slet ${brugerEmail}?`)) return;
    const res = await fetch('/api/auth/brugere', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (data.ok) hentBrugere();
    else alert(data.fejl);
  }

  return (
    <div className="bruger-admin-layout">
      <div className="bruger-admin-header">
        <Users size={20} />
        <div>
          <h1 className="bruger-admin-titel">Brugerstyring</h1>
          <p className="bruger-admin-undertitel">Opret og administrer adgang til KeasCare Markedssignaler</p>
        </div>
      </div>

      <div className="bruger-admin-grid">

        {/* Opret bruger */}
        <div className="bosted-detail-kort">
          <div className="bosted-detail-kort-header">
            <UserPlus size={15} />
            <span className="bosted-detail-kort-titel">Opret ny bruger</span>
          </div>
          <form className="bruger-opret-form bosted-detail-kort-body" onSubmit={opretBruger}>
            <div className="login-felt-gruppe">
              <label className="login-label">Navn</label>
              <input className="login-input" type="text" placeholder="Fornavn Efternavn" value={navn} onChange={(e) => setNavn(e.target.value)} />
            </div>
            <div className="login-felt-gruppe">
              <label className="login-label">E-mailadresse</label>
              <input className="login-input" type="email" placeholder="bruger@email.dk" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="login-felt-gruppe">
              <label className="login-label">Kodeord</label>
              <div className="login-kodeord-wrapper">
                <input
                  className="login-input"
                  type={visKodeord ? 'text' : 'password'}
                  placeholder="Mindst 6 tegn"
                  value={kodeord}
                  onChange={(e) => setKodeord(e.target.value)}
                  required
                  minLength={6}
                />
                <button type="button" className="login-vis-kodeord" onClick={() => setVisKodeord(v => !v)} tabIndex={-1}>
                  {visKodeord ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {fejl && <p className="login-fejl">{fejl}</p>}
            {succes && <p className="bruger-succes">{succes}</p>}
            <button className="btn btn-primary" type="submit" disabled={opretter}>
              <UserPlus size={14} />
              {opretter ? 'Opretter…' : 'Opret bruger'}
            </button>
          </form>
        </div>

        {/* Brugerliste */}
        <div className="bosted-detail-kort">
          <div className="bosted-detail-kort-header">
            <Users size={15} />
            <span className="bosted-detail-kort-titel">Aktive brugere ({brugere.length})</span>
          </div>
          <div className="bruger-liste bosted-detail-kort-body">
            {loader && <p className="bruger-loading">Henter brugere…</p>}
            {!loader && brugere.length === 0 && <p className="bruger-loading">Ingen brugere endnu.</p>}
            {brugere.map((b) => (
              <div key={b.id} className="bruger-række">
                <div className="bruger-info">
                  <span className="bruger-navn">{b.navn || b.email}</span>
                  <span className="bruger-email">{b.navn ? b.email : ''}</span>
                  <span className="bruger-meta">
                    Oprettet {new Date(b.oprettet).toLocaleDateString('da-DK')}
                    {b.sidstLoggetInd && ` · Sidst aktiv ${new Date(b.sidstLoggetInd).toLocaleDateString('da-DK')}`}
                  </span>
                </div>
                <button
                  className="bruger-slet-knap"
                  onClick={() => sletBruger(b.id, b.email ?? '')}
                  title="Slet bruger"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
