'use client';

import { useState, useEffect, useRef } from 'react';
import { User, KeyRound, Camera, Check, AlertCircle } from 'lucide-react';
import { getSupabaseAuthBrowserClient } from '@/lib/db/SupabaseClient/supabaseAuthClient';

type Besked = { type: 'ok' | 'fejl'; tekst: string };

function StatusBesked({ besked }: { besked: Besked }) {
  return (
    <div className={`profil-besked profil-besked--${besked.type}`}>
      {besked.type === 'ok' ? <Check size={14} /> : <AlertCircle size={14} />}
      {besked.tekst}
    </div>
  );
}

export function ProfilPage() {
  const supabase = getSupabaseAuthBrowserClient();
  const filInputRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState('');
  const [navn, setNavn] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploaderBillede, setUploaderBillede] = useState(false);
  const [billedBesked, setBilledBesked] = useState<Besked | null>(null);

  const [nytKodeord, setNytKodeord] = useState('');
  const [bekræftKodeord, setBekræftKodeord] = useState('');
  const [gemmerKodeord, setGemmerKodeord] = useState(false);
  const [kodeordBesked, setKodeordBesked] = useState<Besked | null>(null);

  const [gemmerNavn, setGemmerNavn] = useState(false);
  const [navnBesked, setNavnBesked] = useState<Besked | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) return;
      setEmail(user.email ?? '');
      setNavn(user.user_metadata?.navn ?? '');
      setAvatarUrl(user.user_metadata?.avatar_url ?? null);
    });
  }, []);

  async function gemNavn(e: React.FormEvent) {
    e.preventDefault();
    setGemmerNavn(true);
    setNavnBesked(null);
    const { error } = await supabase.auth.updateUser({ data: { navn } });
    setNavnBesked(error
      ? { type: 'fejl', tekst: error.message }
      : { type: 'ok', tekst: 'Navn er opdateret.' }
    );
    setGemmerNavn(false);
  }

  async function skiftKodeord(e: React.FormEvent) {
    e.preventDefault();
    setKodeordBesked(null);
    if (nytKodeord !== bekræftKodeord) {
      setKodeordBesked({ type: 'fejl', tekst: 'Kodeordene matcher ikke.' });
      return;
    }
    if (nytKodeord.length < 6) {
      setKodeordBesked({ type: 'fejl', tekst: 'Kodeord skal være mindst 6 tegn.' });
      return;
    }
    setGemmerKodeord(true);
    const { error } = await supabase.auth.updateUser({ password: nytKodeord });
    setKodeordBesked(error
      ? { type: 'fejl', tekst: error.message }
      : { type: 'ok', tekst: 'Kodeord er opdateret.' }
    );
    if (!error) { setNytKodeord(''); setBekræftKodeord(''); }
    setGemmerKodeord(false);
  }

  async function uploadBillede(e: React.ChangeEvent<HTMLInputElement>) {
    const fil = e.target.files?.[0];
    if (!fil) return;
    setBilledBesked(null);
    setUploaderBillede(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const filExt = fil.name.split('.').pop();
    const filSti = `avatarer/${user.id}.${filExt}`;

    const { error: uploadFejl } = await supabase.storage
      .from('profil-billeder')
      .upload(filSti, fil, { upsert: true });

    if (uploadFejl) {
      setBilledBesked({ type: 'fejl', tekst: uploadFejl.message });
      setUploaderBillede(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('profil-billeder')
      .getPublicUrl(filSti);

    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
    await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
    setAvatarUrl(publicUrl);
    setBilledBesked({ type: 'ok', tekst: 'Profilbillede er opdateret.' });
    setUploaderBillede(false);
  }

  const initialer = navn
    ? navn.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : email.slice(0, 2).toUpperCase();

  return (
    <div className="profil-layout">
      <div className="profil-header">
        <User size={20} />
        <div>
          <h1 className="profil-titel">Min profil</h1>
          <p className="profil-undertitel">{email}</p>
        </div>
      </div>

      <div className="profil-grid">

        {/* Avatar + navn */}
        <div className="bosted-detail-kort">
          <div className="bosted-detail-kort-header">
            <User size={15} />
            <span className="bosted-detail-kort-titel">Profilbillede og navn</span>
          </div>
          <div className="bosted-detail-kort-body">
            <div className="profil-avatar-sektion">
              <div className="profil-avatar-wrapper">
                {avatarUrl
                  ? <img src={avatarUrl} alt="Profilbillede" className="profil-avatar-billede" />
                  : <div className="profil-avatar-initialer">{initialer}</div>
                }
                <button
                  className="profil-avatar-kamera"
                  onClick={() => filInputRef.current?.click()}
                  disabled={uploaderBillede}
                  title="Skift profilbillede"
                >
                  <Camera size={14} />
                </button>
                <input
                  ref={filInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  style={{ display: 'none' }}
                  onChange={uploadBillede}
                />
              </div>
              <p className="profil-avatar-info">
                {uploaderBillede ? 'Uploader…' : 'Klik på kameraet for at skifte billede'}
              </p>
              {billedBesked && <StatusBesked besked={billedBesked} />}
            </div>

            <form className="profil-form" onSubmit={gemNavn}>
            <div className="login-felt-gruppe">
              <label className="login-label">Navn</label>
              <input
                className="login-input"
                type="text"
                placeholder="Fornavn Efternavn"
                value={navn}
                onChange={(e) => setNavn(e.target.value)}
              />
            </div>
              {navnBesked && <StatusBesked besked={navnBesked} />}
              <button className="btn btn-primary btn-sm" type="submit" disabled={gemmerNavn}>
                {gemmerNavn ? 'Gemmer…' : 'Gem navn'}
              </button>
            </form>
          </div>
        </div>

        {/* Skift kodeord */}
        <div className="bosted-detail-kort">
          <div className="bosted-detail-kort-header">
            <KeyRound size={15} />
            <span className="bosted-detail-kort-titel">Skift kodeord</span>
          </div>
          <form className="profil-form bosted-detail-kort-body" onSubmit={skiftKodeord}>
            <div className="login-felt-gruppe">
              <label className="login-label">Nyt kodeord</label>
              <input
                className="login-input"
                type="password"
                placeholder="Mindst 6 tegn"
                value={nytKodeord}
                onChange={(e) => setNytKodeord(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="login-felt-gruppe">
              <label className="login-label">Bekræft kodeord</label>
              <input
                className="login-input"
                type="password"
                placeholder="Gentag kodeord"
                value={bekræftKodeord}
                onChange={(e) => setBekræftKodeord(e.target.value)}
                required
              />
            </div>
            {kodeordBesked && <StatusBesked besked={kodeordBesked} />}
            <button className="btn btn-primary btn-sm" type="submit" disabled={gemmerKodeord}>
              <KeyRound size={14} />
              {gemmerKodeord ? 'Gemmer…' : 'Skift kodeord'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
