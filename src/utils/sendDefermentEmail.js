import emailjs from '@emailjs/browser';

const SERVICE_ID  = 'service_tfro8yd';
const TEMPLATE_ID = 'template_lhv4haj';
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
      pdf_link:     'https://drive.google.com/file/d/1uLUQswI7ggdq_d2F7aUoZaQ-sdQN6nqy/view',
    },
    PUBLIC_KEY,
  );
}
