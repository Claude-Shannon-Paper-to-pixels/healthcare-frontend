// src/api/addOnProcedures.js
import directus from './directus';
import { readItems, readItem, createItem, updateItem, deleteItem } from '@directus/sdk';
import { getUser } from '../utils/auth';

const canManageAddOnProcedures = () => {
  const roleName = getUser()?.role?.name;
  return roleName === 'Administrator' || roleName === 'Doctor';
};

const canViewAddOnProcedures = () => {
  const roleName = getUser()?.role?.name;
  return (
    roleName === 'Administrator' ||
    roleName === 'Doctor' ||
    roleName === 'Hospital_staff' ||
    roleName === 'Hospital Staff'
  );
};

export async function getAddOnProcedures(filters = {}) {
  if (!canViewAddOnProcedures()) {
    throw new Error('You do not have permission to view add-on procedures');
  }

  try {
    const procedures = await directus.request(
      readItems('Add_on_Procedures', {
        fields: [
          '*',
          'Procedures_patient.id',
          'Procedures_patient.patient_name',
          'Procedures_patient.mrn',
          'user_created.id',
          'user_created.first_name',
          'user_created.last_name',
          'indication_for_additional_procedures',
          'authorizer_remarks',
          'status'
        ],
        filter: filters,
        sort: ['-date_created'],
        limit: -1
      })
    );

    return procedures;
  } catch (error) {
    console.error('Get add-on procedures error:', error);
    throw new Error('Failed to fetch add-on procedures');
  }
}

export async function getAddOnProcedure(id) {
  if (!canViewAddOnProcedures()) {
    throw new Error('You do not have permission to view add-on procedures');
  }

  try {
    const procedure = await directus.request(
      readItem('Add_on_Procedures', id, {
        fields: [
          '*',
          'Procedures_patient.id',
          'Procedures_patient.patient_name',
          'Procedures_patient.mrn',
          'user_created.id',
          'user_created.first_name',
          'user_created.last_name',
          'indication_for_additional_procedures',
          'authorizer_remarks',
          'status'
        ]
      })
    );

    return procedure;
  } catch (error) {
    console.error('Get add-on procedure error:', error);
    throw new Error('Failed to fetch add-on procedure');
  }
}

export async function getAddOnProceduresByPatient(patientId) {
  if (!canViewAddOnProcedures()) {
    throw new Error('You do not have permission to view add-on procedures');
  }

  try {
    const procedures = await directus.request(
      readItems('Add_on_Procedures', {
        fields: [
          '*',
          'Procedures_patient.id',
          'Procedures_patient.patient_name',
          'Procedures_patient.mrn',
          'user_created.id',
          'user_created.first_name',
          'user_created.last_name',
          'indication_for_additional_procedures',
          'authorizer_remarks',
          'status'
        ],
        filter: {
          Procedures_patient: {
            _eq: patientId
          }
        },
        sort: ['-date_created'],
        limit: -1
      })
    );

    return procedures;
  } catch (error) {
    console.error('Get add-on procedures by patient error:', error);
    throw new Error('Failed to fetch add-on procedures for patient');
  }
}

export async function createAddOnProcedure(procedureData) {
  if (!canManageAddOnProcedures()) {
    throw new Error('You do not have permission to create add-on procedures');
  }

  try {
    const procedure = await directus.request(
      createItem('Add_on_Procedures', procedureData)
    );

    return procedure;
  } catch (error) {
    console.error('Create add-on procedure error:', error);

    if (error.response?.status === 403) {
      throw new Error('You do not have permission to create add-on procedures');
    }

    throw new Error(error.errors?.[0]?.message || 'Failed to create add-on procedure');
  }
}

export async function updateAddOnProcedure(id, procedureData) {
  if (!canManageAddOnProcedures()) {
    throw new Error('You do not have permission to update add-on procedures');
  }

  try {
    const procedure = await directus.request(
      updateItem('Add_on_Procedures', id, procedureData)
    );

    return procedure;
  } catch (error) {
    console.error('Update add-on procedure error:', error);

    if (error.response?.status === 403) {
      throw new Error('You do not have permission to update add-on procedures');
    }

    throw new Error('Failed to update add-on procedure');
  }
}

export async function deleteAddOnProcedure(id) {
  if (!canManageAddOnProcedures()) {
    throw new Error('You do not have permission to delete add-on procedures');
  }

  try {
    await directus.request(deleteItem('Add_on_Procedures', id));
    return true;
  } catch (error) {
    console.error('Delete add-on procedure error:', error);

    if (error.response?.status === 403) {
      throw new Error('You do not have permission to delete add-on procedures');
    }

    throw new Error('Failed to delete add-on procedure');
  }
}
