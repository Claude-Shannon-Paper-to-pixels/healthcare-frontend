import { useState } from 'react';
import useSpeechRecognition from '../../hooks/useSpeechRecognition';
import VoiceInputButton from '../../components/VoiceInputButton';

function AddOnProceduresForm({ onSubmit, onCancel, loading, initialData = null, patientId = null }) {
  const [formData, setFormData] = useState({
    Procedures_patient: initialData?.Procedures_patient?.id || patientId || '',
    plan_date: initialData?.plan_date || new Date().toISOString().split('T')[0],
    estimated_cost: initialData?.estimated_cost || '',
    procedure_description: initialData?.procedure_description || '',
    indication_for_additional_procedures: initialData?.indication_for_additional_procedures || '',
    authorizer_remarks: initialData?.authorizer_remarks || '',
    status: initialData?.status || 'Processing'
  });

  const [errors, setErrors] = useState({});

  const { recognitionSupported, listeningField, toggleListening } = useSpeechRecognition({
    lang: 'en-US',
    onResult: (field, transcript) => {
      let value = transcript.trim();
      if (field === 'estimated_cost') value = value.replace(/[^\d.]/g, '');
      setFormData(prev => ({ ...prev, [field]: value }));
    },
    onError: (err) => console.error('Speech recognition error', err)
  });

  const handleChange = (event) => { 
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.Procedures_patient) {
      newErrors.Procedures_patient = 'Patient is required';
    }
    if (!formData.plan_date) {
      newErrors.plan_date = 'Plan date is required';
    }
    if (formData.estimated_cost === '' || formData.estimated_cost === null) {
      newErrors.estimated_cost = 'Estimated cost is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate()) return;

    const submissionData = {
      Procedures_patient: formData.Procedures_patient,
      plan_date: formData.plan_date,
      estimated_cost:
        formData.estimated_cost === '' || formData.estimated_cost === null
          ? null
          : parseFloat(formData.estimated_cost),
      procedure_description: formData.procedure_description,
      indication_for_additional_procedures: formData.indication_for_additional_procedures,
      authorizer_remarks: formData.authorizer_remarks,
      status: formData.status
    };

    onSubmit(submissionData);
  };

  const styles = {
    formSection: {
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
    },
    sectionTitle: {
      color: '#34495e',
      fontSize: '1.2rem',
      marginBottom: '18px',
      paddingBottom: '8px',
      borderBottom: '2px solid #3498db'
    },
    formGroup: {
      marginBottom: '16px'
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
    textarea: {
      width: '100%',
      padding: '10px',
      border: '1px solid #cbd5e0',
      borderRadius: '4px',
      fontSize: '0.95rem',
      boxSizing: 'border-box',
      minHeight: '140px',
      resize: 'vertical',
      fontFamily: 'inherit'
    },
    errorMessage: {
      color: '#e74c3c',
      fontSize: '0.85rem',
      marginTop: '5px',
      display: 'block'
    },
    formActions: {
      display: 'flex',
      gap: '12px',
      justifyContent: 'center',
      marginTop: '24px'
    },
    button: {
      padding: '10px 24px',
      fontSize: '0.95rem',
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
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={styles.formSection}>
        <h2 style={styles.sectionTitle}>
          {initialData ? 'Edit Add-on Procedure' : 'Create Add-on Procedure'}
        </h2>

        <div style={styles.formGroup}>
          <label style={styles.label}>
            Procedure Description
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <textarea
              name="procedure_description"
              value={formData.procedure_description}
              onChange={handleChange}
              style={styles.textarea}
              placeholder="Describe the add-on procedure"
            />
            <VoiceInputButton
              listening={listeningField === 'procedure_description'}
              onClick={() => toggleListening('procedure_description')}
              ariaLabel="Voice input for procedure description"
              disabled={loading || !recognitionSupported}
            />
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>
            Plan Date <span style={styles.required}>*</span>
          </label>
          <input
            type="date"
            name="plan_date"
            value={formData.plan_date}
            onChange={handleChange}
            style={errors.plan_date ? styles.inputError : styles.input}
          />
          {errors.plan_date && (
            <span style={styles.errorMessage}>{errors.plan_date}</span>
          )}
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>
            Estimated Cost (RM) <span style={styles.required}>*</span>
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="number"
              name="estimated_cost"
              value={formData.estimated_cost}
              onChange={handleChange}
              style={errors.estimated_cost ? styles.inputError : styles.input}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
            <VoiceInputButton
              listening={listeningField === 'estimated_cost'}
              onClick={() => toggleListening('estimated_cost')}
              ariaLabel="Voice input for estimated cost"
              disabled={loading || !recognitionSupported}
            />
          </div>
          {errors.estimated_cost && (
            <span style={styles.errorMessage}>{errors.estimated_cost}</span>
          )}
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Indication for Additional Procedures</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <textarea
              name="indication_for_additional_procedures"
              value={formData.indication_for_additional_procedures}
              onChange={handleChange}
              style={styles.textarea}
              placeholder="Describe the indication for this additional procedure"
            />
            <VoiceInputButton
              listening={listeningField === 'indication_for_additional_procedures'}
              onClick={() => toggleListening('indication_for_additional_procedures')}
              ariaLabel="Voice input for indication"
              disabled={loading || !recognitionSupported}
            />
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Authorizer Remarks</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <textarea
              name="authorizer_remarks"
              value={formData.authorizer_remarks}
              onChange={handleChange}
              style={styles.textarea}
              placeholder="Remarks from the authorizer"
            />
            <VoiceInputButton
              listening={listeningField === 'authorizer_remarks'}
              onClick={() => toggleListening('authorizer_remarks')}
              ariaLabel="Voice input for authorizer remarks"
              disabled={loading || !recognitionSupported}
            />
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            style={styles.input}
          >
            <option value="Processing">Processing</option>
            <option value="Approved">Approved</option>
            <option value="Declined">Declined</option>
            <option value="Canceled">Canceled</option>
          </select>
        </div>

        {errors.Procedures_patient && (
          <span style={styles.errorMessage}>{errors.Procedures_patient}</span>
        )}

        <div style={styles.formActions}>
          <button
            type="submit"
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : styles.buttonPrimary)
            }}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            style={{ ...styles.button, ...styles.buttonSecondary }}
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}

export default AddOnProceduresForm;
