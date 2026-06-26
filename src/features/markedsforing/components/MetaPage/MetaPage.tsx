// src/features/markedsforing/components/MetaPage/MetaPage.tsx

'use client';

import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { InfoTooltip } from '../shared/InfoTooltip';
import { MetrikKort } from '../shared/MetrikKort';
import {
  metaDagligData, metaKampagner, metaFordeling, metaMetrikker,
} from '@/features/markedsforing/data/meta.mock';

export function MetaPage() {
  return (
    <div className="dashboard-content mf-side">

      <div className="mf-platform-header mf-meta-header">
        <div className="mf-platform-logo">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
            <path d="M12 2.04c-5.51 0-9.96 4.45-9.96 9.96 0 4.96 3.62 9.07 8.37 9.83v-6.96H7.9v-2.87h2.51V9.8c0-2.48 1.48-3.85 3.74-3.85 1.08 0 2.21.19 2.21.19v2.43h-1.24c-1.23 0-1.61.76-1.61 1.54v1.86h2.74l-.44 2.87h-2.3v6.96c4.75-.76 8.37-4.87 8.37-9.83 0-5.51-4.45-9.96-9.96-9.96z"/>
          </svg>
        </div>
        <div>
          <h1 className="mf-platform-titel">Meta Ads</h1>
          <p className="mf-platform-subtitle">Facebook + Instagram · Juni 2025 · Dummy data</p>
        </div>
        <div className="mf-periode-badge">Juni 2025</div>
      </div>

      <div className="mf-metrikker">
        {metaMetrikker.map((m) => (
          <MetrikKort key={m.label} data={m} />
        ))}
      </div>

      <div className="mf-chart-grid">

        <div className="mf-chart-kort mf-chart-full">
          <div className="mf-chart-header">
            <div>
              <h2 className="mf-chart-titel">Daglig udvikling – forbrug og leads</h2>
              <p className="mf-chart-beskrivelse">Sammenhæng mellem hvad du bruger og hvad du får. Ideelt følger leads kurven forbruget.</p>
            </div>
            <InfoTooltip tekst="Grafen viser dine daglige annonceudgifter (blå) og antal leads (lilla) over de seneste 30 dage. Brug den til at spotte hvad der virker, og hvornår." />
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={metaDagligData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="dato" tick={{ fontSize: 11, fill: '#9CA3AF' }} tickLine={false} interval={4} />
              <YAxis yAxisId="forbrug" tick={{ fontSize: 11, fill: '#9CA3AF' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v} kr`} width={64} />
              <YAxis yAxisId="leads" orientation="right" tick={{ fontSize: 11, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: 12 }}
                formatter={(val, name) => name === 'forbrug' ? [`${val} kr.`, 'Forbrug'] : [val, 'Leads']}
              />
              <Legend formatter={(val) => val === 'forbrug' ? 'Dagligt forbrug' : 'Leads'} wrapperStyle={{ fontSize: 12 }} />
              <Line yAxisId="forbrug" type="monotone" dataKey="forbrug" stroke="#1877F2" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
              <Line yAxisId="leads" type="monotone" dataKey="leads" stroke="#8B5CF6" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mf-chart-kort">
          <div className="mf-chart-header">
            <div>
              <h2 className="mf-chart-titel">Leads pr. kampagne</h2>
              <p className="mf-chart-beskrivelse">Hvilke kampagner giver flest leads?</p>
            </div>
            <InfoTooltip tekst="Søjlerne viser antal leads pr. kampagne. En kampagne er en samlet annonce-indsats med et bestemt formål, fx retargeting eller interesse-målretning." />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={metaKampagner} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="navn" tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} axisLine={false} width={160} />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: 12 }}
                formatter={(val) => [`${val} leads`, 'Leads']}
              />
              <Bar dataKey="leads" fill="#1877F2" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mf-chart-kort">
          <div className="mf-chart-header">
            <div>
              <h2 className="mf-chart-titel">Platform-fordeling</h2>
              <p className="mf-chart-beskrivelse">Facebook vs. Instagram</p>
            </div>
            <InfoTooltip tekst="Viser hvordan dit budget er fordelt mellem Facebook og Instagram. Begge platforme kører via Meta Ads Manager." />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={metaFordeling} cx="50%" cy="50%" innerRadius={60} outerRadius={88} dataKey="værdi" nameKey="navn" paddingAngle={3}>
                {metaFordeling.map((seg) => (
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
            <p className="mf-chart-beskrivelse">Detaljeret resultat pr. kampagne</p>
          </div>
          <InfoTooltip tekst="CPL (Cost Per Lead) viser hvad det koster at skaffe ét lead fra en given kampagne. Lavest er bedst." />
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Kampagne</th>
              <th className="tal-kolonne">Forbrug</th>
              <th className="tal-kolonne">Klik</th>
              <th className="tal-kolonne">Leads</th>
              <th className="tal-kolonne">CPL</th>
            </tr>
          </thead>
          <tbody>
            {metaKampagner.map((k) => (
              <tr key={k.navn}>
                <td>{k.navn}</td>
                <td className="tal-kolonne table-cell-muted">{k.forbrug.toLocaleString('da-DK')} kr.</td>
                <td className="tal-kolonne table-cell-muted">{k.klik.toLocaleString('da-DK')}</td>
                <td className="tal-kolonne"><strong>{k.leads}</strong></td>
                <td className="tal-kolonne">
                  <span className={`mf-cpl-badge ${k.cpl < 130 ? 'mf-cpl-god' : k.cpl < 160 ? 'mf-cpl-ok' : 'mf-cpl-høj'}`}>
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
