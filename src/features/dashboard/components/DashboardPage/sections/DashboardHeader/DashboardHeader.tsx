// src/features/dashboard/components/DashboardPage/sections/DashboardHeader/DashboardHeader.tsx

'use client';

import { Star } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { GlobalSearch } from '@/features/dashboard/components/GlobalSearch';
import { DatoVælger } from '@/features/dashboard/components/DatoVælger';
import { ProfilMenu } from '@/features/auth/components/ProfilMenu';
import { NotifikationsCenter } from '@/features/dashboard/components/NotifikationsCenter';
import { TidsregistreringWidget } from '@/features/tidsregistrering/components/TidsregistreringWidget';
import { VarsletTilsynIkon } from '@/features/varsletTilsyn/components/VarsletTilsynIkon';

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
        <TidsregistreringWidget />
        <VarsletTilsynIkon />
        <Link href="/dashboard/favoritter" className="btn btn-ghost btn-sm" aria-label="Fulgte bosteder">
          <Star size={15} />
        </Link>
        <NotifikationsCenter />
        <ProfilMenu variant="header" />
      </div>
    </header>
  );
}
