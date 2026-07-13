// src/features/dashboard/components/DashboardPage/sections/DashboardHeader/DashboardHeader.tsx

import { Star } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { GlobalSearch } from '@/features/dashboard/components/GlobalSearch';
import { DatoVælger } from '@/features/dashboard/components/DatoVælger';
import { UserAvatar } from '@/features/auth/components/UserAvatar';
import { NotifikationsCenter } from '@/features/dashboard/components/NotifikationsCenter';

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
        <NotifikationsCenter />
        <Link href="/dashboard/profil" aria-label="Min profil">
          <UserAvatar size={30} fontSize="0.65rem" />
        </Link>
      </div>
    </header>
  );
}
