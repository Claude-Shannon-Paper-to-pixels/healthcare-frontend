import { useState } from 'react';
import { sendTelegramNotification } from "../../utils/telegram";

const STATUS_COLORS = {
  Approved:   { background: '#dcfce7', color: '#15803d' },
  Declined:   { background: '#fee2e2', color: '#dc2626' },
  Canceled:   { background: '#f1f5f9', color: '#64748b' },
  Processing: { background: '#dbeafe', color: '#1d4ed8' }
};

const STATUS_OPTIONS = ['Processing', 'Approved', 'Declined', 'Canceled'];

function AddOnProceduresDetails({
  procedures = [],
  loading = false,
  error = "",
  canManageClinical = false,
  canChangeStatus = false,
  onStatusChange,
  patient = null,
}) {
  const [editingId, setEditingId] = useState(null);
  const [savingId, setSavingId] = useState(null);

  const formatDate = (value) => {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString();
  };

  const resolveCreatedBy = (procedure) => {
    const user = procedure?.user_created;
    if (!user || typeof user !== "object") return "N/A";
    return `${user.first_name || ""} ${user.last_name || ""}`.trim() || "N/A";
  };

  const resolveProcedureName = (procedure) =>
    procedure?.procedure_description ||
    procedure?.procedure_name ||
    procedure?.name ||
    procedure?.title ||
    procedure?.procedure ||
    "N/A";

  const resolveProcedureDate = (procedure) =>
    procedure?.plan_date ||
    procedure?.procedure_date ||
    procedure?.date ||
    procedure?.created_at;

  const handleStatusChange = async (procedure, newStatus) => {
    if (newStatus === procedure.status) {
      setEditingId(null);
      return;
    }
    setSavingId(procedure.id);
    setEditingId(null);
    try {
      await onStatusChange(procedure.id, newStatus);
      await sendTelegramNotification(
        `🏥 *Add-on Procedure Status Updated*\n` +
          `👤 Patient: ${patient?.patient_name || "N/A"}\n` +
          `🪪 MRN: ${patient?.mrn || "N/A"}\n` +
          `💊 Procedure: ${resolveProcedureName(procedure)}\n` +
          `📋 New Status: ${newStatus}\n` +
          `🕐 Time: ${new Date().toLocaleString("en-GB")}`,
      );
    } finally {
      setSavingId(null);
    }
  };

  if (loading)
    return <div className="loading">Loading add-on procedures...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!procedures.length)
    return <div className="empty-state">No add-on procedures available.</div>;

  const s = {
    card: {
      background: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: 12,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      marginBottom: 20,
      overflow: 'hidden',
    },
    header: {
      background: '#f8fafc',
      borderBottom: '1px solid #e2e8f0',
      padding: '12px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    },
    headerDot: {
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: '#6366f1',
      flexShrink: 0,
    },
    headerTitle: {
      fontSize: '0.92rem',
      fontWeight: 700,
      color: '#1e293b',
      letterSpacing: '0.01em',
    },
    mainGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
    },
    leftCol: {
      padding: '20px',
      borderRight: '1px solid #e2e8f0',
    },
    rightCol: {
      padding: '0',
      display: 'flex',
      flexDirection: 'column',
    },
    label: {
      display: 'block',
      fontSize: '0.68rem',
      fontWeight: 700,
      color: '#94a3b8',
      textTransform: 'uppercase',
      letterSpacing: '0.07em',
      marginBottom: 6,
    },
    procedureText: {
      fontSize: '0.9rem',
      color: '#334155',
      lineHeight: 1.65,
      margin: 0,
    },
    rightItem: {
      padding: '14px 20px',
      borderBottom: '1px solid #f1f5f9',
    },
    rightItemLast: {
      padding: '14px 20px',
    },
    rightSubGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
    },
    rightSubItem: {
      padding: '14px 20px',
      borderBottom: '1px solid #f1f5f9',
    },
    rightSubItemRight: {
      padding: '14px 20px',
      borderBottom: '1px solid #f1f5f9',
      borderLeft: '1px solid #f1f5f9',
    },
    value: {
      fontSize: '0.88rem',
      color: '#1e293b',
      fontWeight: 500,
    },
    bottomRow: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      borderTop: '1px solid #e2e8f0',
      background: '#fafbfc',
    },
    bottomItem: {
      padding: '16px 20px',
    },
    bottomItemRight: {
      padding: '16px 20px',
      borderLeft: '1px solid #e2e8f0',
    },
  };

  return (
    <div style={{ marginTop: 8 }}>
      {procedures.map((procedure) => {
        const statusStyle = STATUS_COLORS[procedure.status] || { background: '#f1f5f9', color: '#64748b' };
        const isSaving = savingId === procedure.id;
        const isEditing = editingId === procedure.id;
        const hasIndication = !!procedure.indication_for_additional_procedures;
        const hasRemarks = !!procedure.authorizer_remarks;
        const hasBottomRow = hasIndication || hasRemarks;

        return (
          <div key={procedure.id} style={s.card}>

            {/* Header */}
            <div style={s.header}>
              <div style={s.headerDot} />
              <span style={s.headerTitle}>
                Add-on Procedure
                {resolveProcedureDate(procedure)
                  ? ` — ${formatDate(resolveProcedureDate(procedure))}`
                  : ''}
              </span>
            </div>

            {/* Main 2-column body */}
            <div style={s.mainGrid}>

              {/* Left column: Procedure description */}
              <div style={s.leftCol}>
                <span style={s.label}>Procedure</span>
                <p style={s.procedureText}>{resolveProcedureName(procedure)}</p>
              </div>

              {/* Right column: Status, Date + Cost, Created By */}
              <div style={s.rightCol}>

                {/* Status */}
                <div style={s.rightItem}>
                  <span style={s.label}>Status</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isEditing ? (
                      <select
                        autoFocus
                        defaultValue={procedure.status}
                        onChange={(e) => handleStatusChange(procedure, e.target.value)}
                        onBlur={() => setEditingId(null)}
                        style={{
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          borderRadius: 6,
                          border: '1px solid #cbd5e0',
                          padding: '3px 8px',
                          cursor: 'pointer',
                          color: statusStyle.color,
                          background: statusStyle.background,
                          outline: 'none',
                        }}
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 12px',
                        borderRadius: 999,
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        ...statusStyle,
                        opacity: isSaving ? 0.5 : 1,
                      }}>
                        {isSaving ? 'Saving…' : (procedure.status || 'N/A')}
                      </span>
                    )}

                    {canChangeStatus && !isEditing && !isSaving && (
                      <button
                        type="button"
                        title="Edit status"
                        onClick={() => setEditingId(procedure.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 2,
                          color: '#94a3b8',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Date + Estimated Cost side by side */}
                <div style={s.rightSubGrid}>
                  <div style={s.rightSubItem}>
                    <span style={s.label}>Date</span>
                    <span style={s.value}>{formatDate(resolveProcedureDate(procedure))}</span>
                  </div>
                  <div style={s.rightSubItemRight}>
                    <span style={s.label}>Estimated Cost</span>
                    <span style={s.value}>{procedure?.estimated_cost ?? 'N/A'}</span>
                  </div>
                </div>

                {/* Created By */}
                <div style={s.rightItemLast}>
                  <span style={s.label}>Created By</span>
                  <span style={s.value}>{resolveCreatedBy(procedure)}</span>
                </div>

              </div>
            </div>

            {/* Bottom row: Indication + Authorizer Remarks */}
            {hasBottomRow && (
              <div style={s.bottomRow}>
                <div style={s.bottomItem}>
                  <span style={s.label}>Indication for Additional Procedures</span>
                  <span style={{ ...s.value, fontWeight: 400, color: '#475569', fontSize: '0.88rem', lineHeight: 1.6 }}>
                    {procedure.indication_for_additional_procedures || '—'}
                  </span>
                </div>
                <div style={s.bottomItemRight}>
                  <span style={s.label}>Authorizer Remarks</span>
                  <span style={{ ...s.value, fontWeight: 400, color: '#475569', fontSize: '0.88rem', lineHeight: 1.6 }}>
                    {procedure.authorizer_remarks || '—'}
                  </span>
                </div>
              </div>
            )}

          </div>
        );
      })}
    </div>
  );
}

export default AddOnProceduresDetails;
