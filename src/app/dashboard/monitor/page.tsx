import { Suspense } from 'react';
import { LiveMonitorPage } from '@/features/monitor/components/LiveMonitorPage/LiveMonitorPage';

export const metadata = { title: 'Live Monitor — KeasCare' };

export default function MonitorPage() {
  return (
    <Suspense>
      <LiveMonitorPage />
    </Suspense>
  );
}
