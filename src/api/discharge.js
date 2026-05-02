import directus from './directus';
import { readItems, createItem, updateItem } from '@directus/sdk';

export async function getDischargeByPatient(patientId) {
  const results = await directus.request(
    readItems('Discharge', {
      filter: { patient_id: { _eq: patientId } },
      limit: 1,
      sort: ['-date_created']
    })
  );
  return results[0] || null;
}

export async function createDischargeRecord(data) {
  return directus.request(createItem('Discharge', data));
}

export async function updateDischargeRecord(id, data) {
  return directus.request(updateItem('Discharge', id, data));
}
