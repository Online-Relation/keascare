// src/features/dashboard/components/DashboardPage/sections/DashboardHeader/DashboardHeader.tsx

import { Bell, Star } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { GlobalSearch } from '@/features/dashboard/components/GlobalSearch';
import { DatoVælger } from '@/features/dashboard/components/DatoVælger';

export function DashboardHeader() {
  return (
    <header className="dashboard-topbar">
      <div className="dashboard-topbar-venstre">
        <Suspense>
          <DatoVælger variant="desktop" />
        </Suspense>
      </div>

      <div className="dashboard-topbar-center">
        <GlobalSearch />
      </div>

      <div className="dashboard-topbar-højre">
        <Link href="/dashboard/favoritter" className="btn btn-ghost btn-sm" aria-label="Fulgte bosteder">
          <Star size={15} />
        </Link>
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
