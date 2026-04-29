import emailjs from '@emailjs/browser';

// Reuses the same EmailJS service as PAF submission (service_tfro8yd / _Otw8N2Z4ejOX05uN).
// Recipient email is configured in the EmailJS template on emailjs.com — not in frontend code.
//
// Required EmailJS template variables: patient_name, mrn, tpa_name, igl_number, submitted_at
//
// NOTE (demo): Browser File objects cannot be attached directly — they are local-only and
// have no accessible URL. When a real backend is available, store the file in Directus first,
// then pass the resulting URL as an attachment_url template variable instead.

const SERVICE_ID  = 'service_tfro8yd';
const TEMPLATE_ID = 'template_deferment_reply';
const PUBLIC_KEY  = '_Otw8N2Z4ejOX05uN';

export function sendDefermentEmail(patient, insurance) {
  const submittedAt = new Date().toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return emailjs.send(
    SERVICE_ID,
    TEMPLATE_ID,
    {
      patient_name: patient?.patient_name || 'N/A',
      mrn:          patient?.mrn          || 'N/A',
      tpa_name:     insurance?.tpa_name   || 'N/A',
      igl_number:   insurance?.IGL_number || 'N/A',
      submitted_at: submittedAt,
    },
    PUBLIC_KEY,
  );
}
