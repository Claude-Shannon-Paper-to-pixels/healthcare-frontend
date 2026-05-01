import { useState, useRef, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { sendDefermentEmail } from '../utils/sendDefermentEmail';
import './DefermentModal.css';

function DefermentModal({ isOpen, patient, insurance, uploadedFile, onClose, onSubmit, loading }) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [emailStatus, setEmailStatus] = useState('idle'); // 'idle' | 'sending' | 'sent' | 'failed'
  const fileInputRef = useRef(null);

  const isDefermentReplied = insurance?.IGL_status === 'Deferment Replied';

  const uploadedFileUrl = useMemo(
    () => (uploadedFile ? URL.createObjectURL(uploadedFile) : null),
    [uploadedFile]
  );

  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setEmailStatus('idle');
    }
  }, [isOpen]);

  const handleSubmit = (file) => {
    onSubmit(file);
    setEmailStatus('sending');
    sendDefermentEmail(patient, insurance)
      .then(() => setEmailStatus('sent'))
      .catch((err) => {
        console.error('[DefermentEmail] failed:', err);
        setEmailStatus('failed');
      });
  };

  if (!isOpen) return null;

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) setSelectedFile(file);
  };
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setSelectedFile(file);
  };

  return (
    <div className="def-modal-overlay" onClick={onClose}>
      <div className="def-modal-container" onClick={(e) => e.stopPropagation()}>

        <div className="def-modal-header">
          <h2 className="def-modal-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 2v6h6M9 13h6M9 17h6M9 9h1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {isDefermentReplied ? 'Deferment Reply' : 'Deferment Letter'}
          </h2>
          <button type="button" className="def-modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="def-modal-body">

          {/* Patient info strip */}
          <div className="def-patient-info">
            <div className="def-info-grid">
              <div className="def-info-item">
                <span className="def-info-label">👤 Patient Name</span>
                <span className="def-info-value">{patient?.patient_name || 'N/A'}</span>
              </div>
              <div className="def-info-item">
                <span className="def-info-label">🔖 MRN</span>
                <span className="def-info-value">{patient?.mrn || 'N/A'}</span>
              </div>
              <div className="def-info-item">
                <span className="def-info-label">🏢 Insurance</span>
                <span className="def-info-value">{insurance?.tpa_name || 'N/A'}</span>
              </div>
              <div className="def-info-item">
                <span className="def-info-label">📄 Policy No</span>
                <span className="def-info-value">{insurance?.Policy_No || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Part 1 — Deferment letter PDF */}
          <div className="def-section">
            <h3 className="def-section-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 2v6h6M9 13h6M9 17h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Deferment Letter
            </h3>
            <div className="def-pdf-wrapper">
              <iframe
                src="/DEFERMENT.pdf"
                title="Deferment Letter"
                className="def-pdf-frame"
              />
            </div>
          </div>

          {/* Part 2 — Upload reply (only shown when status is Deferment, not Deferment Replied) */}
          {!isDefermentReplied && (
            <div className="def-section">
              <h3 className="def-section-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Attachment
              </h3>
              <div
                className={`def-dropzone${dragOver ? ' dragover' : ''}${selectedFile ? ' has-file' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <button
                  type="button"
                  className="def-select-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Select files...
                </button>
                <span className="def-drop-hint">
                  {selectedFile ? selectedFile.name : 'Drop files here to select'}
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="def-file-input"
                  onChange={handleFileChange}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="def-modal-actions">
            {!isDefermentReplied && (
              <button
                type="button"
                className="def-btn def-btn-submit"
                disabled={!selectedFile || loading}
                onClick={() => handleSubmit(selectedFile)}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {loading ? 'Submitting...' : 'Submit'}
              </button>
            )}
            <button
              type="button"
              className="def-btn def-btn-close"
              onClick={onClose}
              disabled={loading}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Close
            </button>
          </div>
          {emailStatus !== 'idle' && (
            <div className={`def-email-status def-email-${emailStatus}`}>
              {emailStatus === 'sending' && (
                <>
                  <span className="def-email-spinner" />
                  Sending email notification…
                </>
              )}
              {emailStatus === 'sent' && (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Email notification sent
                </>
              )}
              {emailStatus === 'failed' && (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Email failed — reply was still saved
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

DefermentModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  patient: PropTypes.object,
  insurance: PropTypes.object,
  uploadedFile: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

export default DefermentModal;
