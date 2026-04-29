// src/api/patients.js
import directus from './directus';
import { readItems, readItem, createItem, updateItem, deleteItem } from '@directus/sdk';

// Get all patients
export async function getPatients(filters = {}) {
  try {
    const patients = await directus.request(
      readItems('Patient', {
        fields: [
          'id',
          'patient_name',
          'mrn',
          'date_of_birth',
          'NRIC',
          'gender',
          'contact_number',
          'email',
          'date_created',
          
          // Related: Created Doctor (Admitted By)
          'user_created.id',
          'user_created.first_name',
          'user_created.last_name',
          
          // Related: Patient Bed
          'patient_bed.id',
          'patient_bed.bed_no',
          'patient_bed.Status',
          'patient_bed.select_ward.id',
          'patient_bed.select_ward.ward_name',
          'patient_bed.select_ward.ward_code',
          
          
          // Related: Admission (get the latest/active admission)
          'patient_Admission.id',
          'patient_Admission.status',
          'patient_Admission.gl_service',
          'patient_Admission.admission_date',
          'patient_Admission.operation_date',
          'patient_Admission.operation_time',

          // Related: Insurance
          'insurance.id',
          'insurance.tpa_name',
          'insurance.IGL_status',
          'insurance.Policy_No',
          'insurance.IGL_number'
        ],
        filter: filters,
        limit: -1,
        sort: ['-date_created']
      })
    );
    
    return patients;
  } catch (error) {
    console.error('Get patients error:', error);
    throw new Error('Failed to fetch patients');
  }
}

// Get patients by name or MRN (server-filtered)
export async function getPatientsByName(query, limit = 20) {
  if (!query || !String(query).trim()) return [];
  try {
    const q = String(query).trim();
    const patients = await directus.request(
      readItems('Patient', {
        fields: [
          'id',
          'patient_name',
          'mrn',
          'date_of_birth',
          'NRIC',
          'gender',
          'contact_number',
          'email',
          'date_created',
          'user_created.id',
          'user_created.first_name',
          'user_created.last_name',
          'patient_bed.id',
          'patient_bed.bed_no',
          'patient_bed.Status',
          'patient_bed.select_ward.id',
          'patient_bed.select_ward.ward_name',
          'patient_Admission.id',
          'patient_Admission.status',
          'patient_Admission.gl_service',
          'patient_Admission.admission_date',
          'patient_Admission.operation_date',
          'patient_Admission.operation_time',
          'insurance.id',
          'insurance.tpa_name',
          'insurance.IGL_status',
          'insurance.Policy_No',
          'insurance.IGL_number'
        ],
        filter: {
          _or: [
            { patient_name: { _icontains: q } },
            { mrn: { _icontains: q } }
          ]
        },
        limit,
        sort: ['-date_created']
      })
    );

    return patients;
  } catch (error) {
    console.error('Get patients by name error:', error);
    throw new Error('Failed to fetch patients by name');
  }
}

// Get single patient WITH all related data
export async function getPatient(id) {
  try {
    const patient = await directus.request(
      readItem('Patient', id, {
        fields: [
          '*',
          'user_created.id',
          'user_created.first_name',
          'user_created.last_name',
          'patient_bed.*',
          'patient_Admission.*',
          'patient_Admission.user_created.id',
          'patient_Admission.user_created.first_name',
          'patient_Admission.user_created.last_name',
          'insurance.*',
          'Referral_Letter.*',
          'Add_on_Procedures.*'
        ]
      })
    );
    
    return patient;
  } catch (error) {
    console.error('Get patient error:', error);
    throw new Error('Failed to fetch patient details');
  }
}

// Create new patient
export async function createPatient(patientData, admissionData = null) {
  try {
    const payload = {
      patient_name: patientData.patient_name,
      mrn: patientData.mrn,
      date_of_birth: patientData.date_of_birth,
      NRIC: patientData.NRIC,
      gender: patientData.gender,
      contact_number: patientData.contact_number,
      email: patientData.email
    };

    if (patientData.total_fee !== undefined) {
      payload.total_fee = patientData.total_fee;
    }

    if (admissionData) {
      payload.patient_Admission = admissionData;
    }

    const patient = await directus.request(createItem('Patient', payload));
    
    return patient;
  } catch (error) {
    console.error('Create patient error:', error);
    
    if (error.response?.status === 403) {
      throw new Error('You do not have permission to create patients');
    }
    
    throw new Error(error.errors?.[0]?.message || 'Failed to create patient');
  }
}

// Update patient
export async function updatePatient(id, patientData) {
  try {
    const patient = await directus.request(
      updateItem('Patient', id, patientData)
    );
    
    return patient;
  } catch (error) {
    console.error('Update patient error:', error);
    
    if (error.response?.status === 403) {
      throw new Error('You do not have permission to update this patient');
    }
    
    throw new Error('Failed to update patient');
  }
}

// Delete patient
export async function deletePatient(id) {
  try {
    // First, get the patient to check if they have an assigned bed
    const patient = await directus.request(
      readItem('Patient', id, { fields: ['patient_bed'] })
    );

    // If patient has a bed, update bed status to vacant
    if (patient?.patient_bed) {
      const bedId = typeof patient.patient_bed === 'object' 
        ? patient.patient_bed.id 
        : patient.patient_bed;
      
      if (bedId) {
        await directus.request(
          updateItem('Bed', bedId, { 
            Status: 'vacant',
            Patient: null 
          })
        );
        console.log(`Bed ${bedId} status changed to vacant after patient deletion`);
      }
    }

    // Now delete the patient
    await directus.request(deleteItem('Patient', id));
    return true;
  } catch (error) {
    console.error('Delete patient error:', error);
    
    if (error.response?.status === 403) {
      throw new Error('You do not have permission to delete patients');
    }
    
    throw new Error('Failed to delete patient');
  }
}

// Update patient admission details (Doctor/Admin only)
export async function updatePatientAdmission(patientId, admissionData) {
  try {
    // Update the Admission record
    const admission = await directus.request(
      updateItem('Admission', admissionData.id, {
        status: admissionData.status,
        admission_date: admissionData.admission_date,
        operation_date: admissionData.operation_date,
        operation_time: admissionData.operation_time
      })
    );
    
    return admission;
  } catch (error) {
    console.error('Update admission error:', error);
    
    if (error.response?.status === 403) {
      throw new Error('You do not have permission to update admission details');
    }
    
    throw new Error('Failed to update admission details');
  }
}

// Update admission record with full details (Doctor/Admin only)
export async function updateAdmissionRecord(admissionId, admissionData) {
  try {
    const admission = await directus.request(
      updateItem('Admission', admissionId, admissionData)
    );

    return admission;
  } catch (error) {
    console.error('Update admission record error:', error);

    if (error.response?.status === 403) {
      throw new Error('You do not have permission to update admission details');
    }

    throw new Error('Failed to update admission details');
  }
}

// Update bed status (Admin/Staff only)
export async function updateBedStatus(bedId, status) {
  try {
    const bed = await directus.request(
      updateItem('Bed', bedId, { status })
    );
    
    return bed;
  } catch (error) {
    console.error('Update bed status error:', error);
    
    if (error.response?.status === 403) {
      throw new Error('You do not have permission to update bed status');
    }
    
    throw new Error('Failed to update bed status');
  }
}

// Assign bed to patient (Admin/Staff only)
export async function assignBedToPatient(patientId, bedId) {
  try {
    // 1. Get the patient's current bed (if any)
    const currentPatient = await directus.request(
      readItem('Patient', patientId, { fields: ['patient_bed'] })
    );
    
    // 2. If patient has an existing bed, reset it to Vacant
    if (currentPatient?.patient_bed) {
      const oldBedId = typeof currentPatient.patient_bed === 'object' 
        ? currentPatient.patient_bed.id 
        : currentPatient.patient_bed;
      
      // Only reset if it's a different bed
      if (oldBedId && oldBedId !== bedId) {
        await directus.request(
          updateItem('Bed', oldBedId, { Status: 'Vacant' })
        );
        console.log(`Previous bed ${oldBedId} reset to Vacant`);
      }
    }
    
    // 3. Assign new bed to patient
    const patient = await directus.request(
      updateItem('Patient', patientId, { patient_bed: bedId })
    );
    
    // 4. Update new bed status to Booking
    await directus.request(
      updateItem('Bed', bedId, { Status: 'Booking' })
    );
    
    return patient;
  } catch (error) {
    console.error('Assign bed error:', error);
    
    if (error.response?.status === 403) {
      throw new Error('You do not have permission to assign beds');
    }
    
    throw new Error('Failed to assign bed to patient');
  }
}

// Update patient insurance details (Doctor/Admin only)
export async function updatePatientInsurance(insuranceId, insuranceData) {
  try {
    const insurance = await directus.request(
      updateItem('insurance', insuranceId, insuranceData)
    );
    
    return insurance;
  } catch (error) {
    console.error('Update insurance error:', error);
    
    if (error.response?.status === 403) {
      throw new Error('You do not have permission to update insurance details');
    }
    
    throw new Error('Failed to update insurance details');
  }
}

// Create referral letter (Doctor/Admin only)
export async function createReferralLetter(patientId, letterData) {
  try {
    const letter = await directus.request(
      createItem('Referral_Letter', {
        patient_id: patientId,
        ...letterData
      })
    );
    
    return letter;
  } catch (error) {
    console.error('Create referral letter error:', error);
    
    if (error.response?.status === 403) {
      throw new Error('You do not have permission to create referral letters');
    }
    
    throw new Error('Failed to create referral letter');
  }
}

// Create add-on procedure (Doctor/Admin only)
export async function createAddOnProcedure(patientId, procedureData) {
  try {
    const procedure = await directus.request(
      createItem('Add_on_Procedures', {
        patient_id: patientId,
        ...procedureData
      })
    );
    
    return procedure;
  } catch (error) {
    console.error('Create procedure error:', error);
    
    if (error.response?.status === 403) {
      throw new Error('You do not have permission to create procedures');
    }
    
    throw new Error('Failed to create procedure');
  }
}