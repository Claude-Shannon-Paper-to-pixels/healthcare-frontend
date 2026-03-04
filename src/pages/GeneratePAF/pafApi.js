// src/pages/GeneratePAF/pafApi.js

const PAF_API_URL = 'http://192.168.8.104:8000/api/generate-pdf';
// const PAF_API_URL = 'http://100.64.177.106:5678/webhook/directus-data';
const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL || 'http://100.64.177.106:8055';

/**
 * Get the access token from localStorage
 * @returns {string|null} Access token
 */
function getAccessToken() {
  return localStorage.getItem('directus_token');
}

/**
 * Build PAF payload from patient data
 * @param {Object} patient - Patient object with all related data
 * @param {Object} admission - Admission record
 * @param {Object} insurance - Insurance record
 * @returns {Object} PAF payload
 */
export function buildPafPayload(patient, admission, insurance) {
  // Get doctor name from admission's user_created (the doctor who created the admission)
  const doctorFirstName = admission?.user_created?.first_name || '';
  const doctorLastName = admission?.user_created?.last_name || '';
  const doctorFullName = `${doctorFirstName} ${doctorLastName}`.trim() || 'N/A';

  return {
    patient: patient?.id || null,
    patient_name: patient?.patient_name || '',
    mrn: patient?.mrn || '',
    date_of_birth: patient?.date_of_birth || '',
    email: patient?.email || '',
    contact_number: patient?.contact_number || '',
    gender: patient?.gender || '',
    NRIC: patient?.NRIC || '',
    admission: admission?.id || null,
    insurance: insurance?.id || null,
    tpa_name: insurance?.tpa_name || '',
    doctor_full_name: doctorFullName
  };
}

/**
 * Generate PAF by sending data to the API
 * @param {Object} patient - Patient object
 * @param {Object} admission - Admission record
 * @param {Object} insurance - Insurance record
 * @returns {Promise<Object>} API response
 */
export async function generatePAF(patient, admission, insurance) {
  const payload = buildPafPayload(patient, admission, insurance);

  console.log('Generating PAF with payload:', payload);

  try {
    const response = await fetch(PAF_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // Try to parse JSON, but handle non-JSON responses
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { message: text || 'PAF request sent successfully', status: response.status };
    }

    if (!response.ok) {
      throw new Error(`Failed to generate PAF: ${response.status}`);
    }

    return data;
  } catch (error) {
    // If CORS error, try with no-cors mode (fire and forget)
    if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
      console.log('CORS issue detected, sending with no-cors mode...');
      
      await fetch(PAF_API_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify(payload),
      });
      
      return { message: 'PAF request sent (no-cors mode)', success: true };
    }
    throw error;
  }
}

/**
 * Fetch the insurance record from Directus to check for pdf_url
 * @param {string|number} insuranceId - The insurance record ID
 * @returns {Promise<string|null>} The pdf_url value or null
 */
export async function fetchInsurancePdfUrl(insuranceId) {
  const token = getAccessToken();

  const response = await fetch(`${DIRECTUS_URL}/items/insurance/${insuranceId}?fields=pdf_url`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch insurance record');
  }

  const data = await response.json();
  return data?.data?.pdf_url || null;
}

/**
 * Poll the insurance record until pdf_url appears or timeout
 * @param {string|number} insuranceId - The insurance record ID
 * @param {Object} options - Polling options
 * @param {number} options.interval - Polling interval in ms (default: 3000)
 * @param {number} options.timeout - Max wait time in ms (default: 90000)
 * @param {function} options.onProgress - Called each poll attempt with { attempt, elapsed }
 * @returns {Promise<string>} The pdf_url
 */
export async function pollForPdfUrl(insuranceId, { interval = 3000, timeout = 90000, onProgress } = {}) {
  const startTime = Date.now();
  let attempt = 0;

  while (Date.now() - startTime < timeout) {
    attempt++;
    if (onProgress) {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      onProgress({ attempt, elapsed });
    }

    try {
      const pdfUrl = await fetchInsurancePdfUrl(insuranceId);
      if (pdfUrl) {
        return pdfUrl;
      }
    } catch (err) {
      console.warn(`Poll attempt ${attempt} failed:`, err.message);
    }

    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error('PDF generation timed out. Please try again or check Directus.');
}

/**
 * Download a PDF from a URL
 * @param {string} pdfUrl - The PDF URL to download
 * @param {string} filename - Optional filename
 */
export function downloadPdf(pdfUrl, filename) {
  const link = document.createElement('a');
  link.href = pdfUrl;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  if (filename) {
    link.download = filename;
  }
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Clear the pdf_url field on the insurance record before generating
 * so we can detect when the new one appears
 * @param {string|number} insuranceId
 */
export async function clearInsurancePdfUrl(insuranceId) {
  const token = getAccessToken();

  const response = await fetch(`${DIRECTUS_URL}/items/insurance/${insuranceId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ pdf_url: null }),
  });

  if (!response.ok) {
    console.warn('Could not clear pdf_url before generation');
  }
}

/**
 * Validate that required data is present for PAF generation
 * @param {Object} patient - Patient object
 * @param {Object} admission - Admission record
 * @param {Object} insurance - Insurance record
 * @returns {Object} { isValid: boolean, missingFields: string[] }
 */
export function validatePafData(patient, admission, insurance) {
  const missingFields = [];

  if (!patient?.id) missingFields.push('Patient ID');
  if (!patient?.patient_name) missingFields.push('Patient Name');
  if (!patient?.mrn) missingFields.push('MRN');
  if (!admission?.id) missingFields.push('Admission Record');
  if (!insurance?.id) missingFields.push('Insurance Record');

  return {
    isValid: missingFields.length === 0,
    missingFields
  };
}
