'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseAuthBrowserClient } from '@/lib/db/SupabaseClient/supabaseAuthClient';
import { LogIn, Eye, EyeOff } from 'lucide-react';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [kodeord, setKodeord] = useState('');
  const [visSprint, setVisSprint] = useState(false);
  const [fejl, setFejl] = useState<string | null>(null);
  const [loader, setLoader] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFejl(null);
    setLoader(true);

    const supabase = getSupabaseAuthBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password: kodeord });

    if (error) {
      setFejl('Forkert e-mail eller kodeord.');
      setLoader(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <div className="login-felt-gruppe">
        <label className="login-label" htmlFor="email">E-mailadresse</label>
        <input
          id="email"
          className="login-input"
          type="email"
          placeholder="din@email.dk"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>

      <div className="login-felt-gruppe">
        <label className="login-label" htmlFor="kodeord">Kodeord</label>
        <div className="login-kodeord-wrapper">
          <input
            id="kodeord"
            className="login-input"
            type={visSprint ? 'text' : 'password'}
            placeholder="••••••••"
            value={kodeord}
            onChange={(e) => setKodeord(e.target.value)}
            required
            autoComplete="current-password"
          />
          <button
            type="button"
            className="login-vis-kodeord"
            onClick={() => setVisSprint((v) => !v)}
            tabIndex={-1}
          >
            {visSprint ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {fejl && <p className="login-fejl">{fejl}</p>}

      <button className="login-knap" type="submit" disabled={loader}>
        <LogIn size={16} />
        {loader ? 'Logger ind…' : 'Log ind'}
      </button>
    </form>
  );
}
