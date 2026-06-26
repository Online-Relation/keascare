// src/features/markedsforing/components/LinkedinPage/LinkedinPage.tsx

'use client';

import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { InfoTooltip } from '../shared/InfoTooltip';
import { MetrikKort } from '../shared/MetrikKort';
import {
  linkedinDagligData, linkedinKampagner, linkedinFordeling, linkedinMetrikker,
} from '@/features/markedsforing/data/linkedin.mock';

export function LinkedinPage() {
  return (
    <div className="dashboard-content mf-side">

      <div className="mf-platform-header mf-linkedin-header">
        <div className="mf-platform-logo">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        </div>
        <div>
          <h1 className="mf-platform-titel">LinkedIn Ads</h1>
          <p className="mf-platform-subtitle">Sponsored Content · Lead Gen · Juni 2025 · Dummy data</p>
        </div>
        <div className="mf-periode-badge">Juni 2025</div>
      </div>

      <div className="mf-metrikker">
        {linkedinMetrikker.map((m) => (
          <MetrikKort key={m.label} data={m} />
        ))}
      </div>

      <div className="mf-chart-grid">

        <div className="mf-chart-kort mf-chart-full">
          <div className="mf-chart-header">
            <div>
              <h2 className="mf-chart-titel">Daglig udvikling – forbrug og leads</h2>
              <p className="mf-chart-beskrivelse">LinkedIn-leads er færre men af højere kvalitet. Fokusér på om CPL er acceptabelt frem for volumen.</p>
            </div>
            <InfoTooltip tekst="Grafen viser det daglige forbrug og antal leads fra LinkedIn. LinkedIn er typisk dyrere per klik end Meta og Google, men rammer beslutningstagere direkte." />
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={linkedinDagligData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="dato" tick={{ fontSize: 11, fill: '#9CA3AF' }} tickLine={false} interval={4} />
              <YAxis yAxisId="forbrug" tick={{ fontSize: 11, fill: '#9CA3AF' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v} kr`} width={64} />
              <YAxis yAxisId="leads" orientation="right" tick={{ fontSize: 11, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: 12 }}
                formatter={(val, name) => name === 'forbrug' ? [`${val} kr.`, 'Forbrug'] : [val, 'Leads']}
              />
              <Legend formatter={(val) => val === 'forbrug' ? 'Dagligt forbrug' : 'Leads'} wrapperStyle={{ fontSize: 12 }} />
              <Line yAxisId="forbrug" type="monotone" dataKey="forbrug" stroke="#0A66C2" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
              <Line yAxisId="leads" type="monotone" dataKey="leads" stroke="#0D8A6A" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mf-chart-kort">
          <div className="mf-chart-header">
            <div>
              <h2 className="mf-chart-titel">Leads pr. målgruppe</h2>
              <p className="mf-chart-beskrivelse">Hvem reagerer på dine annoncer?</p>
            </div>
            <InfoTooltip tekst="LinkedIn giver mulighed for at målrette meget præcist på jobtitel og virksomhedsstørrelse. Her ser du hvilke målgrupper der konverterer bedst." />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={linkedinKampagner} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="navn" tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} axisLine={false} width={165} />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: 12 }}
                formatter={(val) => [`${val} leads`, 'Leads']}
              />
              <Bar dataKey="leads" fill="#0A66C2" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mf-chart-kort">
          <div className="mf-chart-header">
            <div>
              <h2 className="mf-chart-titel">Virksomhedsstørrelse</h2>
              <p className="mf-chart-beskrivelse">Reach fordelt på antal ansatte</p>
            </div>
            <InfoTooltip tekst="Bosteder med 201-500 ansatte er den vigtigste målgruppe, da de er store nok til at have beslutningskraft men stadig tilgængelige." />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={linkedinFordeling} cx="50%" cy="50%" innerRadius={60} outerRadius={88} dataKey="værdi" nameKey="navn" paddingAngle={3}>
                {linkedinFordeling.map((seg) => (
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
            <p className="mf-chart-beskrivelse">Detaljeret resultat pr. LinkedIn-kampagne</p>
          </div>
          <InfoTooltip tekst="LinkedIn CPL er typisk højere end Meta, men leadkvaliteten er bedre da du rammer folk med beslutningsmyndighed. Under 200 kr. er stærkt." />
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
            {linkedinKampagner.map((k) => (
              <tr key={k.navn}>
                <td>{k.navn}</td>
                <td className="tal-kolonne table-cell-muted">{k.forbrug.toLocaleString('da-DK')} kr.</td>
                <td className="tal-kolonne table-cell-muted">{k.klik.toLocaleString('da-DK')}</td>
                <td className="tal-kolonne"><strong>{k.leads}</strong></td>
                <td className="tal-kolonne">
                  <span className={`mf-cpl-badge ${k.cpl < 160 ? 'mf-cpl-god' : k.cpl < 190 ? 'mf-cpl-ok' : 'mf-cpl-høj'}`}>
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
