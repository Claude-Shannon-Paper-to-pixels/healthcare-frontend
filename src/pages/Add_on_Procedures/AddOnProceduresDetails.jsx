const STATUS_COLORS = {
  Approved: { background: '#dcfce7', color: '#15803d' },
  Declined: { background: '#fee2e2', color: '#dc2626' },
  Canceled: { background: '#f1f5f9', color: '#64748b' },
  Processing: { background: '#dbeafe', color: '#1d4ed8' }
};

function AddOnProceduresDetails({ procedures = [], loading = false, error = '' }) {
  const formatDate = (value) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString();
  };

  const resolveCreatedBy = (procedure) => {
    const user = procedure?.user_created;
    if (!user || typeof user !== 'object') return 'N/A';
    return `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'N/A';
  };

  const resolveProcedureName = (procedure) =>
    procedure?.procedure_description ||
    procedure?.procedure_name ||
    procedure?.name ||
    procedure?.title ||
    procedure?.procedure ||
    'N/A';

  const resolveProcedureNotes = (procedure) =>
    procedure?.estimated_cost ||
    procedure?.procedure_notes ||
    procedure?.notes ||
    procedure?.description ||
    procedure?.details ||
    'N/A';

  const resolveProcedureDate = (procedure) =>
    procedure?.plan_date || procedure?.procedure_date || procedure?.date || procedure?.created_at;

  if (loading) {
    return <div className="loading">Loading add-on procedures...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!procedures.length) {
    return <div className="empty-state">No add-on procedures available.</div>;
  }

  return (
    <div className="detail-groups">
      {procedures.map((procedure) => (
        <div key={procedure.id} className="detail-group">
          <h4 className="detail-group-title">
            Add-on Procedure{resolveProcedureDate(procedure) ? ` - ${formatDate(resolveProcedureDate(procedure))}` : ''}
          </h4>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">Procedure</span>
              <span className="detail-value">{resolveProcedureName(procedure)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Date</span>
              <span className="detail-value">{formatDate(resolveProcedureDate(procedure))}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Estimated Cost</span>
              <span className="detail-value">{resolveProcedureNotes(procedure)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Created By</span>
              <span className="detail-value">{resolveCreatedBy(procedure)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Status</span>
              <span
                className="detail-value"
                style={{
                  display: 'inline-block',
                  padding: '2px 10px',
                  borderRadius: '999px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  ...(STATUS_COLORS[procedure.status] || { background: '#f1f5f9', color: '#64748b' })
                }}
              >
                {procedure.status || 'N/A'}
              </span>
            </div>
            {procedure.indication_for_additional_procedures && (
              <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                <span className="detail-label">Indication for Additional Procedures</span>
                <span className="detail-value">{procedure.indication_for_additional_procedures}</span>
              </div>
            )}
            {procedure.authorizer_remarks && (
              <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                <span className="detail-label">Authorizer Remarks</span>
                <span className="detail-value">{procedure.authorizer_remarks}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default AddOnProceduresDetails;
