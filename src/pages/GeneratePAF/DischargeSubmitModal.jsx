import { useEffect, useState } from 'react';
import { generateDischargePDF } from './dischargeApi';
import './GeneratePAF.css';
import './DischargeSubmitModal.css';

export default function DischargeSubmitModal({ patient, admission, insurance, discharge, onClose }) {
  const [phase, setPhase] = useState('loading');
  const [pdfUrl, setPdfUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function submit() {
      try {
        const result = await generateDischargePDF(patient, admission, insurance, discharge.id);
        if (result?.pdf_url) {
          setPdfUrl(result.pdf_url);
          setPhase('success');
        } else {
          setError('PDF was generated but no URL was returned. Please try again.');
          setPhase('error');
        }
      } catch (err) {
        setError(err.message || 'Failed to generate discharge PDF. Please try again.');
        setPhase('error');
      }
    }
    submit();
  }, []);

  function handleView() {
    window.open(pdfUrl, '_blank', 'noopener,noreferrer');
  }

  function handleDownload() {
    // Convert Google Drive view URL to direct download URL if applicable
    const driveMatch = pdfUrl.match(/\/file\/d\/([^/]+)\//);
    if (driveMatch) {
      window.open(
        `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`,
        '_blank',
        'noopener,noreferrer'
      );
    } else {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `Discharge_${patient?.mrn || patient?.patient_name || 'document'}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  const canClose = phase !== 'loading';

  return (
    <div className="paf-modal-overlay" onClick={canClose ? onClose : undefined}>
      <div className="paf-modal dsm-modal" onClick={(e) => e.stopPropagation()}>

        <div className="paf-modal-header">
          <div className="dsm-header-inner">
            <div className="dsm-header-icon">
              {phase === 'loading' && <span className="paf-spinner dsm-header-spinner" />}
              {phase === 'success' && <span className="dsm-header-check">✓</span>}
              {phase === 'error' && <span className="dsm-header-err">!</span>}
            </div>
            <div>
              <h3 className="dsm-title">
                {phase === 'loading' && 'Generating Discharge PDF'}
                {phase === 'success' && 'Discharge PDF Ready'}
                {phase === 'error' && 'Submission Failed'}
              </h3>
              <p className="dsm-subtitle">
                {phase === 'loading' && 'Please wait while the document is being prepared…'}
                {phase === 'success' && 'Your discharge document has been generated successfully'}
                {phase === 'error' && 'An error occurred during PDF generation'}
              </p>
            </div>
          </div>
          <button className="paf-modal-close" onClick={onClose} disabled={!canClose}>
            ×
          </button>
        </div>

        <div className="paf-modal-body dsm-body">

          {phase === 'loading' && (
            <div className="dsm-loading-state">
              <div className="dsm-spinner-ring">
                <span className="paf-spinner dsm-spinner-lg" />
              </div>
              <p className="dsm-loading-label">Processing request…</p>
              <div className="dsm-patient-pill">
                <span className="dsm-patient-pill-dot" />
                {patient?.patient_name || '—'}
                {patient?.mrn && <span className="dsm-pill-mrn">· MRN {patient.mrn}</span>}
              </div>
            </div>
          )}

          {phase === 'success' && (
            <div className="dsm-success-state">
              <div className="dsm-patient-card">
                <div className="dsm-pc-row">
                  <span className="dsm-pc-label">Patient</span>
                  <span className="dsm-pc-value">{patient?.patient_name || '—'}</span>
                </div>
                <div className="dsm-pc-row">
                  <span className="dsm-pc-label">MRN</span>
                  <span className="dsm-pc-value">{patient?.mrn || '—'}</span>
                </div>
                <div className="dsm-pc-row">
                  <span className="dsm-pc-label">Discharge ID</span>
                  <span className="dsm-pc-value">{discharge?.id || '—'}</span>
                </div>
              </div>

              <div className="dsm-pdf-banner">
                <div className="dsm-pdf-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                  </svg>
                </div>
                <div className="dsm-pdf-info">
                  <span className="dsm-pdf-label">Discharge PDF</span>
                  <span className="dsm-pdf-ready">Ready to open</span>
                </div>
              </div>

              <div className="dsm-action-row">
                <button className="dsm-btn-view" onClick={handleView}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  View PDF
                </button>
                <button className="dsm-btn-download" onClick={handleDownload}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Download PDF
                </button>
              </div>
            </div>
          )}

          {phase === 'error' && (
            <div className="dsm-error-state">
              <div className="dsm-error-icon">✕</div>
              <p className="dsm-error-msg">{error}</p>
            </div>
          )}

        </div>

        <div className="paf-modal-footer">
          <button className="paf-btn paf-btn-cancel" onClick={onClose} disabled={!canClose}>
            {phase === 'success' ? 'Done' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
}
