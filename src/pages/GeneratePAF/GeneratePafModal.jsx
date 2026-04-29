// src/pages/GeneratePAF/GeneratePafModal.jsx
import React, { useEffect, useState } from "react";
import { useGeneratePAF } from "./useGeneratePAF";
import { downloadPdf } from "./pafApi";
import emailjs from "@emailjs/browser";
import "./GeneratePAF.css";

export default function GeneratePafModal({
  patient,
  admission,
  insurance,
  onClose,
}) {
  const { loading, error, success, phase, pollInfo, pdfUrl, generate, reset } =
    useGeneratePAF();
  
  const [emailSending, setEmailSending] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [emailError, setEmailError] = useState("");

  // Build preview data
  const previewData = [
    { label: "Patient Name", value: patient?.patient_name || "N/A" },
    { label: "MRN", value: patient?.mrn || "N/A" },
    { label: "NRIC", value: patient?.NRIC || "N/A" },
    { label: "Date of Birth", value: patient?.date_of_birth || "N/A" },
    { label: "Gender", value: patient?.gender || "N/A" },
    { label: "Contact", value: patient?.contact_number || "N/A" },
    { label: "Email", value: patient?.email || "N/A" },
    { label: "Insurance", value: insurance?.tpa_name || "No Insurance" },
    {
      label: "Doctor",
      value:
        admission?.user_created?.first_name &&
        admission?.user_created?.last_name
          ? `${admission.user_created.first_name} ${admission.user_created.last_name}`
          : "N/A",
    },
  ];

  const handleGenerate = async () => {
    await generate(patient, admission, insurance);
  };

  // Add this useEffect inside the component, after the handleGenerate function
  useEffect(() => {
    handleGenerate();
  }, []);

  const handleClose = () => {
    if (loading) return; // Prevent closing while generating
    reset();
    onClose();
  };

  const handleDownloadAgain = () => {
    if (pdfUrl) {
      const filename = `PAF_${patient?.mrn || patient?.patient_name || "document"}.pdf`;
      downloadPdf(pdfUrl, filename);
    }
  };

 const handleSendPAF = async () => {
   setEmailSending(true);
   setEmailError("");
   try {
     await emailjs.send(
       "service_tfro8yd",
       "template_6vzyd6g",
       {
         patient_name: patient?.patient_name || "N/A",
         mrn: patient?.mrn || "N/A",
         pdf_url: pdfUrl,
       },
       "_Otw8N2Z4ejOX05uN",
     );

     // Save timestamp to localStorage using insurance id
     if (insurance?.id) {
       try {
         const saved = localStorage.getItem("iglStatusTimestamps");
         const existing = saved ? new Map(JSON.parse(saved)) : new Map();
         existing.set(insurance.id, new Date().toISOString());
         localStorage.setItem(
           "iglStatusTimestamps",
           JSON.stringify([...existing]),
         );
       } catch {
         // ignore storage errors
       }
     }

     setEmailSuccess(true);
     setTimeout(() => {
       setEmailSuccess(false);
       reset();
       onClose();
     }, 3000);
   } catch (err) {
     setEmailError("Failed to send email. Please try again.");
   } finally {
     setEmailSending(false);
   }
 };

  // Determine button label based on current phase
  const getButtonLabel = () => {
    switch (phase) {
      case "sending":
        return (
          <span className="paf-loading">
            <span className="paf-spinner"></span>
            Sending request...
          </span>
        );
      case "waiting":
        return (
          <span className="paf-loading">
            <span className="paf-spinner"></span>
            Generating PDF...
          </span>
        );
      case "downloading":
        return (
          <span className="paf-loading">
            <span className="paf-spinner"></span>
            Downloading...
          </span>
        );
      default:
        return "Generate PAF";
    }
  };

  return (
    <div className="paf-modal-overlay" onClick={handleClose}>
      <div className="paf-modal" onClick={(e) => e.stopPropagation()}>
        <div className="paf-modal-header">
          <h3>Generate Pre-Authorization Form (PAF)</h3>
          <button
            className="paf-modal-close"
            onClick={handleClose}
            disabled={loading}
          >
            ×
          </button>
        </div>

        <div className="paf-modal-body">
          {error && <div className="paf-error">{error}</div>}

          {success && (
            <div className="paf-success">
              <span className="paf-success-icon">✓</span>
              <div>
                <div>PAF generated successfully!</div>
                {pdfUrl && (
                  <button
                    type="button"
                    className="paf-download-link"
                    onClick={handleDownloadAgain}
                  >
                    ⬇ Download
                  </button>
                )}
              </div>
            </div>
          )}
          
          {emailSuccess && (
            <div className="paf-success">
              <span className="paf-success-icon">✓</span>
              <div>PAF Submitted! </div>
            </div>
          )}
          {emailError && <div className="paf-error">{emailError}</div>}

          {loading && pollInfo && (
            <div className="paf-progress">
              <span className="paf-spinner"></span>
              <span>{pollInfo}</span>
            </div>
          )}

          <div className="paf-preview">
            <div className="paf-preview-title">Data to be submitted</div>
            {previewData.map((item, index) => (
              <div key={index} className="paf-preview-item">
                <span className="paf-preview-label">{item.label}</span>
                <span className="paf-preview-value" title={item.value}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="paf-modal-footer">
          <button
            className="paf-btn paf-btn-cancel"
            onClick={handleClose}
            disabled={loading || emailSending}
          >
            {emailSuccess ? "Close" : "Cancel"}
          </button>
          {success && !emailSuccess && (
            <button
              className="paf-btn paf-btn-generate"
              onClick={handleSendPAF}
              disabled={emailSending}
            >
              {emailSending ? "Sending..." : "Send PAF"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
