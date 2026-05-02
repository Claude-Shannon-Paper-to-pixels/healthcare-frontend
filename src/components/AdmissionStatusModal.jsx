import { useEffect, useState } from 'react';
import '../pages/bedcollection/assignBedModal.css';

const DEFAULT_STATUSES = [
  'Admission pending',
  'Admitted',
  'Today discharge',
  'Tomorrow discharge',
  'Discharged'
];

function AdmissionStatusModal({
  isOpen,
  patient,
  admission,
  onClose,
  onSave,
  loading,
  error,
  statusOptions = DEFAULT_STATUSES
}) {
  const [selectedStatus, setSelectedStatus] = useState('Admission Pending');

  useEffect(() => {
    if (!isOpen) return;
    setSelectedStatus(admission?.status || 'Admission Pending');
  }, [isOpen, admission?.status]);

  if (!isOpen) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!admission?.id) return;
    onSave(selectedStatus);
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <h3>Update Admission Status</h3>
            <p>
              {patient?.patient_name ? `${patient.patient_name} — ` : ''}
              {patient?.mrn ? `MRN ${patient.mrn}` : 'Patient'}
            </p>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {!admission?.id ? (
          <div className="empty-state">No admission record available for this patient.</div>
        ) : (
          <form onSubmit={handleSubmit} className="status-modal">
            <label className="status-label">Select status</label>
            <select
              className="status-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              disabled={loading}
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            {error && <div className="error-message">{error}</div>}

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default AdmissionStatusModal;
