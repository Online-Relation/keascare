// src/features/dashboard/components/BostedDetailPage/sections/BostedHandlinger/BostedHandlinger.tsx

import { PlusCircle, CheckCircle } from 'lucide-react';

export function BostedHandlinger() {
  return (
    <div className="bosted-detail-handlinger">
      <span className="bosted-detail-handlinger-label">Handlinger</span>

      <button
        className="btn btn-primary btn-sm"
        disabled
        title="Monday-integration er ikke koblet endnu"
      >
        <PlusCircle size={14} />
        Opret lead i Monday
      </button>

      <button className="btn btn-outline btn-sm" disabled title="Kommer i næste version">
        <CheckCircle size={14} />
        Marker som behandlet
      </button>
    </div>
  );
}
