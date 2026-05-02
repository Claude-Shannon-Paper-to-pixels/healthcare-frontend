import { useState } from 'react';
import './DischargeForm.css';

const DEFAULT_STATE = {
  undertaking_letter_ref_no: '',
  discharge_timing: '',
  home_medications: '',
  final_diagnosis: '',
  cause_and_pathology: '',
  icd_code: '',
  treatment_investigation: '',
  surgical_procedures: '',
  date_of_surgery: '',
  mma_phfsr_code: '',
  recovery_complications: '',
  death_occurred: false,
  date_time_of_death: '',
  cause_of_death: ''
};

function DischargeForm({ patient, admission, initialData, onSubmit, loading, onCancel }) {
  const [form, setForm] = useState(() => {
    if (initialData) {
      return {
        ...DEFAULT_STATE,
        ...initialData,
        date_of_surgery: initialData.date_of_surgery || '',
        date_time_of_death: initialData.date_time_of_death
          ? new Date(initialData.date_time_of_death).toISOString().slice(0, 16)
          : '',
        death_occurred: Boolean(initialData.death_occurred)
      };
    }
    return {
      ...DEFAULT_STATE,
      final_diagnosis: admission?.diagnosis || '',
      date_of_surgery: admission?.operation_date || ''
    };
  });

  const [errors, setErrors] = useState({});

  const set = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.discharge_timing) newErrors.discharge_timing = 'Please select when to discharge.';
    if (form.death_occurred) {
      if (!form.date_time_of_death) newErrors.date_time_of_death = 'Date/Time of death is required.';
      if (!form.cause_of_death?.trim()) newErrors.cause_of_death = 'Cause of death is required.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      ...form,
      patient_id: patient.id,
      date_time_of_death: form.death_occurred && form.date_time_of_death ? form.date_time_of_death : null,
      cause_of_death: form.death_occurred ? form.cause_of_death : null
    });
  };

  return (
    <div className="df-wrapper">
      <div className="df-card">
        <div className="df-header">
          <h2 className="df-title">Patient Discharge Form (General PAF)</h2>
          <p className="df-subtitle">Please complete all required fields marked with *</p>
        </div>

        <div className="df-mrn-badge">
          {patient?.mrn} : {patient?.patient_name}
        </div>

        <form onSubmit={handleSubmit} className="df-body">

          {/* Row: Undertaking + Discharge timing */}
          <div className="df-row">
            <div className="df-field">
              <label className="df-label">
                Undertaking Letter Ref No <span className="df-optional">(If available)</span>
              </label>
              <div className="df-input-wrap">
                <svg className="df-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <input
                  type="text"
                  className="df-input"
                  placeholder="Enter Ref No"
                  value={form.undertaking_letter_ref_no}
                  onChange={e => set('undertaking_letter_ref_no', e.target.value)}
                />
              </div>
            </div>

            <div className="df-field">
              <label className="df-label">
                When to discharge? <span className="df-required">*</span>
              </label>
              <select
                className={`df-select${errors.discharge_timing ? ' df-error-field' : ''}`}
                value={form.discharge_timing}
                onChange={e => set('discharge_timing', e.target.value)}
              >
                <option value="">Select discharge timing</option>
                <option value="Today discharge">Today Discharge</option>
                <option value="Tomorrow discharge">Tomorrow Discharge</option>
              </select>
              {errors.discharge_timing && <span className="df-error">{errors.discharge_timing}</span>}
            </div>
          </div>

          {/* Home Medications */}
          <div className="df-field df-full">
            <label className="df-label">To Take Away Home Medications</label>
            <textarea
              className="df-textarea"
              placeholder="To Take Away Home Medications..."
              value={form.home_medications}
              onChange={e => set('home_medications', e.target.value)}
              rows={3}
            />
          </div>

          {/* Final Diagnosis */}
          <div className="df-field df-full">
            <label className="df-label">Final diagnosis</label>
            <textarea
              className="df-textarea"
              placeholder="Enter Final diagnosis..."
              value={form.final_diagnosis}
              onChange={e => set('final_diagnosis', e.target.value)}
              rows={3}
            />
          </div>

          {/* Cause and pathology */}
          <div className="df-field df-full">
            <label className="df-label">Cause and pathology of the diagnosis</label>
            <textarea
              className="df-textarea"
              placeholder="Enter Cause and pathology of the diagnosis..."
              value={form.cause_and_pathology}
              onChange={e => set('cause_and_pathology', e.target.value)}
              rows={3}
            />
          </div>

          {/* ICD Code */}
          <div className="df-field">
            <label className="df-label">ICD Code</label>
            <div className="df-input-wrap">
              <svg className="df-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <input
                type="text"
                className="df-input"
                placeholder="Enter ICD Code"
                value={form.icd_code}
                onChange={e => set('icd_code', e.target.value)}
              />
            </div>
          </div>

          {/* Treatment / Investigation */}
          <div className="df-field df-full">
            <label className="df-label">
              Treatment given / Investigation done:{' '}
              <span className="df-optional">(Please supply copy of all investigation results)</span>
            </label>
            <textarea
              className="df-textarea"
              placeholder="Enter Treatment given / Investigation done..."
              value={form.treatment_investigation}
              onChange={e => set('treatment_investigation', e.target.value)}
              rows={3}
            />
          </div>

          {/* Surgical procedures */}
          <div className="df-field df-full">
            <label className="df-label">Surgical procedures performed</label>
            <textarea
              className="df-textarea"
              placeholder="Enter Surgical procedures performed..."
              value={form.surgical_procedures}
              onChange={e => set('surgical_procedures', e.target.value)}
              rows={3}
            />
          </div>

          {/* Row: Date of surgery + MMA code */}
          <div className="df-row">
            <div className="df-field">
              <label className="df-label">Date of surgery / procedure</label>
              <input
                type="date"
                className="df-input df-date"
                value={form.date_of_surgery}
                onChange={e => set('date_of_surgery', e.target.value)}
              />
            </div>

            <div className="df-field">
              <label className="df-label">MMA code / PHFSR code</label>
              <div className="df-input-wrap">
                <svg className="df-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <input
                  type="text"
                  className="df-input"
                  placeholder="Enter Code"
                  value={form.mma_phfsr_code}
                  onChange={e => set('mma_phfsr_code', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Recovery complications */}
          <div className="df-field df-full">
            <label className="df-label">Recovery complication that arose (if any):</label>
            <textarea
              className="df-textarea"
              placeholder="Enter Recovery complication..."
              value={form.recovery_complications}
              onChange={e => set('recovery_complications', e.target.value)}
              rows={4}
            />
          </div>

          {/* Death section */}
          <div className="df-field df-full">
            <label className="df-label">
              In the case of DEATH, please advise Date/Time and Cause of death, If Yes, please provide details.
            </label>
            <div className="df-radio-group">
              <label className="df-radio-label">
                <input
                  type="radio"
                  name="death_occurred"
                  checked={form.death_occurred === true}
                  onChange={() => set('death_occurred', true)}
                />
                Yes
              </label>
              <label className="df-radio-label">
                <input
                  type="radio"
                  name="death_occurred"
                  checked={form.death_occurred === false}
                  onChange={() => set('death_occurred', false)}
                />
                No
              </label>
            </div>

            {form.death_occurred && (
              <div className="df-death-section">
                <div className="df-field">
                  <label className="df-label">Date/Time of Death</label>
                  <input
                    type="datetime-local"
                    className={`df-input df-date${errors.date_time_of_death ? ' df-error-field' : ''}`}
                    value={form.date_time_of_death}
                    onChange={e => set('date_time_of_death', e.target.value)}
                  />
                  {errors.date_time_of_death && <span className="df-error">{errors.date_time_of_death}</span>}
                </div>
                <div className="df-field df-full">
                  <label className="df-label">Please provide Cause of death</label>
                  <textarea
                    className={`df-textarea${errors.cause_of_death ? ' df-error-field' : ''}`}
                    placeholder="Describe Details..."
                    value={form.cause_of_death}
                    onChange={e => set('cause_of_death', e.target.value)}
                    rows={4}
                  />
                  {errors.cause_of_death && <span className="df-error">{errors.cause_of_death}</span>}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="df-actions">
            {onCancel && (
              <button type="button" className="df-cancel-btn" onClick={onCancel} disabled={loading}>
                Cancel
              </button>
            )}
            <button type="submit" className="df-submit-btn" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Discharge Form'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DischargeForm;
