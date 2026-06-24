// src/features/dashboard/components/DashboardPage/sections/DashboardHeader/DashboardHeader.tsx

import { Bell, Search } from 'lucide-react';

type DashboardHeaderProps = {
  title: string;
  subtitle: string;
};

export function DashboardHeader({ title, subtitle }: DashboardHeaderProps) {
  const now = new Date();
  const dato = now.toLocaleDateString('da-DK', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <header className="dashboard-topbar">
      <div>
        <h1 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--fw-semibold)', color: 'var(--color-text-primary)', margin: 0 }}>
          {title}
        </h1>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '0.125rem' }}>
          {subtitle}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
          {dato}
        </span>
        <button className="btn btn-ghost btn-sm" aria-label="Søg">
          <Search size={15} />
        </button>
        <button className="btn btn-ghost btn-sm" aria-label="Notifikationer">
          <Bell size={15} />
        </button>
        <div className="sidebar-avatar" style={{ width: '1.875rem', height: '1.875rem', fontSize: '0.65rem' }}>
          MK
        </div>
      </div>
    </header>
  );
}
