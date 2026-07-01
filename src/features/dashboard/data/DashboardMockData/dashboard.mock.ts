// src/features/dashboard/data/DashboardMockData/dashboard.mock.ts

import type { DashboardData } from '../../types/dashboard.types';

export const dashboardMockData: DashboardData = {
  kpis: [],
  bosteder: [],
  tilbudsportalen: {
    total: 0,
    nyeSidst: 0,
    dækningsgrad: '—',
    sidstOpdateret: '—',
  },
  stpsFordeling: [],
  topKommuner: [],
  salgsFunnel: { trin: [] },
  datakilder: [],
};
