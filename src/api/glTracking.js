import directus from './directus';
import { createItem, readItems } from '@directus/sdk';

export async function createGLTrackingEntry(data) {
  try {
    await directus.request(createItem('GL_Tracking', data));
  } catch (error) {
    console.error('GL Tracking create error:', error);
  }
}

export async function getGLTrackingByPatient(patientId) {
  try {
    return await directus.request(
      readItems('GL_Tracking', {
        filter: { patient: { _eq: patientId } },
        sort: ['-date_created'],
        limit: -1
      })
    );
  } catch (error) {
    console.error('GL Tracking fetch error:', error);
    throw new Error('Failed to fetch GL tracking entries');
  }
}
