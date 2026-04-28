import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './IglStatusModal.css';

const IGL_STATUS_OPTIONS = [
  'Pending',
  'Approved',
  'Deferment',
  'Deferment Replied',
  'Declined'
];

function IglStatusModal({ isOpen, patient, insurance, onClose, onSave, loading, error }) {
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    if (isOpen && insurance) {
      setSelectedStatus(insurance.IGL_status || '');
    }
  }, [isOpen, insurance]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedStatus.trim()) {
      onSave(selectedStatus.trim());
    }
  };

  const getStatusClass = (status) => {
    if (!status) return '';
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('approve')) return 'approved';
    if (lowerStatus.includes('decline')) return 'rejected';
    if (lowerStatus.includes('pending')) return 'pending';
    if (lowerStatus.includes('partial')) return 'partial';
    if (lowerStatus.includes('deferment')) return 'pending';
    if (lowerStatus.includes('cancel')) return 'rejected';
    return '';
  };

  return (
    <div className="igl-modal-overlay" onClick={onClose}>
      <div className="igl-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="igl-modal-header">
          <h2 className="igl-modal-title">
            <span className="igl-modal-icon">🏥</span>
            Update IGL Status
          </h2>
          <button type="button" className="igl-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="igl-modal-body">
          {patient && insurance && (
            <>
              <div className="igl-patient-info">
                <div className="igl-info-grid">
                  <div className="igl-info-item">
                    <span className="igl-info-label">👤 Patient Name</span>
                    <span className="igl-info-value">{patient.patient_name}</span>
                  </div>
                  <div className="igl-info-item">
                    <span className="igl-info-label">🔖 MRN</span>
                    <span className="igl-info-value">{patient.mrn}</span>
                  </div>
                  <div className="igl-info-item">
                    <span className="igl-info-label">🏢 Insurance Company</span>
                    <span className="igl-info-value">{insurance.tpa_name || 'N/A'}</span>
                  </div>
                  <div className="igl-info-item">
                    <span className="igl-info-label">📄 Policy Number</span>
                    <span className="igl-info-value">{insurance.Policy_No || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="igl-current-status">
                <span className="igl-current-status-label">
                  📊 Current Status
                </span>
                <span className={`igl-status-badge ${getStatusClass(insurance.IGL_status)}`}>
                  {insurance.IGL_status || 'N/A'}
                </span>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit}>
            <div className="igl-form-section">
              <label htmlFor="igl-status" className="igl-form-label">
                Select New IGL Status
              </label>
              <div className="igl-select-wrapper">
                <select
                  id="igl-status"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="igl-select"
                  disabled={loading}
                  required
                >
                  <option value="">-- Choose a status --</option>
                  {IGL_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <span className="igl-select-arrow">▼</span>
              </div>
              <p className="igl-help-text">
                Select the appropriate IGL status for this patient's insurance claim
              </p>
            </div>

            {error && <div className="igl-error-message">{error}</div>}

            <div className="igl-modal-actions">
              <button
                type="button"
                onClick={onClose}
                className="igl-btn igl-btn-cancel"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="igl-btn igl-btn-submit"
                disabled={loading || !selectedStatus.trim()}
              >
                {loading ? '⏳ Updating...' : '✓ Update Status'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

IglStatusModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  patient: PropTypes.object,
  insurance: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string
};

export default IglStatusModal;
