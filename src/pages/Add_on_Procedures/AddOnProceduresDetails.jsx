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

  return (
    <div className="detail-groups">
      {procedures.map((procedure) => {
        const statusStyle = STATUS_COLORS[procedure.status] || {
          background: "#f1f5f9",
          color: "#64748b",
        };
        const isSaving = savingId === procedure.id;
        const isEditing = editingId === procedure.id;

        return (
          <div key={procedure.id} className="detail-group">
            <h4 className="detail-group-title">
              Add-on Procedure
              {resolveProcedureDate(procedure)
                ? ` - ${formatDate(resolveProcedureDate(procedure))}`
                : ""}
            </h4>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Procedure</span>
                <span className="detail-value">
                  {resolveProcedureName(procedure)}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Date</span>
                <span className="detail-value">
                  {formatDate(resolveProcedureDate(procedure))}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Estimated Cost</span>
                <span className="detail-value">
                  {procedure?.estimated_cost ?? "N/A"}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Created By</span>
                <span className="detail-value">
                  {resolveCreatedBy(procedure)}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Status</span>
                <span
                  className="detail-value"
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  {isEditing ? (
                    <select
                      autoFocus
                      defaultValue={procedure.status}
                      onChange={(e) =>
                        handleStatusChange(procedure, e.target.value)
                      }
                      onBlur={() => setEditingId(null)}
                      style={{
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        borderRadius: 6,
                        border: "1px solid #cbd5e0",
                        padding: "2px 6px",
                        cursor: "pointer",
                        color: statusStyle.color,
                        background: statusStyle.background,
                      }}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span
                      style={{
                        display: "inline-block",
                        padding: "2px 10px",
                        borderRadius: "999px",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        ...statusStyle,
                        opacity: isSaving ? 0.5 : 1,
                      }}
                    >
                      {isSaving ? "Saving…" : procedure.status || "N/A"}
                    </span>
                  )}

                  {canManageClinical && !isEditing && !isSaving && (
                    <button
                      type="button"
                      title="Edit status"
                      onClick={() => setEditingId(procedure.id)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 2,
                        color: "#94a3b8",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  )}
                </span>
              </div>

              {procedure.indication_for_additional_procedures && (
                <div className="detail-item" style={{ gridColumn: "1 / -1" }}>
                  <span className="detail-label">
                    Indication for Additional Procedures
                  </span>
                  <span className="detail-value">
                    {procedure.indication_for_additional_procedures}
                  </span>
                </div>
              )}
              {procedure.authorizer_remarks && (
                <div className="detail-item" style={{ gridColumn: "1 / -1" }}>
                  <span className="detail-label">Authorizer Remarks</span>
                  <span className="detail-value">
                    {procedure.authorizer_remarks}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default AddOnProceduresDetails;
