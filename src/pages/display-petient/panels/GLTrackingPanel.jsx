import DetailSection from '../DetailSection';

const IGL_FILES = {
  Approved:  { path: '/approved.pdf',  name: 'approved.pdf' },
  Declined:  { path: '/declined.pdf',  name: 'declined.pdf' },
  Deferment: { path: '/DEFERMENT.pdf', name: 'DEFERMENT.pdf' },
};

function FileCell({ entry }) {
  if (entry.gl_category !== 'IGL') return <span style={{ color: '#9ca3af' }}>—</span>;
  const file = IGL_FILES[entry.status];
  if (!file) return <span style={{ color: '#9ca3af' }}>—</span>;
  return (
    <a
      href={file.path}
      target="_blank"
      rel="noreferrer"
      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#2563eb', textDecoration: 'none', fontSize: 13 }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
      {file.name}
    </a>
  );
}

const STATUS_COLORS = {
  Pending:           { bg: '#fef9c3', color: '#854d0e' },
  Approved:          { bg: '#dcfce7', color: '#166534' },
  Deferment:         { bg: '#ffedd5', color: '#9a3412' },
  Deferment_replied: { bg: '#dbeafe', color: '#1e40af' },
  Declined:          { bg: '#fee2e2', color: '#991b1b' },
  Processing:        { bg: '#ede9fe', color: '#5b21b6' },
  Canceled:          { bg: '#f3f4f6', color: '#374151' },
};

function StatusBadge({ value }) {
  if (!value) return <span style={{ color: '#9ca3af' }}>—</span>;
  const style = STATUS_COLORS[value] || { bg: '#f3f4f6', color: '#374151' };
  const label = value.replace(/_/g, ' ');
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 12,
      fontSize: 13,
      fontWeight: 600,
      background: style.bg,
      color: style.color
    }}>
      {label}
    </span>
  );
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-MY', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  });
}

function formatAmount(value) {
  if (value === null || value === undefined || value === '') return '—';
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('en-MY', {
    style: 'currency', currency: 'MYR', minimumFractionDigits: 2
  }).format(n);
}

const TH_STYLE = {
  padding: '10px 14px',
  textAlign: 'left',
  fontWeight: 600,
  fontSize: 13,
  color: '#6b7280',
  borderBottom: '2px solid #e5e7eb',
  whiteSpace: 'nowrap'
};

const TD_STYLE = {
  padding: '10px 14px',
  fontSize: 14,
  color: '#111827',
  borderBottom: '1px solid #f3f4f6',
  verticalAlign: 'middle'
};

function GLTrackingPanel({ entries, loading, error }) {
  return (
    <DetailSection title="GL Tracking" subtitle="Status history for insurance, add-on procedures and top-ups" isEditing={false} onEdit={() => {}} showEdit={false}>
      {loading && (
        <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>Loading...</div>
      )}
      {error && (
        <div style={{ padding: '12px', color: '#dc2626', background: '#fee2e2', borderRadius: 8 }}>{error}</div>
      )}
      {!loading && !error && (
        <div style={{ overflowX: 'auto', marginTop: 8 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 10, overflow: 'hidden' }}>
            <thead style={{ background: '#f9fafb' }}>
              <tr>
                <th style={TH_STYLE}>Date &amp; Time</th>
                <th style={TH_STYLE}>Tracking Number</th>
                <th style={TH_STYLE}>GL Category</th>
                <th style={{ ...TH_STYLE, textAlign: 'right' }}>Amount</th>
                <th style={TH_STYLE}>Status</th>
                <th style={TH_STYLE}>File</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ ...TD_STYLE, textAlign: 'center', color: '#9ca3af', padding: '32px 14px' }}>
                    No GL tracking entries yet.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} style={{ transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    <td style={TD_STYLE}>{formatDateTime(entry.date_created)}</td>
                    <td style={{ ...TD_STYLE, color: '#6b7280' }}>{entry.tracking_number || '—'}</td>
                    <td style={TD_STYLE}>{entry.gl_category || '—'}</td>
                    <td style={{ ...TD_STYLE, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatAmount(entry.amount)}</td>
                    <td style={TD_STYLE}><StatusBadge value={entry.status} /></td>
                    <td style={TD_STYLE}><FileCell entry={entry} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </DetailSection>
  );
}

export default GLTrackingPanel;
