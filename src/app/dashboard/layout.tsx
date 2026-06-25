// src/app/dashboard/layout.tsx

import { DashboardSidebar } from '@/features/dashboard/components/DashboardSidebar';
import { DashboardHeader } from '@/features/dashboard/components/DashboardPage/sections/DashboardHeader';
import { MobileNav } from '@/features/dashboard/components/MobileNav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dashboard-layout">
      <DashboardSidebar />
      <div className="dashboard-main">
        <MobileNav />
        <DashboardHeader />
        {children}
      </div>
    </div>
  );
}
