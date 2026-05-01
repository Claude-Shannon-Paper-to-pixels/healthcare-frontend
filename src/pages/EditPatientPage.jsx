// src/pages/EditPatientPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getUser } from '../utils/auth';
import { initAuth } from '../api/auth';
import { getPatient, updatePatient } from '../api/patients';
import Navbar from '../components/Navbar';

function EditPatientPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingPatient, setFetchingPatient] = useState(true);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    patient_name: '',
    mrn: '',
    date_of_birth: '',
    NRIC: '',
    gender: '',
    contact_number: '',
    email: ''
  });

  useEffect(() => {
    const initialize = async () => {
      const authenticatedUser = await initAuth();
      
      if (!authenticatedUser) {
        navigate('/login');
        return;
      }
      
      // Allow both Doctor and Administrator to edit patients
      const allowedRoles = ['Doctor', 'Administrator'];
      if (!allowedRoles.includes(authenticatedUser.role?.name)) {
        toast.error('Only doctors and administrators can edit patients.');
        navigate('/dashboard');
        return;
      }
      
      setUser(authenticatedUser);
    };

    initialize();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchPatient = async () => {
      try {
        const patient = await getPatient(id);
        setFormData({
          patient_name: patient.patient_name || '',
          mrn: patient.mrn || '',
          date_of_birth: patient.date_of_birth || '',
          NRIC: patient.NRIC || '',
          gender: patient.gender || '',
          contact_number: patient.contact_number || '',
          email: patient.email || ''
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setFetchingPatient(false);
      }
    };

    fetchPatient();
  }, [id, user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await updatePatient(id, formData);
      toast.success('Patient updated successfully.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Failed to update patient.');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user || fetchingPatient) return <div className="loading">Loading...</div>;

  return (
    <div>
      <Navbar user={user} />
      
      <div className="page-container">
        <h1>Edit Patient</h1>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="patient-form">
          <div className="form-row">
            <div className="form-group">
              <label>Patient Name *</label>
              <input
                type="text"
                name="patient_name"
                value={formData.patient_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>MRN (Medical Record Number) *</label>
              <input
                type="text"
                name="mrn"
                value={formData.mrn}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>NRIC *</label>
              <input
                type="text"
                name="NRIC"
                value={formData.NRIC}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Date of Birth *</label>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Gender *</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Contact Number *</label>
              <input
                type="tel"
                name="contact_number"
                value={formData.contact_number}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              onClick={() => navigate('/dashboard')}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Updating...' : 'Update Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditPatientPage;