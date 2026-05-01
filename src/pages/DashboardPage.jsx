// src/pages/DashboardPage.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getUser } from '../utils/auth';

function DashboardPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const user = getUser();
    
    if (!user) {
      navigate('/login');
      return;
    }

    // Redirect based on role
    if (user.role?.name === 'Doctor') {
      navigate('/doctor-dashboard');
    } else if (user.role?.name === 'Hospital_staff' || user.role?.name === 'Hospital Staff') {
      navigate('/hub-dashboard');
    }
    else if (user.role?.name === 'Administrator') {
      navigate('/hub-dashboard');
    }else {
      toast.error('Unknown user role. Please contact your administrator.');
      navigate('/login');
    }
  }, [navigate]);

  return <div className="loading">Redirecting...</div>;
}

export default DashboardPage;
