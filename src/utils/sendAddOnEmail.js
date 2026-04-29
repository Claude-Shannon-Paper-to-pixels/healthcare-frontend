import emailjs from '@emailjs/browser';

const SERVICE_ID  = 'service_tfro8yd';
const TEMPLATE_ID = 'template_REPLACE_ME';
const PUBLIC_KEY  = '_Otw8N2Z4ejOX05uN';

export function sendAddOnEmail(patient, insurance, procedureData) {
  const submittedAt = new Date().toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return emailjs.send(
    SERVICE_ID,
    TEMPLATE_ID,
    {
      patient_name:          patient?.patient_name                          || 'N/A',
      mrn:                   patient?.mrn                                   || 'N/A',
      tpa_name:              insurance?.tpa_name                            || 'N/A',
      igl_number:            insurance?.IGL_number                          || 'N/A',
      procedure_description: procedureData?.procedure_description           || 'N/A',
      estimated_cost:        procedureData?.estimated_cost                  ?? 'N/A',
      plan_date:             procedureData?.plan_date                       || 'N/A',
      indication:            procedureData?.indication_for_additional_procedures || 'N/A',
      submitted_at:          submittedAt,
    },
    PUBLIC_KEY,
  );
}
