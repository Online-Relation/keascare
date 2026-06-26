'use client';

// src/features/dashboard/components/DashboardSidebar/DashboardSidebar.tsx

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  TrendingUp,
  BarChart2,
  Settings,
  FileText,
  RefreshCw,
  MapPin,
  Megaphone,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard',        href: '/dashboard',                  icon: LayoutDashboard },
  { label: 'Markedssignaler',  href: '/dashboard/markedssignaler',  icon: TrendingUp },
  { label: 'Tilsynsrapporter', href: '/dashboard/rapporter',        icon: ClipboardList },
  { label: 'Kommuner',         href: '/dashboard/kommuner',         icon: MapPin },
  { label: 'Markedsdata',      href: '/dashboard/markedsdata',      icon: BarChart2 },
  { label: 'Scrapers',         href: '/dashboard/scrapers',         icon: RefreshCw },
  { label: 'Indstillinger',    href: '/dashboard/indstillinger',    icon: Settings },
];

const markedsforingItems = [
  { label: 'Meta',        href: '/dashboard/markedsforing/meta' },
  { label: 'Google Ads',  href: '/dashboard/markedsforing/google' },
  { label: 'LinkedIn',    href: '/dashboard/markedsforing/linkedin' },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const erMarkedsforingAktiv = pathname.startsWith('/dashboard/markedsforing');
  const [markedsforingÅben, setMarkedsforingÅben] = useState(erMarkedsforingAktiv);

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">KC</div>
        KeasCare
      </div>

      <nav className="sidebar-section" style={{ flex: 1 }}>
        <p className="sidebar-section-label">Navigation</p>
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
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

        <button
          className={`sidebar-nav-item sidebar-nav-gruppe${erMarkedsforingAktiv ? ' active' : ''}`}
          onClick={() => setMarkedsforingÅben((v) => !v)}
        >
          <Megaphone className="sidebar-nav-item-icon" size={16} />
          <span style={{ flex: 1, textAlign: 'left' }}>Markedsføring</span>
          {markedsforingÅben ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {markedsforingÅben && (
          <div className="sidebar-subnav">
            {markedsforingItems.map(({ label, href }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`sidebar-subnav-item${isActive ? ' active' : ''}`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        )}
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
