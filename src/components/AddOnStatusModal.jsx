import { useNavigate } from 'react-router-dom';
import '../pages/bedcollection/assignBedModal.css';

const STATUS_CLASS_MAP = {
  Approved: 'approved',
  Canceled: 'cancelled',
  Declined: 'rejected',
  Processing: 'under-review'
};

function AddOnStatusModal({ isOpen, patient, procedures = [], onClose }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const formatDate = (value) => {
    if (!value) return 'N/A';
    const d = new Date(value);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleProcedureClick = () => {
    onClose();
    navigate(`/patients/view/${patient.id}`, { state: { initialTab: 'add-ons' } });
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <h3>Add-on Procedures</h3>
            <p>
              {patient?.patient_name || 'Patient'}
              {patient?.mrn ? ` — MRN ${patient.mrn}` : ''}
            </p>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>✕</button>
        </div>

        <p className="modal-count">{procedures.length} procedure{procedures.length !== 1 ? 's' : ''}</p>

        {!procedures.length ? (
          <div className="empty-state">No add-on procedures for this patient.</div>
        ) : (
          <div className="modal-table">
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Procedure Description</th>
                  <th>Plan Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {procedures.map((proc) => (
                  <tr
                    key={proc.id}
                    style={{ cursor: 'pointer' }}
                    onClick={handleProcedureClick}
                    title="Click to open patient Add-on Procedures tab"
                  >
                    <td>{proc.procedure_description || 'N/A'}</td>
                    <td>{formatDate(proc.plan_date)}</td>
                    <td>
                      <span className={`igl-badge ${STATUS_CLASS_MAP[proc.status] || 'pending'}`}>
                        {proc.status || 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Close</button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleProcedureClick}
          >
            View in Patient Record
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddOnStatusModal;
