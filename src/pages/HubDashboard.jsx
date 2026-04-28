import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { initAuth } from '../api/auth';
import Navbar from '../components/Navbar';

const OCR_URL = 'http://100.98.81.26:5173/';

const APPS = [
  {
    id: 'doctor-portal',
    icon: '🏥',
    title: 'Doctor Portal',
    description: 'Manage patients, admissions, IGL status, bed assignments, and clinical operations.',
  },
  {
    id: 'ocr-project',
    icon: '📄',
    title: 'OCR',
    description: 'Optical character recognition tools for processing medical documents and forms.',
  },
];

function HubDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const initialize = async () => {
      const authenticatedUser = await initAuth();

      if (!authenticatedUser) {
        navigate('/login');
        return;
      }

      const role = authenticatedUser.role?.name;
      if (role === 'Doctor') {
        navigate('/doctor-dashboard');
        return;
      }

      setUser(authenticatedUser);
    };

    initialize();
  }, [navigate]);

  const handleAppClick = (appId) => {
    if (appId === 'doctor-portal') {
      const role = user?.role?.name;
      if (role === 'Administrator') return navigate('/admin-dashboard');
      if (role === 'Hospital_staff' || role === 'Hospital Staff') return navigate('/staff-dashboard');
    }
    if (appId === 'ocr-project') {
      window.open(OCR_URL, '_blank', 'noopener,noreferrer');
    }
  };

  if (!user) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div>
      <Navbar user={user} />
      <div className="hub-container">
        <div className="hub-header">
          <h1>Welcome, {user.first_name}</h1>
          <p className="hub-subtitle">Select an application to continue</p>
        </div>
        <div className="hub-cards">
          {APPS.map((app) => (
            <div key={app.id} className="hub-card">
              <div className="hub-card-icon">{app.icon}</div>
              <div className="hub-card-title">{app.title}</div>
              <div className="hub-card-description">{app.description}</div>
              <button className="hub-card-btn" onClick={() => handleAppClick(app.id)}>
                Open →
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default HubDashboard;
