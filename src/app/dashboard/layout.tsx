// src/app/dashboard/layout.tsx

import { DashboardSidebar } from '@/features/dashboard/components/DashboardSidebar';
import { MobileNav } from '@/features/dashboard/components/MobileNav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dashboard-layout">
      <DashboardSidebar />
      <MobileNav />
      <div className="dashboard-main">
        {children}
      </div>
    </div>
  );
}
