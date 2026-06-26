// src/features/markedsforing/components/GoogleAdsPage/GoogleAdsPage.tsx

'use client';

import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { InfoTooltip } from '../shared/InfoTooltip';
import { MetrikKort } from '../shared/MetrikKort';
import {
  googleDagligData, googleKampagner, googleFordeling, googleMetrikker,
} from '@/features/markedsforing/data/google.mock';

export function GoogleAdsPage() {
  return (
    <div className="dashboard-content mf-side">

      <div className="mf-platform-header mf-google-header">
        <div className="mf-platform-logo">
          <svg width="28" height="28" viewBox="0 0 24 24">
            <path fill="#fff" d="M12 10.8v2.6h3.6c-.15 1-.95 2.55-3.6 2.55-2.17 0-3.93-1.8-3.93-4s1.76-4 3.93-4c1.23 0 2.06.53 2.53 1l1.77-1.71C15.15 6.25 13.73 5.6 12 5.6 8.69 5.6 6 8.29 6 11.6s2.69 6 6 6c3.46 0 5.76-2.44 5.76-5.87 0-.39-.04-.69-.1-1l-5.66.07z"/>
          </svg>
        </div>
        <div>
          <h1 className="mf-platform-titel">Google Ads</h1>
          <p className="mf-platform-subtitle">Search · Display · YouTube · Juni 2025 · Dummy data</p>
        </div>
        <div className="mf-periode-badge">Juni 2025</div>
      </div>

      <div className="mf-metrikker">
        {googleMetrikker.map((m) => (
          <MetrikKort key={m.label} data={m} />
        ))}
      </div>

      <div className="mf-chart-grid">

        <div className="mf-chart-kort mf-chart-full">
          <div className="mf-chart-header">
            <div>
              <h2 className="mf-chart-titel">Klik og konverteringer over tid</h2>
              <p className="mf-chart-beskrivelse">Se om dine klik fører til faktiske henvendelser. Ideelt stiger begge linjer parallelt.</p>
            </div>
            <InfoTooltip tekst="Arealgrafen viser det daglige antal klik (blå) og konverteringer (grøn). En konvertering er en ønsket handling som kontaktformular, opkald eller tilmeldning." />
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={googleDagligData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="klikGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4285F4" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#4285F4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="konvGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34A853" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#34A853" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="dato" tick={{ fontSize: 11, fill: '#9CA3AF' }} tickLine={false} interval={4} />
              <YAxis yAxisId="klik" tick={{ fontSize: 11, fill: '#9CA3AF' }} tickLine={false} axisLine={false} width={40} />
              <YAxis yAxisId="leads" orientation="right" tick={{ fontSize: 11, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: 12 }}
                formatter={(val, name) => [val, name === 'klik' ? 'Klik' : 'Konverteringer']}
              />
              <Legend formatter={(val) => val === 'klik' ? 'Klik' : 'Konverteringer'} wrapperStyle={{ fontSize: 12 }} />
              <Area yAxisId="klik" type="monotone" dataKey="klik" stroke="#4285F4" strokeWidth={2.5} fill="url(#klikGrad)" dot={false} />
              <Area yAxisId="leads" type="monotone" dataKey="leads" stroke="#34A853" strokeWidth={2.5} fill="url(#konvGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mf-chart-kort">
          <div className="mf-chart-header">
            <div>
              <h2 className="mf-chart-titel">Konverteringer pr. kampagne</h2>
              <p className="mf-chart-beskrivelse">Hvem leverer?</p>
            </div>
            <InfoTooltip tekst="Søgeannoncerne (Search) er typisk bedst, fordi brugeren aktivt søger. Display og YouTube bruges til at skabe kendskab." />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={googleKampagner} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="navn" tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} axisLine={false} width={170} />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: 12 }}
                formatter={(val) => [`${val}`, 'Konverteringer']}
              />
              <Bar dataKey="leads" fill="#4285F4" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mf-chart-kort">
          <div className="mf-chart-header">
            <div>
              <h2 className="mf-chart-titel">Budgetfordeling</h2>
              <p className="mf-chart-beskrivelse">Fordeling pr. kampagnetype</p>
            </div>
            <InfoTooltip tekst="Search-annoncer vises, når nogen googler relevante søgeord. Display er bannere på websites. Performance Max kombinerer alle Googles kanaler automatisk." />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={googleFordeling} cx="50%" cy="50%" innerRadius={60} outerRadius={88} dataKey="værdi" nameKey="navn" paddingAngle={3}>
                {googleFordeling.map((seg) => (
                  <Cell key={seg.navn} fill={seg.farve} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: 12 }}
                formatter={(val) => [`${val}%`, '']}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

      </div>

      <div className="mf-tabel-kort">
        <div className="mf-chart-header" style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)' }}>
          <div>
            <h2 className="mf-chart-titel">Kampagneoversigt</h2>
            <p className="mf-chart-beskrivelse">Detaljeret resultat pr. kampagnetype</p>
          </div>
          <InfoTooltip tekst="CPC (Cost Per Click) er prisen per klik. Google belønner relevante annoncer med lavere CPC via Quality Score." />
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Kampagne</th>
              <th className="tal-kolonne">Forbrug</th>
              <th className="tal-kolonne">Klik</th>
              <th className="tal-kolonne">Konverteringer</th>
              <th className="tal-kolonne">CPK</th>
            </tr>
          </thead>
          <tbody>
            {googleKampagner.map((k) => (
              <tr key={k.navn}>
                <td>{k.navn}</td>
                <td className="tal-kolonne table-cell-muted">{k.forbrug.toLocaleString('da-DK')} kr.</td>
                <td className="tal-kolonne table-cell-muted">{k.klik.toLocaleString('da-DK')}</td>
                <td className="tal-kolonne"><strong>{k.leads}</strong></td>
                <td className="tal-kolonne">
                  <span className={`mf-cpl-badge ${k.cpl < 120 ? 'mf-cpl-god' : k.cpl < 160 ? 'mf-cpl-ok' : 'mf-cpl-høj'}`}>
                    {k.cpl} kr.
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
