'use client';

// src/features/dashboard/components/DashboardSidebar/DashboardSidebar.tsx

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ClipboardList,
  TrendingUp,
  BarChart2,
  Settings,
  FileText,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard',        href: '/dashboard',               icon: LayoutDashboard },
  { label: 'Markedssignaler',  href: '/dashboard/markedssignaler', icon: TrendingUp },
  { label: 'Tilsynsrapporter', href: '/dashboard/tilsynsrapporter', icon: ClipboardList },
  { label: 'Rapporter',        href: '/dashboard/rapporter',     icon: FileText },
  { label: 'Markedsdata',      href: '/dashboard/markedsdata',   icon: BarChart2 },
  { label: 'Indstillinger',    href: '/dashboard/indstillinger', icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">KC</div>
        KeasCare
      </div>

      <nav className="sidebar-section" style={{ flex: 1 }}>
        <p className="sidebar-section-label">Navigation</p>
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`sidebar-nav-item${isActive ? ' active' : ''}`}
            >
              <Icon className="sidebar-nav-item-icon" size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-avatar">MK</div>
        <div>
          <p className="sidebar-user-name">Mads Kristensen</p>
          <p className="sidebar-user-role">Administrator</p>
        </div>
      </div>
    </aside>
  );
}
