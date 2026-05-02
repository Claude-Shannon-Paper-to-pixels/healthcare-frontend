// src/components/forms/AdmissionForm.jsx
import { useEffect, useState } from 'react';
import { getUser } from '../../utils/auth';
import useSpeechRecognition from '../../hooks/useSpeechRecognition';
import VoiceInputButton from '../../components/VoiceInputButton';

function AdmissionForm({ patientId, onSubmit, onCancel, loading, initialData, submitLabel, cancelLabel, loadingLabel, onChange }) {
  const normalizeDateInput = (dateValue) => {
    if (!dateValue) return '';
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  };

  const getDefaultState = () => ({
    status: 'Admission pending',
    admission_date: new Date().toISOString().split('T')[0],
    admission_time: '',
    admission_to: '',
    type_of_accommodation: '',
    financial_class: '',
    gl_service: '',
    diagnosis: '',
    operation_date: '',
    operation_time: '',
    type_of_operation_or_procedure: '',
    Surgery_Duration: '',
    urgent_investigations: [],
    need_to_add_others: '',
    other_investigation: '',
    instructions_to_ward_staff: '',
    endoscopy_procedures: [],
    Sedation_and_Anesthesia: '',
    need_to_add_more_procedures: '',
    other_endoscopy_procedures: '',
    expected_days_of_stay: '',
    estimated_cost_RM: '',
    Additional_Information_and_Individual_Risks: '',
    confirmation_of: [],
    discharge_date: '',
    discharge_time: ''
  });

  const [admissionData, setAdmissionData] = useState(() => {
    if (!initialData) return getDefaultState();
    return {
      ...getDefaultState(),
      ...initialData,
      admission_date: normalizeDateInput(initialData.admission_date),
      operation_date: normalizeDateInput(initialData.operation_date),
      discharge_date: normalizeDateInput(initialData.discharge_date),
      urgent_investigations: Array.isArray(initialData.urgent_investigations) ? initialData.urgent_investigations : [],
      endoscopy_procedures: Array.isArray(initialData.endoscopy_procedures) ? initialData.endoscopy_procedures : [],
      confirmation_of: Array.isArray(initialData.confirmation_of) ? initialData.confirmation_of : []
    };
  });

  const [errors, setErrors] = useState({});
  const [showGLServiceModal, setShowGLServiceModal] = useState(false);
  const [pendingGlService, setPendingGlService] = useState('');

  const { recognitionSupported, listeningField, toggleListening } = useSpeechRecognition({
    lang: 'en-US',
    onResult: (field, transcript) => {
      setAdmissionData(prev => ({ ...prev, [field]: transcript.trim() }));
    },
    onError: (err) => console.error('Speech recognition error', err)
  });

  const currentUser = getUser();
  const roleName = currentUser?.role?.name;
  const canModifyStatus = roleName === 'Administrator' || roleName === 'Hospital_staff';

  // Dropdown options
  const urgentInvestigationsOptions = [
    'Blood Test',
    'X-ray',
    'MRI',
    'Urine Test',
    'CT Scan',
    'ECG'
  ];

  const endoscopyProceduresOptions = [
    'Oesophagogastroduodenoscopy',
    'Endoscopic Retrograde Cholangio - Pancreatography',
    'Colonoscopy',
    'Sigmoidoscopy',
    'Bronchoscopy',
    'Cystoscopy',
    'Capsule Endoscopy'
  ];

  const sedationAnesthesiaOptions = [
    'General or Regional Anesthesia',
    'Local Anesthesia',
    'Conscious Sedation'
  ];

  const confirmationOfOptions = [
    'Receipt of Risk Disclosure Information Sheet',
    'Disclosure of general and specific risks of treatment procedure or operation was discussed'
  ];

  useEffect(() => {
    if (!initialData) return;
    setAdmissionData({
      ...getDefaultState(),
      ...initialData,
      admission_date: normalizeDateInput(initialData.admission_date),
      operation_date: normalizeDateInput(initialData.operation_date),
      discharge_date: normalizeDateInput(initialData.discharge_date),
      urgent_investigations: Array.isArray(initialData.urgent_investigations) ? initialData.urgent_investigations : [],
      endoscopy_procedures: Array.isArray(initialData.endoscopy_procedures) ? initialData.endoscopy_procedures : [],
      confirmation_of: Array.isArray(initialData.confirmation_of) ? initialData.confirmation_of : []
    });
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAdmissionData({
      ...admissionData,
      [name]: value
    });
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleCheckbox = (e, fieldName) => {
    const { value, checked } = e.target;
    setAdmissionData(prev => {
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

  const handleFinancialClassChange = (value) => {
    setAdmissionData(prev => ({ ...prev, financial_class: value, gl_service: '' }));
    if (errors.financial_class) setErrors(prev => ({ ...prev, financial_class: '' }));
    setPendingGlService(value === 'Self-Pay' ? 'in_patient' : '');
    setShowGLServiceModal(true);
  };

  const openGLServiceModal = () => {
    setPendingGlService(admissionData.gl_service);
    setShowGLServiceModal(true);
  };

  const confirmGlService = () => {
    setAdmissionData(prev => ({
      ...prev,
      gl_service: pendingGlService,
      expected_days_of_stay: pendingGlService === 'out_patient' ? '0' : (prev.expected_days_of_stay === '0' ? '' : prev.expected_days_of_stay),
    }));
    if (errors.gl_service) setErrors(prev => ({ ...prev, gl_service: '' }));
    setShowGLServiceModal(false);
  };

  const cancelGlService = () => {
    if (admissionData.financial_class === 'Self-Pay') {
      setAdmissionData(prev => ({ ...prev, gl_service: 'in_patient' }));
    }
    setShowGLServiceModal(false);
  };

  const validate = () => {
    const newErrors = {};
    if (!admissionData.gl_service) newErrors.gl_service = 'GL Service is required';
    if (!admissionData.status) newErrors.status = 'Status is required';
    if (!admissionData.admission_date) newErrors.admission_date = 'Admission date is required';
    if (!admissionData.admission_time) newErrors.admission_time = 'Admission time is required';
    if (!admissionData.financial_class) newErrors.financial_class = 'Financial class is required';
    if (!admissionData.diagnosis.trim()) newErrors.diagnosis = 'Diagnosis is required';
    // if (!admissionData.type_of_accommodation) {
    //   newErrors.type_of_accommodation = 'Type of accommodation is required';
    // }
    if (admissionData.estimated_cost_RM === '' || admissionData.estimated_cost_RM === null) {
      newErrors.estimated_cost_RM = 'Estimated cost is required';
    }
    if (admissionData.Surgery_Duration !== '' && admissionData.Surgery_Duration !== null && admissionData.Surgery_Duration !== undefined) {
      const durationVal = Number(admissionData.Surgery_Duration);
      if (!Number.isFinite(durationVal) || durationVal <= 0) {
        newErrors.Surgery_Duration = 'Surgery duration must be a positive number (minutes)';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      // Clean and prepare data for submission
      // Remove empty string fields and convert to null for numeric fields
      // NOTE: We don't include Patient field here because the relationship
      // is set from the Patient side (patient_Admission field)
      const submissionData = {
        Patient: [{ id: patientId }],
        gl_service: admissionData.gl_service || null,
        status: admissionData.status,
        admission_category: admissionData.admission_category || null,
        admission_date: admissionData.admission_date,
        admission_time: admissionData.admission_time,
        admission_to: admissionData.admission_to || null,
        type_of_accommodation: admissionData.type_of_accommodation || null,
        financial_class: admissionData.financial_class,
        diagnosis: admissionData.diagnosis,
        operation_date: admissionData.operation_date || null,
        operation_time: admissionData.operation_time || null,
        type_of_operation_or_procedure: admissionData.type_of_operation_or_procedure || null,
        Surgery_Duration: admissionData.Surgery_Duration ? parseFloat(admissionData.Surgery_Duration) : null,
        urgent_investigations: admissionData.urgent_investigations,
        need_to_add_others: admissionData.need_to_add_others || null,
        other_investigation: admissionData.other_investigation || null,
        instructions_to_ward_staff: admissionData.instructions_to_ward_staff || null,
        endoscopy_procedures: admissionData.endoscopy_procedures,
        Sedation_and_Anesthesia: admissionData.Sedation_and_Anesthesia || null,
        need_to_add_more_procedures: admissionData.need_to_add_more_procedures || null,
        other_endoscopy_procedures: admissionData.other_endoscopy_procedures || null,
        expected_days_of_stay: admissionData.expected_days_of_stay ? parseInt(admissionData.expected_days_of_stay) : null,
        estimated_cost_RM: admissionData.estimated_cost_RM ? parseFloat(admissionData.estimated_cost_RM) : null,
        Additional_Information_and_Individual_Risks: admissionData.Additional_Information_and_Individual_Risks || null,
        confirmation_of: admissionData.confirmation_of,
        discharge_date: admissionData.discharge_date || null,
        discharge_time: admissionData.discharge_time || null
      };
      onSubmit(submissionData);
    }
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
      marginBottom: '15px'
    },
    formRow: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
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
    micButton: {
      background: '#fff',
      border: '1px solid #cbd5e0',
      borderRadius: '50%',
      width: 34,
      height: 34,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      padding: 0
    },
    micActive: {
      background: '#e6f7ff',
      borderColor: '#60a5fa'
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
    buttonDisabled: {
      backgroundColor: '#95a5a6',
      color: 'white',
      opacity: '0.6',
      cursor: 'not-allowed'
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    },
    modalContainer: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '32px',
      width: '480px',
      maxWidth: '90vw',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
    },
    glCard: {
      border: '2px solid #e2e8f0',
      borderRadius: '8px',
      padding: '20px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      marginBottom: '12px',
      transition: 'border-color 0.2s ease, background-color 0.2s ease'
    },
    glCardSelected: {
      borderColor: '#3498db',
      backgroundColor: '#ebf5fb'
    },
    glServiceBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      backgroundColor: '#ebf5fb',
      border: '1.5px solid #3498db',
      borderRadius: '6px',
      padding: '10px 18px',
      color: '#2980b9',
      fontWeight: '600',
      fontSize: '0.95rem'
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={styles.formSection}>
        <h2 style={styles.sectionTitle}>Admission Information (Required)</h2>
        
        {/* Admission Details */}
        <h3 style={styles.subTitle}>Admission Details</h3>

        <div style={styles.formGroup}>
          <label style={styles.label}>
            Financial Class <span style={styles.required}>*</span>
          </label>
          <div style={styles.radioGroup}>
            <label style={{
              ...styles.radioLabel,
              ...(admissionData.financial_class === 'Self-Pay' ? { borderColor: '#3498db', backgroundColor: '#ebf5fb' } : {})
            }}>
              <input
                type="radio"
                name="financial_class"
                value="Self-Pay"
                checked={admissionData.financial_class === 'Self-Pay'}
                onChange={(e) => handleFinancialClassChange(e.target.value)}
                style={styles.radio}
                disabled={loading}
              />
              Self-Pay
            </label>
            <label style={{
              ...styles.radioLabel,
              ...(admissionData.financial_class === 'Guarantee Letter' ? { borderColor: '#3498db', backgroundColor: '#ebf5fb' } : {})
            }}>
              <input
                type="radio"
                name="financial_class"
                value="Guarantee Letter"
                checked={admissionData.financial_class === 'Guarantee Letter'}
                onChange={(e) => handleFinancialClassChange(e.target.value)}
                style={styles.radio}
                disabled={loading}
              />
              Guarantee Letter
            </label>
          </div>
          {errors.financial_class && <span style={styles.errorMessage}>{errors.financial_class}</span>}
        </div>

        {admissionData.financial_class && (
          <div style={styles.formGroup}>
            <label style={styles.label}>
              GL Service <span style={styles.required}>*</span>
            </label>
            {admissionData.gl_service ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={styles.glServiceBadge}>
                  {admissionData.gl_service === 'in_patient' ? 'In Patient' : 'Out Patient'}
                </div>
                {admissionData.financial_class === 'Guarantee Letter' && (
                  <button
                    type="button"
                    onClick={openGLServiceModal}
                    disabled={loading}
                    style={{
                      padding: '8px 16px',
                      border: '1px solid #3498db',
                      borderRadius: '4px',
                      backgroundColor: 'white',
                      color: '#3498db',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                  >
                    Edit
                  </button>
                )}
              </div>
            ) : (
              <div>
                <button
                  type="button"
                  onClick={() => { setPendingGlService(''); setShowGLServiceModal(true); }}
                  disabled={loading}
                  style={{
                    padding: '10px 20px',
                    border: `2px dashed ${errors.gl_service ? '#e74c3c' : '#3498db'}`,
                    borderRadius: '6px',
                    backgroundColor: errors.gl_service ? '#fff5f5' : '#f8fbff',
                    color: errors.gl_service ? '#e74c3c' : '#3498db',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    fontWeight: '500',
                    width: '100%',
                    textAlign: 'center'
                  }}
                >
                  Click to Select GL Service
                </button>
                {errors.gl_service && <span style={styles.errorMessage}>{errors.gl_service}</span>}
              </div>
            )}
          </div>
        )}

        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Status <span style={styles.required}>*</span>
              {!canModifyStatus && (
                <span style={{ fontSize: '0.75rem', color: '#e67e22', marginLeft: '8px' }}>
                  (Locked: Requires Staff Member for Change this)
                </span>
              )}
            </label>
            <select
              name="status"
              value={admissionData.status}
              onChange={handleChange}
              style={errors.status ? styles.inputError : styles.select}
              // DISABLED if loading OR if user is NOT Admin/Staff
              disabled={loading || !canModifyStatus}
            >
              <option value="Admission pending">Admission pending</option>
              <option value="Admitted">Admitted</option>
              <option value="Today discharge">Today discharge</option>
              <option value="Tomorrow discharge">Tomorrow discharge</option>
              <option value="Discharged">Discharged</option>
            </select>
            {errors.status && <span style={styles.errorMessage}>{errors.status}</span>}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Admission Category</label>
            <select
              name="admission_category"
              value={admissionData.admission_category}
              onChange={handleChange}
              style={styles.select}
              disabled={loading}
            >
              <option value="">Select Category</option>
              <option value="Urgent">Urgent</option>
              <option value="Non-Urgent">Non-Urgent</option>
              <option value="Under Package">Under Package</option>
            </select>
          </div>
        </div>

        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Admission Date <span style={styles.required}>*</span>
            </label>
            <input
              type="date"
              name="admission_date"
              value={admissionData.admission_date}
              onChange={handleChange}
              style={errors.admission_date ? styles.inputError : styles.input}
              disabled={loading}
            />
            {errors.admission_date && <span style={styles.errorMessage}>{errors.admission_date}</span>}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              Admission Time <span style={styles.required}>*</span>
            </label>
            <input
              type="time"
              name="admission_time"
              value={admissionData.admission_time}
              onChange={handleChange}
              style={errors.admission_time ? styles.inputError : styles.input}
              disabled={loading}
            />
            {errors.admission_time && <span style={styles.errorMessage}>{errors.admission_time}</span>}
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Admission To</label>
          <select
            name="admission_to"
            value={admissionData.admission_to}
            onChange={handleChange}
            style={styles.select}
            disabled={loading}
          >
            <option value="">Select Admission Location</option>
            <option value="Ward">Ward</option>
            <option value="Emergency">Emergency</option>
            <option value="Daycare">Daycare</option>
            <option value="ICU/CCU/HDU">ICU/CCU/HDU</option>
          </select>
        </div>

        <div style={styles.formGroup}>
            <label style={styles.label}>
              Type of Accommodation <span style={styles.required}>*</span>
            </label>
          <select
            name="type_of_accommodation"
            value={admissionData.type_of_accommodation}
            onChange={handleChange}
              style={errors.type_of_accommodation ? styles.inputError : styles.select}
            disabled={loading}
          >
            <option value="">Select Accommodation Type</option>
            <option value="Executive Suite - RM20,000">Executive Suite - RM20,000</option>
            <option value="VIP - RM1,500">VIP - RM1,500</option>
            <option value="Single Deluxe - RM420">Single Deluxe - RM420</option>
            <option value="Single Standard - RM250">Single Standard - RM250</option>
            <option value="2 Bedded - RM160">2 Bedded - RM160</option>
            <option value="4 Bedded - RM100">4 Bedded - RM100</option>
            <option value="Isolation Room - RM250">Isolation Room - RM250</option>
          </select>
            {errors.type_of_accommodation && (
              <span style={styles.errorMessage}>{errors.type_of_accommodation}</span>
            )}
        </div>

        {/* Medical Information */}
        <h3 style={styles.subTitle}>Medical Information</h3>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>
            Diagnosis <span style={styles.required}>*</span>
          </label>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <textarea
              name="diagnosis"
              value={admissionData.diagnosis}
              onChange={handleChange}
              style={errors.diagnosis ? { ...styles.textarea, border: '1px solid #e74c3c' } : styles.textarea}
              placeholder="Enter diagnosis details"
              disabled={loading}
            />
            <VoiceInputButton
              listening={listeningField === 'diagnosis'}
              onClick={() => toggleListening('diagnosis')}
              ariaLabel="Voice input for diagnosis"
              disabled={loading || !recognitionSupported}
            />
          </div>
          {errors.diagnosis && <span style={styles.errorMessage}>{errors.diagnosis}</span>}
        </div>

        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Operation Date</label>
            <input
              type="date"
              name="operation_date"
              value={admissionData.operation_date}
              onChange={handleChange}
              style={styles.input}
              disabled={loading}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Operation Time</label>
            <input
              type="time"
              name="operation_time"
              value={admissionData.operation_time}
              onChange={handleChange}
              style={styles.input}
              disabled={loading}
            />
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Type of Operation or Procedure</label>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <textarea
              name="type_of_operation_or_procedure"
              value={admissionData.type_of_operation_or_procedure}
              onChange={handleChange}
              style={styles.textarea}
              placeholder="Enter operation/procedure type"
              disabled={loading}
            />
            <VoiceInputButton
              listening={listeningField === 'type_of_operation_or_procedure'}
              onClick={() => toggleListening('type_of_operation_or_procedure')}
              ariaLabel="Voice input for operation type"
              disabled={loading || !recognitionSupported}
            />
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Surgery Duration (minutes, decimals allowed)</label>
          <input
            type="number"
            name="Surgery_Duration"
            value={admissionData.Surgery_Duration}
            onChange={handleChange}
            style={errors.Surgery_Duration ? styles.inputError : styles.input}
            placeholder="e.g., 120.5"
            min="0.1"
            step="0.1"
            disabled={loading}
          />
          {errors.Surgery_Duration && <span style={styles.errorMessage}>{errors.Surgery_Duration}</span>}
        </div>

        {/* Investigation and Procedures */}
        <h3 style={styles.subTitle}>Investigation and Procedures</h3>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>Urgent Investigations</label>
          <div style={styles.checkboxGroup}>
            {urgentInvestigationsOptions.map(option => (
              <label key={option} style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  value={option}
                  checked={admissionData.urgent_investigations.includes(option)}
                  onChange={(e) => handleCheckbox(e, 'urgent_investigations')}
                  style={styles.checkbox}
                  disabled={loading}
                />
                {option}
              </label>
            ))}
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Additional Investigations Needed?</label>
          <div style={styles.radioGroup}>
            {['Yes', 'No'].map(option => (
              <label key={option} style={styles.radioLabel}>
                <input
                  type="radio"
                  name="need_to_add_others"
                  value={option}
                  checked={admissionData.need_to_add_others === option}
                  onChange={handleChange}
                  style={styles.radio}
                  disabled={loading}
                />
                {option}
              </label>
            ))}
          </div>
        </div>

        {admissionData.need_to_add_others === 'Yes' && (
          <div style={styles.formGroup}>
            <label style={styles.label}>Other Investigation Details</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <textarea
                name="other_investigation"
                value={admissionData.other_investigation}
                onChange={handleChange}
                style={styles.textarea}
                placeholder="Enter other investigation details"
                disabled={loading}
              />
              <VoiceInputButton
                listening={listeningField === 'other_investigation'}
                onClick={() => toggleListening('other_investigation')}
                ariaLabel="Voice input for other investigation details"
                disabled={loading || !recognitionSupported}
              />
            </div>
          </div>
        )}

        <div style={styles.formGroup}>
          <label style={styles.label}>Instructions for Ward Staff</label>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <textarea
              name="instructions_to_ward_staff"
              value={admissionData.instructions_to_ward_staff}
              onChange={handleChange}
              style={styles.textarea}
              placeholder="Enter special instructions for ward staff"
              disabled={loading}
            />
            <VoiceInputButton
              listening={listeningField === 'instructions_to_ward_staff'}
              onClick={() => toggleListening('instructions_to_ward_staff')}
              ariaLabel="Voice input for instructions to ward staff"
              disabled={loading || !recognitionSupported}
            />
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Endoscopy Procedures</label>
          <div style={styles.checkboxGroup}>
            {endoscopyProceduresOptions.map(option => (
              <label key={option} style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  value={option}
                  checked={admissionData.endoscopy_procedures.includes(option)}
                  onChange={(e) => handleCheckbox(e, 'endoscopy_procedures')}
                  style={styles.checkbox}
                  disabled={loading}
                />
                {option}
              </label>
            ))}
          </div>
        </div>

      
        <div style={styles.formGroup}>
          <label style={styles.label}>More Procedures Required?</label>
          <div style={styles.radioGroup}>
            {['Yes', 'No'].map(option => (
              <label key={option} style={styles.radioLabel}>
                <input
                  type="radio"
                  name="need_to_add_more_procedures"
                  value={option}
                  checked={admissionData.need_to_add_more_procedures === option}
                  onChange={handleChange}
                  style={styles.radio}
                  disabled={loading}
                />
                {option}
              </label>
            ))}
          </div>
        </div>

        {admissionData.need_to_add_more_procedures === 'Yes' && (
          <div style={styles.formGroup}>
            <label style={styles.label}>Other Endoscopy Procedure Details</label>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <textarea
                name="other_endoscopy_procedures"
                value={admissionData.other_endoscopy_procedures}
                onChange={handleChange}
                style={styles.textarea}
                placeholder="Enter other endoscopy procedure details"
                disabled={loading}
              />
              <VoiceInputButton
                listening={listeningField === 'other_endoscopy_procedures'}
                onClick={() => toggleListening('other_endoscopy_procedures')}
                ariaLabel="Voice input for other endoscopy procedure details"
                disabled={loading || !recognitionSupported}
              />
            </div>
          </div>
        )}

        <div style={styles.formGroup}>
          <label style={styles.label}>Sedation / Anesthesia Type</label>
          <div style={{ ...styles.radioGroup, flexDirection: 'column' }}>
            {sedationAnesthesiaOptions.map(option => (
              <label
                key={option}
                style={{
                  ...styles.radioLabel,
                  border: 'none',
                  padding: '8px 0',
                  minWidth: 0,
                  background: 'transparent'
                }}
              >
                <input
                  type="radio"
                  name="Sedation_and_Anesthesia"
                  value={option}
                  checked={admissionData.Sedation_and_Anesthesia === option}
                  onChange={handleChange}
                  style={styles.radio}
                  disabled={loading}
                />
                {option}
              </label>
            ))}
          </div>
        </div>

        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Expected Length of Stay (Days)
            </label>
            <input
              type="number"
              name="expected_days_of_stay"
              value={admissionData.gl_service === 'out_patient' ? '0' : admissionData.expected_days_of_stay}
              onChange={handleChange}
              min="1"
              style={errors.expected_days_of_stay ? styles.inputError : styles.input}
              placeholder="Number of days"
              disabled={loading || admissionData.gl_service === 'out_patient'}
            />
            {errors.expected_days_of_stay && (
              <span style={styles.errorMessage}>{errors.expected_days_of_stay}</span>
            )}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Estimated Cost (RM) <span style={styles.required}>*</span></label>
            <input
              type="number"
              name="estimated_cost_RM"
              value={admissionData.estimated_cost_RM}
              onChange={handleChange}
              min="0"
              step="0.01"
              style={errors.estimated_cost_RM ? styles.inputError : styles.input}
              placeholder="0.00"
              disabled={loading}
            />
            {errors.estimated_cost_RM && (
              <span style={styles.errorMessage}>{errors.estimated_cost_RM}</span>
            )}
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Additional Notes / Risks</label>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <textarea
              name="Additional_Information_and_Individual_Risks"
              value={admissionData.Additional_Information_and_Individual_Risks}
              onChange={handleChange}
              style={styles.textarea}
              placeholder="Enter additional information and risks"
              disabled={loading}
            />
            <VoiceInputButton
              listening={listeningField === 'Additional_Information_and_Individual_Risks'}
              onClick={() => toggleListening('Additional_Information_and_Individual_Risks')}
              ariaLabel="Voice input for additional notes and risks"
              disabled={loading || !recognitionSupported}
            />
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Confirmation Of</label>
          <div style={styles.checkboxGroup}>
            {confirmationOfOptions.map(option => (
              <label key={option} style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  value={option}
                  checked={admissionData.confirmation_of.includes(option)}
                  onChange={(e) => handleCheckbox(e, 'confirmation_of')}
                  style={styles.checkbox}
                  disabled={loading}
                />
                {option}
              </label>
            ))}
          </div>
        </div>

        {/* Discharge Details */}
        {/* <h3 style={styles.subTitle}>Discharge Details</h3>
        
        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Discharge Date</label>
            <input
              type="date"
              name="discharge_date"
              value={admissionData.discharge_date}
              onChange={handleChange}
              style={styles.input}
              disabled={loading}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Discharge Time</label>
            <input
              type="time"
              name="discharge_time"
              value={admissionData.discharge_time}
              onChange={handleChange}
              style={styles.input}
              disabled={loading}
            />
          </div>
        </div> */}
      </div>

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
        <button
          type="submit"
          disabled={loading}
          style={{
            ...styles.button,
            ...styles.buttonPrimary,
            ...(loading ? styles.buttonDisabled : {})
          }}
        >
          {loading
            ? (loadingLabel || 'Creating Admission...')
            : (submitLabel || (admissionData.financial_class === 'Guarantee Letter'
                ? 'Next: Insurance Details'
                : 'Complete & Create'))}
        </button>
      </div>

      {showGLServiceModal && (
        <div style={styles.modalOverlay} onClick={cancelGlService}>
          <div style={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ margin: 0, color: '#2c3e50', fontSize: '1.3rem' }}>Select GL Service</h3>
              <p style={{ margin: '8px 0 0', color: '#7f8c8d', fontSize: '0.9rem' }}>
                {admissionData.financial_class === 'Self-Pay'
                  ? 'Self-Pay patients are automatically registered as In-Patient.'
                  : 'Select the service type for this Guarantee Letter patient.'}
              </p>
            </div>

            <div
              style={{
                ...styles.glCard,
                ...(pendingGlService === 'in_patient' ? styles.glCardSelected : {}),
                ...(admissionData.financial_class === 'Self-Pay' ? { cursor: 'default' } : {})
              }}
              onClick={() => {
                if (admissionData.financial_class !== 'Self-Pay') setPendingGlService('in_patient');
              }}
            >
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                border: `2px solid ${pendingGlService === 'in_patient' ? '#3498db' : '#cbd5e0'}`,
                backgroundColor: pendingGlService === 'in_patient' ? '#3498db' : 'white',
                flexShrink: 0
              }} />
              <div>
                <div style={{ fontWeight: '600', color: '#2c3e50' }}>In Patient</div>
                <div style={{ fontSize: '0.85rem', color: '#7f8c8d', marginTop: '4px' }}>
                  Patient will be admitted to a ward
                </div>
              </div>
              {admissionData.financial_class === 'Self-Pay' && (
                <span style={{
                  marginLeft: 'auto',
                  backgroundColor: '#ebf5fb',
                  color: '#2980b9',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}>
                  Auto-selected
                </span>
              )}
            </div>

            {admissionData.financial_class === 'Guarantee Letter' && (
              <div
                style={{
                  ...styles.glCard,
                  ...(pendingGlService === 'out_patient' ? styles.glCardSelected : {})
                }}
                onClick={() => setPendingGlService('out_patient')}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: `2px solid ${pendingGlService === 'out_patient' ? '#3498db' : '#cbd5e0'}`,
                  backgroundColor: pendingGlService === 'out_patient' ? '#3498db' : 'white',
                  flexShrink: 0
                }} />
                <div>
                  <div style={{ fontWeight: '600', color: '#2c3e50' }}>Out Patient</div>
                  <div style={{ fontSize: '0.85rem', color: '#7f8c8d', marginTop: '4px' }}>
                    Patient will be treated without admission
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button
                type="button"
                onClick={cancelGlService}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #cbd5e0',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  color: '#2c3e50',
                  cursor: 'pointer',
                  fontSize: '0.95rem'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmGlService}
                disabled={!pendingGlService}
                style={{
                  padding: '10px 24px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: pendingGlService ? '#3498db' : '#95a5a6',
                  color: 'white',
                  cursor: pendingGlService ? 'pointer' : 'not-allowed',
                  fontSize: '0.95rem',
                  fontWeight: '600'
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

export default AdmissionForm;