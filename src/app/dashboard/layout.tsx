// src/app/dashboard/layout.tsx

import { DashboardSidebar } from '@/features/dashboard/components/DashboardSidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dashboard-layout">
      <DashboardSidebar />
      {children}
    </div>
  );
}
