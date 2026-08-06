// src/features/dashboard/config/NavigationConfig/navigation.config.ts
//
// ÉN fælles kilde til sandheden for alle individuelt tilgangs-styrede menupunkter.
// Sidebaren (DashboardSidebar) og rettighedssiden (/dashboard/admin/brugere)
// læser BEGGE herfra — så de aldrig kan drifte fra hinanden.
//
// Tilføj et nyt menupunkt HER, og det dukker automatisk op begge steder.
// Ikoner holdes ude af denne fil (den må ikke afhænge af lucide-react),
// så den trygt kan importeres fra roller.config.ts uden UI-afhængigheder.

export type NavItemConfig = { label: string; href: string; gruppe: string };

export const NAV_GRUPPER: NavItemConfig[] = [
  { label: 'Dashboard',          href: '/dashboard',                        gruppe: 'Overblik' },

  { label: 'Markedspotentiale',  href: '/dashboard/markedspotentiale',      gruppe: 'Marked' },
  { label: 'Markedsdata',        href: '/dashboard/markedsdata',            gruppe: 'Marked' },
  { label: 'Bosteder på kort',   href: '/dashboard/kort',                   gruppe: 'Marked' },

  { label: 'Kritiske rapporter', href: '/dashboard/rapporter',              gruppe: 'Tilsyn' },
  { label: 'Alle rapporter',     href: '/dashboard/alle-rapporter',         gruppe: 'Tilsyn' },
  { label: 'STPS-inspektører',   href: '/dashboard/rapporter/inspektoerer', gruppe: 'Tilsyn' },

  { label: 'Kunder',             href: '/dashboard/kunder',                 gruppe: 'CRM' },
  { label: 'Produkter',          href: '/dashboard/produkter',              gruppe: 'CRM' },
  { label: 'Tidsregistrering',   href: '/dashboard/tidsregistrering',       gruppe: 'CRM' },
  { label: 'Pakker',             href: '/dashboard/pakker',                 gruppe: 'CRM' },

  { label: 'Kanaler',            href: '/dashboard/markedsforing',          gruppe: 'Markedsføring' },

  { label: 'Regelovervågning',   href: '/dashboard/regelovervagning',       gruppe: 'Regelovervågning' },

  { label: 'Nova',               href: '/dashboard/nova',                   gruppe: 'System' },
  { label: 'Live Monitor',       href: '/dashboard/monitor',                gruppe: 'System' },
  { label: 'Systemstatus',       href: '/dashboard/systemstatus',           gruppe: 'System' },
  { label: 'Scrapers',           href: '/dashboard/scrapers',               gruppe: 'System' },
  { label: 'Monday test',        href: '/dashboard/monday-test',            gruppe: 'System' },
  { label: 'Indstillinger',      href: '/dashboard/indstillinger',          gruppe: 'System' },
  { label: 'Brugere',            href: '/dashboard/admin/brugere',          gruppe: 'System' },
];
