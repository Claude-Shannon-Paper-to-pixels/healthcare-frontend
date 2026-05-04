// src/pages/GeneratePAF/dischargeApi.js

import { buildPafPayload } from './pafApi';

const DISCHARGE_PDF_URL = 'http://100.64.177.106:8000/api/generate-pdf-discharge';

/**
 * Submit discharge PDF by sending PAF payload + discharge ID to the API
 * @param {Object} patient - Patient object
 * @param {Object} admission - Admission record
 * @param {Object} insurance - Insurance record
 * @param {string|number} dischargeId - Discharge record ID
 * @returns {Promise<Object>} API response
 */
export async function generateDischargePDF(patient, admission, insurance, dischargeId) {
  const payload = {
    ...buildPafPayload(patient, admission, insurance),
    discharge: dischargeId,
  };

  console.log('Submitting discharge PDF with payload:', payload);

  try {
    const response = await fetch(DISCHARGE_PDF_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { message: text || 'Discharge submitted successfully', status: response.status };
    }

    if (!response.ok) {
      throw new Error(`Failed to submit discharge: ${response.status}`);
    }

    return data;
  } catch (error) {
    if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
      console.log('CORS issue detected, sending with no-cors mode...');

      await fetch(DISCHARGE_PDF_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify(payload),
      });

      return { message: 'Discharge submitted (no-cors mode)', success: true };
    }
    throw error;
  }
}
