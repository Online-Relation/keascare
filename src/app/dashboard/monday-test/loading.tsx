export default function Loading() {
  return (
    <div className="dashboard-content">
      <div className="mon-header">
        <div>
          <div style={{ height: '1.5rem', width: '16rem', background: 'var(--color-border)', borderRadius: 6, marginBottom: '0.5rem' }} />
          <div style={{ height: '0.875rem', width: '10rem', background: 'var(--color-border-light)', borderRadius: 4 }} />
        </div>
      </div>
      <div className="mon-kpi-grid" style={{ marginTop: '1.5rem' }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="mon-kpi" style={{ minHeight: '5rem', background: 'var(--color-border-light)', borderRadius: 8 }} />
        ))}
      </div>
      <p style={{ marginTop: '2rem', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', textAlign: 'center' }}>
        Henter data fra Monday…
      </p>
    </div>
  );
}
