'use client';

import { useState } from 'react';
import { Mail, Send } from 'lucide-react';

type Props = { bostedNavn?: string };

export function MailchimpSignup({ bostedNavn = '' }: Props) {
  const [bosted, setBosted] = useState(bostedNavn);
  const [email, setEmail] = useState('');
  const [sendt, setSendt] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: Tilslut MailChimp API
    setSendt(true);
  }

  return (
    <div className="mailchimp-boks">
      <div className="mailchimp-header">
        <Mail size={16} />
        <span className="mailchimp-titel">Hold dig opdateret om dette bosted</span>
      </div>
      <p className="mailchimp-beskrivelse">
        Modtag besked når der kommer nye tilsynsrapporter eller væsentlige ændringer.
      </p>

      {sendt ? (
        <div className="mailchimp-kvittering">
          <Send size={15} />
          <span>Tilmeldt — du hører fra os ved næste opdatering.</span>
        </div>
      ) : (
        <form className="mailchimp-form" onSubmit={handleSubmit}>
          <div className="mailchimp-felter">
            <div className="mailchimp-felt-gruppe">
              <label className="mailchimp-label" htmlFor="mc-bosted">Bosted</label>
              <input
                id="mc-bosted"
                className="mailchimp-input"
                type="text"
                placeholder="Bostedets navn"
                value={bosted}
                onChange={(e) => setBosted(e.target.value)}
                required
              />
            </div>
            <div className="mailchimp-felt-gruppe">
              <label className="mailchimp-label" htmlFor="mc-email">E-mailadresse</label>
              <input
                id="mc-email"
                className="mailchimp-input"
                type="email"
                placeholder="din@email.dk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <button className="mailchimp-knap" type="submit">
            <Send size={14} />
            Tilmeld opdateringer
          </button>
        </form>
      )}
    </div>
  );
}
