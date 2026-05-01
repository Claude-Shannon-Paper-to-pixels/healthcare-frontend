// src/components/forms/InsuranceForm.jsx
import { useEffect, useState } from 'react';
import { getUser } from '../../utils/auth';
import useSpeechRecognition from '../../hooks/useSpeechRecognition';
import VoiceInputButton from '../../components/VoiceInputButton';


function InsuranceForm({ patientId, onSubmit, onSkip, onCancel, loading, initialData, submitLabel, cancelLabel, loadingLabel, skipLabel }) {
  const currentUser = getUser();
  const isDoctor = currentUser?.role?.name === 'Doctor';
  const normalizeDateInput = (dateValue) => {
    if (!dateValue) return '';
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  };

  const getDefaultState = () => ({
    // Patient Information
    Policy_No: '',
    tpa_name: '',
    IGL_number: '',
    IGL_status: 'Not_submitted',
    estimated_cost: '',
    expected_days_of_stay: '',

    // Admission Information
    admission_reason: '',
    
    // Accident (conditional)
    accident_date: '',
    accident_time: '',
    accident_details: '',
    
    // Illness (conditional)
    illness_symptoms_first_appeared_on_date: '',
    doctors_consulted_for_this_illness: '',
    doctors_or_clinic_contact: '',
    
    // Medical Assessment
    diagnosis: '',
    how_long_is_person_aware_of_this_condition: '',
    blood_pressure: '',
    temperature: '',
    pulse: '',
    date_first_consulted: '',
    any_previous_consultaion: '',
    details_of_previous_consultation: '',
    was_this_patient_referred: '',
    patient_referred_details: '',
    
    // Previous Treatment History
    condition_exist_before: '',
    date: '',
    disease_or_disorder: '',
    treatment_or_hospitalization_details: '',
    doctor_or_hospital_or_clinic: '',
    more: false,
    
    // More History Group (conditional - if more is true)
    date1: '',
    treatment_or_hospitalization_details1: '',
    disease_or_disorder1: '',
    doctor_or_hospital_or_clinic1: '',
    
    // B Group (conditional - if more is true)
    date2: '',
    treatment_or_hospitalization_details2: '',
    disease_or_disorder2: '',
    doctor_or_hospital_or_clinic2: '',
    
    // Diagnosis Information
    diagnosis_information: '',
    
    // Provisional Diagnosis (conditional)
    provisional_diagnosis: '',
    diagnosis_confirmed: '',
    advised_patient: '',
    cause_and_pathology: '',
    any_possibility_of_relapse: '',
    
    // Admitting Diagnosis (conditional)
    admitting_diagnosis: '',
    admitting_diagnosis_confirmed: '',
    admitting_diagnosis_advised_patien: '',
    admitting_diagnosis_cause_and_pathology: '',
    admitting_diagnosisany_possibility_of_relapse: '',
    
    // Condition Management
    condition_be_managed: '',
    reason_for_admission: '',
    
    // Condition Related To
    condition_related_to: [],
    
    // Others
    need_to_add_others: '',
    others: '',
    
    // Type of Operation
    type_of_operation_procedures: '',
    
    // Need to Add Others Copy
    need_to_add_others_copy: 'No',
    
    // Other Conditions
    Condition_1: '',
    Condition_2: '',
    since: '',
    since_copy: '',
    
    // Pregnant Information
    pregnant_information: '',
    pregnancy_duration: ''
  });

  const resolveIglStatus = (data) => {
    // Auto-created insurance stubs (no tpa_name yet) should default to Not_submitted
    if (!data.tpa_name && data.IGL_status !== 'Not_submitted') return 'Not_submitted';
    return data.IGL_status || 'Not_submitted';
  };

  const [insuranceData, setInsuranceData] = useState(() => {
    if (!initialData) return getDefaultState();
    return {
      ...getDefaultState(),
      ...initialData,
      IGL_status: resolveIglStatus(initialData),
      accident_date: normalizeDateInput(initialData.accident_date),
      illness_symptoms_first_appeared_on_date: normalizeDateInput(initialData.illness_symptoms_first_appeared_on_date),
      date_first_consulted: normalizeDateInput(initialData.date_first_consulted),
      date: normalizeDateInput(initialData.date),
      date1: normalizeDateInput(initialData.date1),
      date2: normalizeDateInput(initialData.date2),
      condition_related_to: Array.isArray(initialData.condition_related_to) ? initialData.condition_related_to : [],
      more: Boolean(initialData.more)
    };
  });

  

  const [errors, setErrors] = useState({});

  const { recognitionSupported, listeningField, toggleListening } = useSpeechRecognition({
    lang: 'en-US',
    onResult: (field, transcript) => {
      let value = transcript.trim();
      if (field === 'estimated_cost') {
        value = value.replace(/[^\d.]/g, '');
      }
      setInsuranceData(prev => ({ ...prev, [field]: value }));
    },
    onError: (err) => console.error('Speech recognition error', err)
  });

  const conditionRelatedToOptions = [
    'Pregnancy/Childbirth/Infertility/Caesarean section/miscarriage OR any complications arising therefrom',
    'Congenital / Hereditary diseases',
    'Influence of Drugs / Alcohol',
    'Nervous / Mental / Emotional / Sleeping Disorder',
    'Cosmetic reason / Dental care / refractive errors correction',
    'AIDS / STD / VD/ HIV',
    'Self-inflicted injuries / Violation of laws / Strike / Riots'
  ];

  useEffect(() => {
    if (!initialData) return;
    setInsuranceData({
      ...getDefaultState(),
      ...initialData,
      IGL_status: resolveIglStatus(initialData),
      accident_date: normalizeDateInput(initialData.accident_date),
      illness_symptoms_first_appeared_on_date: normalizeDateInput(initialData.illness_symptoms_first_appeared_on_date),
      date_first_consulted: normalizeDateInput(initialData.date_first_consulted),
      date: normalizeDateInput(initialData.date),
      date1: normalizeDateInput(initialData.date1),
      date2: normalizeDateInput(initialData.date2),
      condition_related_to: Array.isArray(initialData.condition_related_to) ? initialData.condition_related_to : [],
      more: Boolean(initialData.more)
    });
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox' && name === 'more') {
      setInsuranceData({
        ...insuranceData,
        [name]: checked
      });
    } else {
      setInsuranceData({
        ...insuranceData,
        [name]: value
      });
    }
    
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleCheckbox = (e, fieldName) => {
    const { value, checked } = e.target;
    setInsuranceData(prev => {
      const currentValues = prev[fieldName] || [];
      if (checked) {
        return {
          ...prev,
          [fieldName]: [...currentValues, value]
        };
      } else {
        return {
          ...prev,
          [fieldName]: currentValues.filter(item => item !== value)
        };
      }
    });
  };

  const validate = () => {
    const newErrors = {};
    const isEditing = Boolean(initialData?.id);

    // Ensure Policy_No is validated properly
    if (!insuranceData.Policy_No || !insuranceData.Policy_No.trim()) {
      newErrors.Policy_No = 'Policy number is required';
    }

    // Ensure tpa_name is validated properly
    if (!insuranceData.tpa_name) {
      newErrors.tpa_name = 'TPA name is required';
    }

    // Ensure admission_reason is validated properly
    if (!insuranceData.admission_reason) {
      newErrors.admission_reason = 'Admission reason is required';
    }

    setErrors(newErrors);

    // Debugging validation errors
    console.log('Validation Errors:', newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Ensure validation is called and respected
    if (!validate()) {
      console.log('Validation failed. Submission halted.');
      return;
    }

    const submissionData = {
      id: initialData?.id || null, // Include the insurance ID if available
      pation: patientId,
      Policy_No: insuranceData.Policy_No || null,
      tpa_name: insuranceData.tpa_name || null,
      IGL_number: insuranceData.IGL_number || null,
      IGL_status: insuranceData.IGL_status || null,
      estimated_cost: insuranceData.estimated_cost ? parseFloat(insuranceData.estimated_cost) : null,
      expected_days_of_stay: insuranceData.expected_days_of_stay ? parseInt(insuranceData.expected_days_of_stay) : null,
      admission_reason: insuranceData.admission_reason || null,
      accident_date: insuranceData.accident_date || null,
      accident_time: insuranceData.accident_time || null,
      accident_details: insuranceData.accident_details || null,
      illness_symptoms_first_appeared_on_date: insuranceData.illness_symptoms_first_appeared_on_date || null,
      doctors_consulted_for_this_illness: insuranceData.doctors_consulted_for_this_illness || null,
      doctors_or_clinic_contact: insuranceData.doctors_or_clinic_contact || null,
      diagnosis: insuranceData.diagnosis || null,
      how_long_is_person_aware_of_this_condition: insuranceData.how_long_is_person_aware_of_this_condition || null,
      blood_pressure: insuranceData.blood_pressure || null,
      temperature: insuranceData.temperature || null,
      pulse: insuranceData.pulse || null,
      date_first_consulted: insuranceData.date_first_consulted || null,
      any_previous_consultaion: insuranceData.any_previous_consultaion || null,
      details_of_previous_consultation: insuranceData.details_of_previous_consultation || null,
      was_this_patient_referred: insuranceData.was_this_patient_referred || null,
      patient_referred_details: insuranceData.patient_referred_details || null,
      condition_exist_before: insuranceData.condition_exist_before || null,
      date: insuranceData.date || null,
      disease_or_disorder: insuranceData.disease_or_disorder || null,
      treatment_or_hospitalization_details: insuranceData.treatment_or_hospitalization_details || null,
      doctor_or_hospital_or_clinic: insuranceData.doctor_or_hospital_or_clinic || null,
      more: insuranceData.more,
      date1: insuranceData.date1 || null,
      treatment_or_hospitalization_details1: insuranceData.treatment_or_hospitalization_details1 || null,
      disease_or_disorder1: insuranceData.disease_or_disorder1 || null,
      doctor_or_hospital_or_clinic1: insuranceData.doctor_or_hospital_or_clinic1 || null,
      date2: insuranceData.date2 || null,
      treatment_or_hospitalization_details2: insuranceData.treatment_or_hospitalization_details2 || null,
      disease_or_disorder2: insuranceData.disease_or_disorder2 || null,
      doctor_or_hospital_or_clinic2: insuranceData.doctor_or_hospital_or_clinic2 || null,
      diagnosis_information: insuranceData.diagnosis_information || null,
      provisional_diagnosis: insuranceData.provisional_diagnosis || null,
      diagnosis_confirmed: insuranceData.diagnosis_confirmed || null,
      advised_patient: insuranceData.advised_patient || null,
      cause_and_pathology: insuranceData.cause_and_pathology || null,
      any_possibility_of_relapse: insuranceData.any_possibility_of_relapse || null,
      admitting_diagnosis: insuranceData.admitting_diagnosis || null,
      admitting_diagnosis_confirmed: insuranceData.admitting_diagnosis_confirmed || null,
      admitting_diagnosis_advised_patien: insuranceData.admitting_diagnosis_advised_patien || null,
      admitting_diagnosis_cause_and_pathology: insuranceData.admitting_diagnosis_cause_and_pathology || null,
      admitting_diagnosisany_possibility_of_relapse: insuranceData.admitting_diagnosisany_possibility_of_relapse || null,
      condition_be_managed: insuranceData.condition_be_managed || null,
      reason_for_admission: insuranceData.reason_for_admission || null,
      condition_related_to: insuranceData.condition_related_to,
      need_to_add_others: insuranceData.need_to_add_others || null,
      others: insuranceData.others || null,
      type_of_operation_procedures: insuranceData.type_of_operation_procedures || null,
      need_to_add_others_copy: insuranceData.need_to_add_others_copy || null,
      Condition_1: insuranceData.Condition_1 || null,
      Condition_2: insuranceData.Condition_2 || null,
      since: insuranceData.since || null,
      since_copy: insuranceData.since_copy || null,
      pregnant_information: insuranceData.pregnant_information || null,
      pregnancy_duration: insuranceData.pregnancy_duration || null
    };

    console.log('InsuranceForm submissionData:', submissionData);
    onSubmit(submissionData);
  };

  const styles = {
    formSection: {
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '30px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      marginBottom: '30px'
    },
    sectionTitle: {
      color: '#34495e',
      fontSize: '1.3rem',
      marginBottom: '20px',
      paddingBottom: '10px',
      borderBottom: '2px solid #3498db'
    },
    subTitle: {
      color: '#2c3e50',
      marginTop: '30px',
      marginBottom: '15px',
      fontSize: '1.1rem',
      fontWeight: '600'
    },
    infoText: {
      color: '#7f8c8d',
      marginBottom: '20px'
    },
    formRow: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '20px',
      marginBottom: '20px'
    },
    formRow3: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: '20px',
      marginBottom: '20px'
    },
    formGroup: {
      marginBottom: '20px'
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontWeight: '500',
      color: '#2c3e50'
    },
    required: {
      color: '#e74c3c'
    },
    input: {
      width: '100%',
      padding: '10px',
      border: '1px solid #cbd5e0',
      borderRadius: '4px',
      fontSize: '0.95rem',
      boxSizing: 'border-box'
    },
    /* when an input/textarea has a mic button appended we add extra right padding */
    inputWithMic: {
      width: '100%',
      padding: '10px 44px 10px 10px',
      border: '1px solid #cbd5e0',
      borderRadius: '4px',
      fontSize: '0.95rem',
      boxSizing: 'border-box'
    },
    textareaWithMic: {
      width: '100%',
      padding: '10px 44px 10px 10px',
      border: '1px solid #cbd5e0',
      borderRadius: '4px',
      fontSize: '0.95rem',
      boxSizing: 'border-box',
      minHeight: '80px',
      resize: 'vertical'
    },
    /* absolute positioning for appended mic */
    micAbsolute: {
      position: 'absolute',
      right: 8,
      top: '50%',
      transform: 'translateY(-50%)',
      zIndex: 2
    },
    inputError: {
      width: '100%',
      padding: '10px',
      border: '1px solid #e74c3c',
      borderRadius: '4px',
      fontSize: '0.95rem',
      boxSizing: 'border-box'
    },
    select: {
      width: '100%',
      padding: '10px',
      border: '1px solid #cbd5e0',
      borderRadius: '4px',
      fontSize: '0.95rem',
      boxSizing: 'border-box',
      cursor: 'pointer'
    },
    textarea: {
      width: '100%',
      padding: '10px',
      border: '1px solid #cbd5e0',
      borderRadius: '4px',
      fontSize: '0.95rem',
      boxSizing: 'border-box',
      minHeight: '80px',
      resize: 'vertical'
    },
    errorMessage: {
      color: '#e74c3c',
      fontSize: '0.85rem',
      marginTop: '5px',
      display: 'block'
    },
    checkboxGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    },
    checkboxLabel: {
      display: 'flex',
      alignItems: 'center',
      cursor: 'pointer',
      padding: '8px'
    },
    checkbox: {
      marginRight: '10px',
      cursor: 'pointer',
      accentColor: '#3498db',
      width: '18px',
      height: '18px'
    },
    radioGroup: {
      display: 'flex',
      flexDirection: 'row',
      gap: '20px',
      flexWrap: 'wrap'
    },
    radioLabel: {
      display: 'flex',
      alignItems: 'center',
      cursor: 'pointer',
      padding: '10px',
      border: '1px solid #e2e8f0',
      borderRadius: '4px',
      minWidth: '120px'
    },
    radio: {
      marginRight: '10px',
      cursor: 'pointer',
      accentColor: '#3498db',
      width: '18px',
      height: '18px'
    },
    conditionalSection: {
      backgroundColor: '#f8f9fa',
      padding: '20px',
      borderRadius: '8px',
      marginTop: '15px',
      border: '1px solid #dee2e6'
    },
    nestedConditionalSection: {
      backgroundColor: '#ffffff',
      padding: '20px',
      borderRadius: '8px',
      marginTop: '15px',
      border: '1px solid #cbd5e0'
    },
    formActions: {
      display: 'flex',
      gap: '15px',
      justifyContent: 'center',
      marginTop: '30px'
    },
    button: {
      padding: '12px 30px',
      fontSize: '1rem',
      fontWeight: '600',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      textTransform: 'uppercase'
    },
    buttonPrimary: {
      backgroundColor: '#3498db',
      color: 'white'
    },
    buttonSecondary: {
      backgroundColor: '#ecf0f1',
      color: '#2c3e50'
    },
    buttonSuccess: {
      backgroundColor: '#27ae60',
      color: 'white'
    },
    buttonDisabled: {
      backgroundColor: '#95a5a6',
      color: 'white',
      opacity: '0.6',
      cursor: 'not-allowed'
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={styles.formSection}>
        <h2 style={styles.sectionTitle}>Insurance Information</h2>
        <p style={styles.infoText}>
          You can fill this form now or add insurance details later from the patient details page.
        </p>
        
        {/* ==================== PATIENT INFORMATION ==================== */}
        <h3 style={styles.subTitle}>Patient Information</h3>
        
        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Policy Number <span style={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="Policy_No"
              value={insuranceData.Policy_No}
              onChange={handleChange}
              style={errors.Policy_No ? styles.inputError : styles.input}
              placeholder="Enter policy number"
              disabled={loading}
            />
            {errors.Policy_No && <span style={styles.errorMessage}>{errors.Policy_No}</span>}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              TPA Name <span style={styles.required}>*</span>
            </label>
            <select
              name="tpa_name"
              value={insuranceData.tpa_name}
              onChange={handleChange}
              style={errors.tpa_name ? styles.inputError : styles.select}
              disabled={loading}
            >
              <option value="">Select TPA Name</option>
              <option value="Allianze">Allianze</option>
              <option value="CompuMed">CompuMed</option>
              <option value="Etiqa">Etiqa</option>
              <option value="Great Eastern">Great Eastern</option>
              <option value="MediExpress">MediExpress</option>
              <option value="MiCare">MiCare</option>
              <option value="PruBSN">PruBSN</option>
            </select>
            {errors.tpa_name && <span style={styles.errorMessage}>{errors.tpa_name}</span>}
          </div>
        </div>

        {!isDoctor && (
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>IGL Number</label>
              <input
                type="text"
                name="IGL_number"
                value={insuranceData.IGL_number}
                onChange={handleChange}
                style={styles.input}
                placeholder="Enter IGL number"
                disabled={loading}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>IGL Status</label>
              <select
                name="IGL_status"
                value={insuranceData.IGL_status}
                onChange={handleChange}
                style={styles.select}
                disabled={loading}
              >
                <option value="">Select IGL Status</option>
                <option value="Not_submitted">Not Submitted</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Deferment">Deferment</option>
                <option value="Deferment Replied">Deferment Replied</option>
                <option value="Declined">Declined</option>
              </select>
            </div>
          </div>
        )}

        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Estimated Cost (RM)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="number"
                name="estimated_cost"
                value={insuranceData.estimated_cost}
                onChange={handleChange}
                style={styles.input}
                placeholder="0.00"
                step="0.01"
                min="0"
                disabled={loading}
              />
              <VoiceInputButton
                listening={listeningField === 'estimated_cost'}
                onClick={() => toggleListening('estimated_cost')}
                ariaLabel="Voice input for estimated cost"
                disabled={loading || !recognitionSupported}
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Expected Days of Stay</label>
            <input
              type="number"
              name="expected_days_of_stay"
              value={insuranceData.expected_days_of_stay}
              onChange={handleChange}
              style={styles.input}
              placeholder="Enter number of days"
              min="0"
              disabled={loading}
            />
          </div>
        </div>

        {/* ==================== ADMISSION INFORMATION ==================== */}
        <h3 style={styles.subTitle}>Admission Information</h3>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>
            Admission Reason <span style={styles.required}>*</span>
          </label>
          <div style={styles.radioGroup}>
            <label style={styles.radioLabel}>
              <input
                type="radio"
                name="admission_reason"
                value="Accident"
                checked={insuranceData.admission_reason === 'Accident'}
                onChange={handleChange}
                style={styles.radio}
                disabled={loading}
              />
              Accident
            </label>
            <label style={styles.radioLabel}>
              <input
                type="radio"
                name="admission_reason"
                value="Illness"
                checked={insuranceData.admission_reason === 'Illness'}
                onChange={handleChange}
                style={styles.radio}
                disabled={loading}
              />
              Illness
            </label>
          </div>
          {errors.admission_reason && <span style={styles.errorMessage}>{errors.admission_reason}</span>}
        </div>

        {/* Conditional: Accident Details */}
        {insuranceData.admission_reason === 'Accident' && (
          <div style={styles.conditionalSection}>
            <h4 style={{ color: '#2c3e50', marginBottom: '15px' }}>Accident Details</h4>
            
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Accident Date</label>
                <input
                  type="date"
                  name="accident_date"
                  value={insuranceData.accident_date}
                  onChange={handleChange}
                  style={styles.input}
                  disabled={loading}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Accident Time</label>
                <input
                  type="time"
                  name="accident_time"
                  value={insuranceData.accident_time}
                  onChange={handleChange}
                  style={styles.input}
                  disabled={loading}
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Accident Details</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <textarea
                  name="accident_details"
                  value={insuranceData.accident_details}
                  onChange={handleChange}
                  style={styles.textarea}
                  placeholder="Describe the accident details"
                  disabled={loading}
                />
                <VoiceInputButton
                  listening={listeningField === 'accident_details'}
                  onClick={() => toggleListening('accident_details')}
                  ariaLabel="Voice input for accident details"
                  disabled={loading || !recognitionSupported}
                />
              </div>
            </div>
          </div>
        )}

        {/* Conditional: Illness Details */}
        {insuranceData.admission_reason === 'Illness' && (
          <div style={styles.conditionalSection}>
            <h4 style={{ color: '#2c3e50', marginBottom: '15px' }}>Illness Details</h4>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Illness Symptoms First Appeared On Date</label>
              <input
                type="date"
                name="illness_symptoms_first_appeared_on_date"
                value={insuranceData.illness_symptoms_first_appeared_on_date}
                onChange={handleChange}
                style={styles.input}
                disabled={loading}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Doctors Consulted for This Illness</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <textarea
                  name="doctors_consulted_for_this_illness"
                  value={insuranceData.doctors_consulted_for_this_illness}
                  onChange={handleChange}
                  style={styles.textarea}
                  placeholder="Enter doctors consulted"
                  disabled={loading}
                />
                <VoiceInputButton
                  listening={listeningField === 'doctors_consulted_for_this_illness'}
                  onClick={() => toggleListening('doctors_consulted_for_this_illness')}
                  ariaLabel="Voice input for doctors consulted"
                  disabled={loading || !recognitionSupported}
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Doctors or Clinic Contact</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <textarea
                  name="doctors_or_clinic_contact"
                  value={insuranceData.doctors_or_clinic_contact}
                  onChange={handleChange}
                  style={styles.textarea}
                  placeholder="Enter contact information"
                  disabled={loading}
                />
                <VoiceInputButton
                  listening={listeningField === 'doctors_or_clinic_contact'}
                  onClick={() => toggleListening('doctors_or_clinic_contact')}
                  ariaLabel="Voice input for doctors or clinic contact"
                  disabled={loading || !recognitionSupported}
                />
              </div>
            </div>
          </div>
        )}

        {/* ==================== MEDICAL ASSESSMENT ==================== */}
        <h3 style={styles.subTitle}>Medical Assessment</h3>

        <div style={styles.formGroup}>
          <label style={styles.label}>Diagnosis</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <textarea
              name="diagnosis"
              value={insuranceData.diagnosis}
              onChange={handleChange}
              style={styles.textarea}
              placeholder="Enter diagnosis"
              disabled={loading}
            />
            <VoiceInputButton
              listening={listeningField === 'diagnosis'}
              onClick={() => toggleListening('diagnosis')}
              ariaLabel="Voice input for diagnosis"
              disabled={loading || !recognitionSupported}
            />
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>How Long is Person Aware of This Condition</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <textarea
              name="how_long_is_person_aware_of_this_condition"
              value={insuranceData.how_long_is_person_aware_of_this_condition}
              onChange={handleChange}
              style={styles.textarea}
              placeholder="Describe awareness duration"
              disabled={loading}
            />
            <VoiceInputButton
              listening={listeningField === 'how_long_is_person_aware_of_this_condition'}
              onClick={() => toggleListening('how_long_is_person_aware_of_this_condition')}
              ariaLabel="Voice input for awareness duration"
              disabled={loading || !recognitionSupported}
            />
          </div>
        </div>

        {/* Vital Signs */}
        <h4 style={{ color: '#2c3e50', marginTop: '20px', marginBottom: '15px' }}>Vital Signs</h4>
        
        <div style={styles.formRow3}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Blood Pressure</label>
            <input
              type="text"
              name="blood_pressure"
              value={insuranceData.blood_pressure}
              onChange={handleChange}
              style={styles.input}
              placeholder="e.g., 120/80"
              disabled={loading}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Temperature</label>
            <input
              type="text"
              name="temperature"
              value={insuranceData.temperature}
              onChange={handleChange}
              style={styles.input}
              placeholder="e.g., 98°F"
              disabled={loading}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Pulse</label>
            <input
              type="text"
              name="pulse"
              value={insuranceData.pulse}
              onChange={handleChange}
              style={styles.input}
              placeholder="e.g., 82 Bpm"
              disabled={loading}
            />
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Date First Consulted</label>
          <input
            type="date"
            name="date_first_consulted"
            value={insuranceData.date_first_consulted}
            onChange={handleChange}
            style={styles.input}
            disabled={loading}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Any Previous Consultation</label>
          <div style={styles.radioGroup}>
            <label style={styles.radioLabel}>
              <input
                type="radio"
                name="any_previous_consultaion"
                value="Yes"
                checked={insuranceData.any_previous_consultaion === 'Yes'}
                onChange={handleChange}
                style={styles.radio}
                disabled={loading}
              />
              Yes
            </label>
            <label style={styles.radioLabel}>
              <input
                type="radio"
                name="any_previous_consultaion"
                value="No"
                checked={insuranceData.any_previous_consultaion === 'No'}
                onChange={handleChange}
                style={styles.radio}
                disabled={loading}
              />
              No
            </label>
          </div>
        </div>

        {insuranceData.any_previous_consultaion === 'Yes' && (
          <div style={styles.formGroup}>
            <label style={styles.label}>Details of Previous Consultation</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <textarea
                name="details_of_previous_consultation"
                value={insuranceData.details_of_previous_consultation}
                onChange={handleChange}
                style={styles.textarea}
                placeholder="Enter previous consultation details"
                disabled={loading}
              />
              <VoiceInputButton
                listening={listeningField === 'details_of_previous_consultation'}
                onClick={() => toggleListening('details_of_previous_consultation')}
                ariaLabel="Voice input for previous consultation details"
                disabled={loading || !recognitionSupported}
              />
            </div>
          </div>
        )}

        <div style={styles.formGroup}>
          <label style={styles.label}>Was This Patient Referred</label>
          <div style={styles.radioGroup}>
            <label style={styles.radioLabel}>
              <input
                type="radio"
                name="was_this_patient_referred"
                value="Yes"
                checked={insuranceData.was_this_patient_referred === 'Yes'}
                onChange={handleChange}
                style={styles.radio}
                disabled={loading}
              />
              Yes
            </label>
            <label style={styles.radioLabel}>
              <input
                type="radio"
                name="was_this_patient_referred"
                value="No"
                checked={insuranceData.was_this_patient_referred === 'No'}
                onChange={handleChange}
                style={styles.radio}
                disabled={loading}
              />
              No
            </label>
          </div>
        </div>

        {insuranceData.was_this_patient_referred === 'Yes' && (
          <div style={styles.formGroup}>
            <label style={styles.label}>Patient Referred Details</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <textarea
                name="patient_referred_details"
                value={insuranceData.patient_referred_details}
                onChange={handleChange}
                style={styles.textarea}
                placeholder="Enter referral details"
                disabled={loading}
              />
              <VoiceInputButton
                listening={listeningField === 'patient_referred_details'}
                onClick={() => toggleListening('patient_referred_details')}
                ariaLabel="Voice input for patient referred details"
                disabled={loading || !recognitionSupported}
              />
            </div>
          </div>
        )}

        {/* ==================== PREVIOUS TREATMENT HISTORY ==================== */}
        <h3 style={styles.subTitle}>Previous Treatment History</h3>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>Condition Exist Before</label>
          <div style={styles.radioGroup}>
            <label style={styles.radioLabel}>
              <input
                type="radio"
                name="condition_exist_before"
                value="Yes"
                checked={insuranceData.condition_exist_before === 'Yes'}
                onChange={handleChange}
                style={styles.radio}
                disabled={loading}
              />
              Yes
            </label>
            <label style={styles.radioLabel}>
              <input
                type="radio"
                name="condition_exist_before"
                value="No"
                checked={insuranceData.condition_exist_before === 'No'}
                onChange={handleChange}
                style={styles.radio}
                disabled={loading}
              />
              No
            </label>
          </div>
        </div>

        {insuranceData.condition_exist_before === 'Yes' && (
          <div style={styles.conditionalSection}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Date</label>
              <input
                type="date"
                name="date"
                value={insuranceData.date}
                onChange={handleChange}
                style={styles.input}
                disabled={loading}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Disease or Disorder</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="text"
                  name="disease_or_disorder"
                  value={insuranceData.disease_or_disorder}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Enter disease or disorder"
                  disabled={loading}
                />
                <VoiceInputButton
                  listening={listeningField === 'disease_or_disorder'}
                  onClick={() => toggleListening('disease_or_disorder')}
                  ariaLabel="Voice input for disease or disorder"
                  disabled={loading || !recognitionSupported}
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Treatment or Hospitalization Details</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <textarea
                  name="treatment_or_hospitalization_details"
                  value={insuranceData.treatment_or_hospitalization_details}
                  onChange={handleChange}
                  style={styles.textarea}
                  placeholder="Enter treatment details"
                  disabled={loading}
                />
                <VoiceInputButton
                  listening={listeningField === 'treatment_or_hospitalization_details'}
                  onClick={() => toggleListening('treatment_or_hospitalization_details')}
                  ariaLabel="Voice input for treatment details"
                  disabled={loading || !recognitionSupported}
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Doctor or Hospital or Clinic</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="text"
                  name="doctor_or_hospital_or_clinic"
                  value={insuranceData.doctor_or_hospital_or_clinic}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Enter doctor/hospital/clinic name"
                  disabled={loading}
                />
                <VoiceInputButton
                  listening={listeningField === 'doctor_or_hospital_or_clinic'}
                  onClick={() => toggleListening('doctor_or_hospital_or_clinic')}
                  ariaLabel="Voice input for doctor/hospital/clinic"
                  disabled={loading || !recognitionSupported}
                />
              </div>
            </div>

            {/* More History Checkbox */}
            <div style={styles.formGroup}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="more"
                  checked={insuranceData.more}
                  onChange={handleChange}
                  style={styles.checkbox}
                  disabled={loading}
                />
                Add more history records
              </label>
            </div>

            {/* More History Group - Conditional on 'more' checkbox */}
            {insuranceData.more && (
              <div style={styles.nestedConditionalSection}>
                <h4 style={{ color: '#2c3e50', marginBottom: '15px' }}>Additional History Record 1</h4>
                
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Date</label>
                    <input
                      type="date"
                      name="date1"
                      value={insuranceData.date1}
                      onChange={handleChange}
                      style={styles.input}
                      disabled={loading}
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Disease or Disorder</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
                      <input
                        type="text"
                        name="disease_or_disorder1"
                        value={insuranceData.disease_or_disorder1}
                        onChange={handleChange}
                        style={styles.inputWithMic}
                        placeholder="Enter disease or disorder"
                        disabled={loading}
                      />
                      <VoiceInputButton
                        listening={listeningField === 'disease_or_disorder1'}
                        onClick={() => toggleListening('disease_or_disorder1')}
                        ariaLabel="Voice input for disease or disorder (record 1)"
                        disabled={loading || !recognitionSupported}
                        style={styles.micAbsolute}
                      />
                    </div>
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Treatment or Hospitalization Details</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
                    <textarea
                      name="treatment_or_hospitalization_details1"
                      value={insuranceData.treatment_or_hospitalization_details1}
                      onChange={handleChange}
                      style={styles.textareaWithMic}
                      placeholder="Enter treatment details"
                      disabled={loading}
                    />
                    <VoiceInputButton
                      listening={listeningField === 'treatment_or_hospitalization_details1'}
                      onClick={() => toggleListening('treatment_or_hospitalization_details1')}
                      ariaLabel="Voice input for treatment/hospitalization details (record 1)"
                      disabled={loading || !recognitionSupported}
                      style={styles.micAbsolute}
                    />
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Doctor or Hospital or Clinic</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
                    <input
                      type="text"
                      name="doctor_or_hospital_or_clinic1"
                      value={insuranceData.doctor_or_hospital_or_clinic1}
                      onChange={handleChange}
                      style={styles.inputWithMic}
                      placeholder="Enter doctor/hospital/clinic name"
                      disabled={loading}
                    />
                    <VoiceInputButton
                      listening={listeningField === 'doctor_or_hospital_or_clinic1'}
                      onClick={() => toggleListening('doctor_or_hospital_or_clinic1')}
                      ariaLabel="Voice input for doctor/hospital/clinic (record 1)"
                      disabled={loading || !recognitionSupported}
                      style={styles.micAbsolute}
                    />
                  </div>
                </div>

                <h4 style={{ color: '#2c3e50', marginTop: '20px', marginBottom: '15px' }}>Additional History Record 2</h4>
                
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Date</label>
                    <input
                      type="date"
                      name="date2"
                      value={insuranceData.date2}
                      onChange={handleChange}
                      style={styles.input}
                      disabled={loading}
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Disease or Disorder</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
                      <input
                        type="text"
                        name="disease_or_disorder2"
                        value={insuranceData.disease_or_disorder2}
                        onChange={handleChange}
                        style={styles.inputWithMic}
                        placeholder="Enter disease or disorder"
                        disabled={loading}
                      />
                      <VoiceInputButton
                        listening={listeningField === 'disease_or_disorder2'}
                        onClick={() => toggleListening('disease_or_disorder2')}
                        ariaLabel="Voice input for disease or disorder (record 2)"
                        disabled={loading || !recognitionSupported}
                        style={styles.micAbsolute}
                      />
                    </div>
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Treatment or Hospitalization Details</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
                    <textarea
                      name="treatment_or_hospitalization_details2"
                      value={insuranceData.treatment_or_hospitalization_details2}
                      onChange={handleChange}
                      style={styles.textareaWithMic}
                      placeholder="Enter treatment details"
                      disabled={loading}
                    />
                    <VoiceInputButton
                      listening={listeningField === 'treatment_or_hospitalization_details2'}
                      onClick={() => toggleListening('treatment_or_hospitalization_details2')}
                      ariaLabel="Voice input for treatment/hospitalization details (record 2)"
                      disabled={loading || !recognitionSupported}
                      style={styles.micAbsolute}
                    />
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Doctor or Hospital or Clinic</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
                    <input
                      type="text"
                      name="doctor_or_hospital_or_clinic2"
                      value={insuranceData.doctor_or_hospital_or_clinic2}
                      onChange={handleChange}
                      style={styles.inputWithMic}
                      placeholder="Enter doctor/hospital/clinic name"
                      disabled={loading}
                    />
                    <VoiceInputButton
                      listening={listeningField === 'doctor_or_hospital_or_clinic2'}
                      onClick={() => toggleListening('doctor_or_hospital_or_clinic2')}
                      ariaLabel="Voice input for doctor/hospital/clinic (record 2)"
                      disabled={loading || !recognitionSupported}
                      style={styles.micAbsolute}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== DIAGNOSIS INFORMATION ==================== */}
        <h3 style={styles.subTitle}>Diagnosis Information</h3>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>Diagnosis Type</label>
          <div style={styles.radioGroup}>
            <label style={styles.radioLabel}>
              <input
                type="radio"
                name="diagnosis_information"
                value="Provisional Diagnosis"
                checked={insuranceData.diagnosis_information === 'Provisional Diagnosis'}
                onChange={handleChange}
                style={styles.radio}
                disabled={loading}
              />
              Provisional Diagnosis
            </label>
            <label style={styles.radioLabel}>
              <input
                type="radio"
                name="diagnosis_information"
                value="Admitting Diagnosis"
                checked={insuranceData.diagnosis_information === 'Admitting Diagnosis'}
                onChange={handleChange}
                style={styles.radio}
                disabled={loading}
              />
              Admitting Diagnosis
            </label>
          </div>
        </div>

        {/* Provisional Diagnosis */}
        {insuranceData.diagnosis_information === 'Provisional Diagnosis' && (
          <div style={styles.conditionalSection}>
            <h4 style={{ color: '#2c3e50', marginBottom: '15px' }}>Provisional Diagnosis Information</h4>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Provisional Diagnosis</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <textarea
                  name="provisional_diagnosis"
                  value={insuranceData.provisional_diagnosis}
                  onChange={handleChange}
                  style={styles.textarea}
                  placeholder="Enter provisional diagnosis"
                  disabled={loading}
                />
                <VoiceInputButton
                  listening={listeningField === 'provisional_diagnosis'}
                  onClick={() => toggleListening('provisional_diagnosis')}
                  ariaLabel="Voice input for provisional diagnosis"
                  disabled={loading || !recognitionSupported}
                />
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Diagnosis Confirmed Date</label>
                <input
                  type="date"
                  name="diagnosis_confirmed"
                  value={insuranceData.diagnosis_confirmed}
                  onChange={handleChange}
                  style={styles.input}
                  disabled={loading}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Advised Patient Date</label>
                <input
                  type="date"
                  name="advised_patient"
                  value={insuranceData.advised_patient}
                  onChange={handleChange}
                  style={styles.input}
                  disabled={loading}
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Cause and Pathology</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <textarea
                  name="cause_and_pathology"
                  value={insuranceData.cause_and_pathology}
                  onChange={handleChange}
                  style={styles.textarea}
                  placeholder="Enter cause and pathology underlying the present diagnosis"
                  disabled={loading}
                />
                <VoiceInputButton
                  listening={listeningField === 'cause_and_pathology'}
                  onClick={() => toggleListening('cause_and_pathology')}
                  ariaLabel="Voice input for cause and pathology"
                  disabled={loading || !recognitionSupported}
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Any Possibility of Relapse</label>
              <div style={styles.radioGroup}>
                <label style={styles.radioLabel}>
                  <input
                    type="radio"
                    name="any_possibility_of_relapse"
                    value="Yes"
                    checked={insuranceData.any_possibility_of_relapse === 'Yes'}
                    onChange={handleChange}
                    style={styles.radio}
                    disabled={loading}
                  />
                  Yes
                </label>
                <label style={styles.radioLabel}>
                  <input
                    type="radio"
                    name="any_possibility_of_relapse"
                    value="No"
                    checked={insuranceData.any_possibility_of_relapse === 'No'}
                    onChange={handleChange}
                    style={styles.radio}
                    disabled={loading}
                  />
                  No
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Admitting Diagnosis */}
        {insuranceData.diagnosis_information === 'Admitting Diagnosis' && (
          <div style={styles.conditionalSection}>
            <h4 style={{ color: '#2c3e50', marginBottom: '15px' }}>Admitting Diagnosis Information</h4>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Admitting Diagnosis</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <textarea
                  name="admitting_diagnosis"
                  value={insuranceData.admitting_diagnosis}
                  onChange={handleChange}
                  style={styles.textarea}
                  placeholder="Enter admitting diagnosis"
                  disabled={loading}
                />
                <VoiceInputButton
                  listening={listeningField === 'admitting_diagnosis'}
                  onClick={() => toggleListening('admitting_diagnosis')}
                  ariaLabel="Voice input for admitting diagnosis"
                  disabled={loading || !recognitionSupported}
                />
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Admitting Diagnosis Confirmed Date</label>
                <input
                  type="date"
                  name="admitting_diagnosis_confirmed"
                  value={insuranceData.admitting_diagnosis_confirmed}
                  onChange={handleChange}
                  style={styles.input}
                  disabled={loading}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Admitting Diagnosis Advised Patient Date</label>
                <input
                  type="date"
                  name="admitting_diagnosis_advised_patien"
                  value={insuranceData.admitting_diagnosis_advised_patien}
                  onChange={handleChange}
                  style={styles.input}
                  disabled={loading}
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Admitting Diagnosis Cause and Pathology</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <textarea
                  name="admitting_diagnosis_cause_and_pathology"
                  value={insuranceData.admitting_diagnosis_cause_and_pathology}
                  onChange={handleChange}
                  style={styles.textarea}
                  placeholder="Enter cause and pathology"
                  disabled={loading}
                />
                <VoiceInputButton
                  listening={listeningField === 'admitting_diagnosis_cause_and_pathology'}
                  onClick={() => toggleListening('admitting_diagnosis_cause_and_pathology')}
                  ariaLabel="Voice input for admitting diagnosis cause and pathology"
                  disabled={loading || !recognitionSupported}
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Admitting Diagnosis Any Possibility of Relapse</label>
              <div style={styles.radioGroup}>
                <label style={styles.radioLabel}>
                  <input
                    type="radio"
                    name="admitting_diagnosisany_possibility_of_relapse"
                    value="Yes"
                    checked={insuranceData.admitting_diagnosisany_possibility_of_relapse === 'Yes'}
                    onChange={handleChange}
                    style={styles.radio}
                    disabled={loading}
                  />
                  Yes
                </label>
                <label style={styles.radioLabel}>
                  <input
                    type="radio"
                    name="admitting_diagnosisany_possibility_of_relapse"
                    value="No"
                    checked={insuranceData.admitting_diagnosisany_possibility_of_relapse === 'No'}
                    onChange={handleChange}
                    style={styles.radio}
                    disabled={loading}
                  />
                  No
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ==================== CONDITION MANAGEMENT ==================== */}
       
        
        <div style={styles.formGroup}>
          <label style={styles.label}>Can Condition Be Managed</label>
          <div style={styles.radioGroup}>
            <label style={styles.radioLabel}>
              <input
                type="radio"
                name="condition_be_managed"
                value="Yes"
                checked={insuranceData.condition_be_managed === 'Yes'}
                onChange={handleChange}
                style={styles.radio}
                disabled={loading}
              />
              Yes
            </label>
            <label style={styles.radioLabel}>
              <input
                type="radio"
                name="condition_be_managed"
                value="No"
                checked={insuranceData.condition_be_managed === 'No'}
                onChange={handleChange}
                style={styles.radio}
                disabled={loading}
              />
              No
            </label>
          </div>
        </div>

        {insuranceData.condition_be_managed === 'No' && (
          <div style={styles.formGroup}>
            <label style={styles.label}>If No please provide reason for admission</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <textarea
                name="reason_for_admission"
                value={insuranceData.reason_for_admission}
                onChange={handleChange}
                style={styles.textarea}
                placeholder="Enter reason why condition cannot be managed"
                disabled={loading}
              />
              <VoiceInputButton
                listening={listeningField === 'reason_for_admission'}
                onClick={() => toggleListening('reason_for_admission')}
                ariaLabel="Voice input for reason for admission"
                disabled={loading || !recognitionSupported}
              />
            </div>
          </div>
        )}

        {/* ==================== CONDITION RELATED TO ==================== */}
        <h3 style={styles.subTitle}>Condition Related To</h3>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>Select Related Conditions</label>
          <div style={styles.checkboxGroup}>
            {conditionRelatedToOptions.map(option => (
              <label key={option} style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  value={option}
                  checked={insuranceData.condition_related_to.includes(option)}
                  onChange={(e) => handleCheckbox(e, 'condition_related_to')}
                  style={styles.checkbox}
                  disabled={loading}
                />
                {option}
              </label>
            ))}
          </div>
        </div>

        {/* ==================== NEED TO ADD OTHERS ==================== */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Are there any other conditions to add?</label>
          <div style={styles.radioGroup}>
            <label style={styles.radioLabel}>
              <input
                type="radio"
                name="need_to_add_others"
                value="Yes"
                checked={insuranceData.need_to_add_others === 'Yes'}
                onChange={handleChange}
                style={styles.radio}
                disabled={loading}
              />
              Yes
            </label>
            <label style={styles.radioLabel}>
              <input
                type="radio"
                name="need_to_add_others"
                value="No"
                checked={insuranceData.need_to_add_others === 'No'}
                onChange={handleChange}
                style={styles.radio}
                disabled={loading}
              />
              No
            </label>
          </div>
        </div>

        {insuranceData.need_to_add_others === 'Yes' && (
          <div style={styles.formGroup}>
            <label style={styles.label}>Please provide the other condition details.</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <textarea
                name="others"
                value={insuranceData.others}
                onChange={handleChange}
                style={styles.textarea}
                placeholder="Enter other conditions"
                disabled={loading}
              />
              <VoiceInputButton
                listening={listeningField === 'others'}
                onClick={() => toggleListening('others')}
                ariaLabel="Voice input for other condition details"
                disabled={loading || !recognitionSupported}
              />
            </div>
          </div>
        )}

        {/* ==================== TYPE OF OPERATION/PROCEDURES ==================== */}
       
        
        <div style={styles.formGroup}>
          <label style={styles.label}>Type of Operation/Procedures</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <textarea
              name="type_of_operation_procedures"
              value={insuranceData.type_of_operation_procedures}
              onChange={handleChange}
              style={styles.textarea}
              placeholder="Enter type of operation or procedures"
              disabled={loading}
            />
            <VoiceInputButton
              listening={listeningField === 'type_of_operation_procedures'}
              onClick={() => toggleListening('type_of_operation_procedures')}
              ariaLabel="Voice input for type of operation or procedures"
              disabled={loading || !recognitionSupported}
            />
          </div>
        </div>

        {/* ==================== NEED TO ADD OTHERS COPY ==================== */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Any other medical/surgical conditions present?</label>
          <div style={styles.radioGroup}>
            <label style={styles.radioLabel}>
              <input
                type="radio"
                name="need_to_add_others_copy"
                value="Yes"
                checked={insuranceData.need_to_add_others_copy === 'Yes'}
                onChange={handleChange}
                style={styles.radio}
                disabled={loading}
              />
              Yes
            </label>
            <label style={styles.radioLabel}>
              <input
                type="radio"
                name="need_to_add_others_copy"
                value="No"
                checked={insuranceData.need_to_add_others_copy === 'No'}
                onChange={handleChange}
                style={styles.radio}
                disabled={loading}
              />
              No
            </label>
          </div>
        </div>

        {/* ==================== OTHER CONDITIONS ==================== */}
        {insuranceData.need_to_add_others_copy === 'Yes' && (
          <>
            <h3 style={styles.subTitle}>Other Conditions</h3>
            
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Condition 1</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="text"
                    name="Condition_1"
                    value={insuranceData.Condition_1}
                    onChange={handleChange}
                    style={styles.input}
                    placeholder="Enter condition 1"
                    disabled={loading}
                  />
                  <VoiceInputButton
                    listening={listeningField === 'Condition_1'}
                    onClick={() => toggleListening('Condition_1')}
                    ariaLabel="Voice input for condition 1"
                    disabled={loading || !recognitionSupported}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Since</label>
                <input
                  type="date"
                  name="since"
                  value={insuranceData.since}
                  onChange={handleChange}
                  style={styles.input}
                  disabled={loading}
                />
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Condition 2</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="text"
                    name="Condition_2"
                    value={insuranceData.Condition_2}
                    onChange={handleChange}
                    style={styles.input}
                    placeholder="Enter condition 2"
                    disabled={loading}
                  />
                  <VoiceInputButton
                    listening={listeningField === 'Condition_2'}
                    onClick={() => toggleListening('Condition_2')}
                    ariaLabel="Voice input for condition 2"
                    disabled={loading || !recognitionSupported}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Since (Copy)</label>
                <input
                  type="date"
                  name="since_copy"
                  value={insuranceData.since_copy}
                  onChange={handleChange}
                  style={styles.input}
                  disabled={loading}
                />
              </div>
            </div>
          </>
        )}

        {/* ==================== PREGNANT INFORMATION ==================== */}
        {/* <h3 style={styles.subTitle}>Pregnancy Information</h3 */}
        
        <div style={styles.formGroup}>
          <label style={styles.label}>Was the patient pregnant at the time of hospitalization? (For Female Only)</label>
          <div style={styles.radioGroup}>
            <label style={styles.radioLabel}>
              <input
                type="radio"
                name="pregnant_information"
                value="Yes"
                checked={insuranceData.pregnant_information === 'Yes'}
                onChange={handleChange}
                style={styles.radio}
                disabled={loading}
              />
              Yes
            </label>
            <label style={styles.radioLabel}>
              <input
                type="radio"
                name="pregnant_information"
                value="No"
                checked={insuranceData.pregnant_information === 'No'}
                onChange={handleChange}
                style={styles.radio}
                disabled={loading}
              />
              No
            </label>
          </div>
        </div>

        {insuranceData.pregnant_information === 'Yes' && (
          <div style={styles.formGroup}>
            <label style={styles.label}>Pregnancy Duration</label>
            <input
              type="text"
              name="pregnancy_duration"
              value={insuranceData.pregnancy_duration}
              onChange={handleChange}
              style={styles.input}
              placeholder="Enter pregnancy duration (e.g., 12 weeks)"
              disabled={loading}
            />
          </div>
        )}
      </div>

      {/* ==================== FORM ACTIONS ==================== */}
      <div style={styles.formActions}>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{ ...styles.button, ...styles.buttonSecondary }}
            disabled={loading}
          >
            {cancelLabel || 'Cancel'}
          </button>
        )}
        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            disabled={loading}
            style={{
              ...styles.button,
              ...styles.buttonSecondary,
              ...(loading ? styles.buttonDisabled : {})
            }}
          >
            {loading ? (loadingLabel || 'Creating...') : (skipLabel || 'Skip & Complete')}
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          style={{
            ...styles.button,
            ...styles.buttonSuccess,
            ...(loading ? styles.buttonDisabled : {})
          }}
        >
          {loading ? (loadingLabel || 'Creating...') : (submitLabel || 'Save Insurance & Complete')}
        </button>
      </div>
    </form>
  );
}

export default InsuranceForm;