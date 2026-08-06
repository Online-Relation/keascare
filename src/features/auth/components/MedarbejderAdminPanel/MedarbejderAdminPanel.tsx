'use client';
// src/features/auth/components/MedarbejderAdminPanel/MedarbejderAdminPanel.tsx
//
// Administration af KeasCare-medarbejdere (uden login). Bruges til at angive
// hvilken medarbejder der er ude på et bosted. Kan valgfrit knyttes til en
// eksisterende bruger med login.

import { useEffect, useState } from 'react';
import { UserPlus, Trash2, Users, Link2 } from 'lucide-react';
import type { Medarbejder } from '@/features/medarbejdere/types/medarbejdere.types';

type LoginBruger = { id: string; email: string; navn: string };

export function MedarbejderAdminPanel() {
  const [medarbejdere, setMedarbejdere] = useState<Medarbejder[]>([]);
  const [loginBrugere, setLoginBrugere] = useState<LoginBruger[]>([]);
  const [loader, setLoader] = useState(true);

  const [navn, setNavn] = useState('');
  const [stilling, setStilling] = useState('');
  const [telefon, setTelefon] = useState('');
  const [email, setEmail] = useState('');
  const [brugerId, setBrugerId] = useState('');
  const [opretter, setOpretter] = useState(false);
  const [fejl, setFejl] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);

  async function hentAlt() {
    const [medarbejderRes, brugerRes] = await Promise.all([
      fetch('/api/medarbejdere'),
      fetch('/api/auth/brugere'),
    ]);
    const medarbejderData = await medarbejderRes.json();
    const brugerData = await brugerRes.json();
    if (medarbejderData.ok) setMedarbejdere(medarbejderData.medarbejdere);
    if (brugerData.ok) setLoginBrugere(brugerData.brugere);
    setLoader(false);
  }

  useEffect(() => { hentAlt(); }, []);

  async function opretMedarbejder(e: React.FormEvent) {
    e.preventDefault();
    setOpretter(true);
    setFejl(null);
    setSucces(null);

    const res = await fetch('/api/medarbejdere', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        navn,
        stillingsbetegnelse: stilling || null,
        telefon: telefon || null,
        email: email || null,
        brugerId: brugerId || null,
      }),
    });
    const data = await res.json();

    if (!data.ok) {
      setFejl(data.fejl);
    } else {
      setSucces(`${navn} er oprettet som medarbejder.`);
      setNavn(''); setStilling(''); setTelefon(''); setEmail(''); setBrugerId('');
      hentAlt();
    }
    setOpretter(false);
  }

  async function knytTilBruger(id: string, nyBrugerId: string) {
    const res = await fetch('/api/medarbejdere', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, brugerId: nyBrugerId || null }),
    });
    const data = await res.json();
    if (data.ok) hentAlt();
    else alert(data.fejl);
  }

  async function sletMedarbejder(id: string, medarbejderNavn: string) {
    if (!confirm(`Slet ${medarbejderNavn}?`)) return;
    const res = await fetch('/api/medarbejdere', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (data.ok) hentAlt();
    else alert(data.fejl);
  }

  return (
    <div className="bruger-admin-grid">

      {/* Opret medarbejder */}
      <div className="bosted-detail-kort">
        <div className="bosted-detail-kort-header">
          <UserPlus size={15} />
          <span className="bosted-detail-kort-titel">Opret ny medarbejder</span>
        </div>
        <form className="bruger-opret-form bosted-detail-kort-body" onSubmit={opretMedarbejder}>
          <div className="login-felt-gruppe">
            <label className="login-label">Navn</label>
            <input className="login-input" type="text" placeholder="Fornavn Efternavn" value={navn} onChange={(e) => setNavn(e.target.value)} required />
          </div>
          <div className="login-felt-gruppe">
            <label className="login-label">Stillingsbetegnelse</label>
            <input className="login-input" type="text" placeholder="fx Sygeplejerske" value={stilling} onChange={(e) => setStilling(e.target.value)} />
          </div>
          <div className="login-felt-gruppe">
            <label className="login-label">Telefon</label>
            <input className="login-input" type="tel" placeholder="Valgfri" value={telefon} onChange={(e) => setTelefon(e.target.value)} />
          </div>
          <div className="login-felt-gruppe">
            <label className="login-label">E-mail</label>
            <input className="login-input" type="email" placeholder="Valgfri" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="login-felt-gruppe">
            <label className="login-label">Tilknyt eksisterende bruger (valgfrit)</label>
            <select className="login-input" value={brugerId} onChange={(e) => setBrugerId(e.target.value)}>
              <option value="">Ingen login-bruger</option>
              {loginBrugere.map((b) => (
                <option key={b.id} value={b.id}>{b.navn || b.email}</option>
              ))}
            </select>
          </div>
          {fejl && <p className="login-fejl">{fejl}</p>}
          {succes && <p className="bruger-succes">{succes}</p>}
          <button className="btn btn-primary" type="submit" disabled={opretter}>
            <UserPlus size={14} />
            {opretter ? 'Opretter…' : 'Opret medarbejder'}
          </button>
        </form>
      </div>

      {/* Medarbejderliste */}
      <div className="bosted-detail-kort">
        <div className="bosted-detail-kort-header">
          <Users size={15} />
          <span className="bosted-detail-kort-titel">Medarbejdere ({medarbejdere.length})</span>
        </div>
        <div className="bruger-liste bosted-detail-kort-body">
          {loader && <p className="bruger-loading">Henter medarbejdere…</p>}
          {!loader && medarbejdere.length === 0 && <p className="bruger-loading">Ingen medarbejdere endnu.</p>}
          {medarbejdere.map((m) => (
            <div key={m.id} className="bruger-række">
              <div className="bruger-info">
                <span className="bruger-navn">{m.navn}</span>
                <span className="bruger-email">{m.stillingsbetegnelse ?? '—'}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                  <Link2 size={11} style={{ color: 'var(--color-text-muted)' }} />
                  <select
                    style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                    value={m.brugerId ?? ''}
                    onChange={(e) => knytTilBruger(m.id, e.target.value)}
                  >
                    <option value="">Ingen login-bruger</option>
                    {loginBrugere.map((b) => (
                      <option key={b.id} value={b.id}>{b.navn || b.email}</option>
                    ))}
                  </select>
                </div>
                <span className="bruger-meta">
                  Oprettet {new Date(m.oprettet).toLocaleDateString('da-DK')}
                  {m.brugerEmail && ` · Knyttet til ${m.brugerEmail}`}
                </span>
              </div>
              <button className="bruger-slet-knap" onClick={() => sletMedarbejder(m.id, m.navn)} title="Slet medarbejder">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
