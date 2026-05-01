// src/pages/CreatePatientPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { initAuth } from '../../api/auth';
import { createPatient } from '../../api/patients';
import Navbar from '../../components/Navbar';
import PatientForm from './PatientForm';
import AdmissionForm from './AdmissionForm';
import { calculateTotalFee } from '../../utils/costs';

function CreatePatientPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeStep, setActiveStep] = useState(1); // 1: Patient, 2: Admission
  const [patientDraft, setPatientDraft] = useState(null);
  const [admissionDraft, setAdmissionDraft] = useState(null);

  const handleBack = () => {
    const roleName = user?.role?.name;
    if (roleName === 'Doctor') {
      navigate('/doctor-dashboard');
    } else if (roleName === 'Administrator') {
      navigate('/admin-dashboard');
    } else if (roleName === 'Hospital Staff' || roleName === 'Hospital_staff') {
      navigate('/staff-dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  useEffect(() => {
    const initialize = async () => {
      const authenticatedUser = await initAuth();
      
      if (!authenticatedUser) {
        navigate('/login');
        return;
      }
      
      const allowedRoles = ['Doctor', 'Administrator'];
      if (!allowedRoles.includes(authenticatedUser.role?.name)) {
        toast.error('Only doctors and administrators can create patients.');
        navigate('/dashboard');
        return;
      }
      
      setUser(authenticatedUser);
    };

    initialize();
  }, [navigate]);

  // Handle patient form submission
  const handlePatientSubmit = async (patientData) => {
    setLoading(true);
    setError('');

    try {
      setPatientDraft(patientData);
      setActiveStep(2); // Move to admission form
    } catch (err) {
      console.error('Error creating patient:', err);
      setError(err.message || 'Failed to create patient');
    } finally {
      setLoading(false);
    }
  };

  // Handle admission form submission
  const handleAdmissionSubmit = async (admissionData) => {
    setLoading(true);
    setError('');

    try {
      if (!patientDraft) {
        setError('Patient details are missing. Please complete patient information first.');
        setActiveStep(1);
        return;
      }

      const { Patient, ...admissionPayload } = admissionData;
      const total_fee = calculateTotalFee(admissionPayload, []);
      const patient = await createPatient(
        { ...patientDraft, total_fee },
        admissionPayload
      );
      console.log('Patient with admission created:', patient);

      toast.success('Patient and admission created successfully.');
      navigate(`/patients/view/${patient.id}`);
    } catch (err) {
      console.error('Error creating admission:', err);
      const msg = err.message || 'Failed to create patient with admission.';
      toast.error(msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    const confirmCancel = window.confirm('Are you sure you want to cancel? All entered data will be lost.');
    if (confirmCancel) {
      navigate('/dashboard');
    }
  };

  if (!user) return <div className="loading">Loading...</div>;

  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px'
    },
    header: {
      textAlign: 'center',
      marginBottom: '30px',
      color: '#2c3e50'
    },
    stepIndicator: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '30px',
      gap: '10px'
    },
    step: {
      flex: 1,
      padding: '15px',
      textAlign: 'center',
      borderRadius: '8px',
      backgroundColor: '#e8eef5',
      fontWeight: '500',
      transition: 'all 0.3s ease',
      border: '2px solid #cbd5e0'
    },
    stepActive: {
      backgroundColor: '#3498db',
      color: 'white',
      border: '2px solid #2980b9'
    },
    stepCompleted: {
      backgroundColor: '#27ae60',
      color: 'white',
      border: '2px solid #229954'
    },
    errorBox: {
      backgroundColor: '#fadbd8',
      color: '#c0392b',
      padding: '15px',
      borderRadius: '4px',
      marginBottom: '20px'
    }
  };

  return (
    <div>
      <Navbar user={user} />
      
      <div style={styles.container}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <button
            type="button"
            onClick={handleBack}
            className="btn-secondary"
          >
            ← Back
          </button>
          <h1 style={{ ...styles.header, margin: 0 }}>Create New Patient</h1>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        {/* Step Indicator */}
        <div style={styles.stepIndicator}>
          <button
            type="button"
            onClick={() => setActiveStep(1)}
            title="Go to Step 1"
            style={{
              ...styles.step,
              ...(activeStep === 1 ? styles.stepActive : {}),
              ...(activeStep > 1 ? styles.stepCompleted : {}),
              cursor: 'pointer'
            }}
          >
            Step 1: Patient Info
          </button>

          <button
            type="button"
            onClick={() => {
              if (!patientDraft) {
                toast.error('Please complete Step 1 (Patient Info) first.');
                setActiveStep(1);
                return;
              }
              setActiveStep(2);
            }}
            title="Go to Step 2"
            style={{
              ...styles.step,
              ...(activeStep === 2 ? styles.stepActive : {}),
              ...(activeStep > 2 ? styles.stepCompleted : {}),
              cursor: 'pointer'
            }}
          >
            Step 2: Admission (Required)
          </button>
        </div>

        {/* Render appropriate form based on active step */}
        {activeStep === 1 && (
          <PatientForm
            initialData={patientDraft}
            onSubmit={handlePatientSubmit}
            onCancel={handleCancel}
            loading={loading}
          />
        )}

        {activeStep === 2 && (
          <AdmissionForm
            patientId="draft"
            initialData={admissionDraft}
            onChange={setAdmissionDraft}
            onSubmit={async (admissionData) => {
              // keep the latest draft before submitting
              setAdmissionDraft(admissionData);
              await handleAdmissionSubmit(admissionData);
            }}
            onCancel={handleCancel}
            loading={loading}
            submitLabel="Create Patient & Admission"
            loadingLabel="Creating..."
            cancelLabel="Cancel"
          />
        )}

      </div>
    </div>
  );
}

export default CreatePatientPage;