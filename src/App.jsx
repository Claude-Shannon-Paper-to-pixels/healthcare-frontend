// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AdminDashboard from './pages/AdministratorDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import StaffDashboard from './pages/StaffDashboard';
import EditPatientPage from './pages/EditPatientPage';
import PatientDisplayPage from './pages/display-petient/PatientDisplayPage';
import WardBedManagement from './pages/bedcollection/WardBedManagement';

import CreatePatientPage from './pages/forms/CreatePatientPage';
import HubDashboard from './pages/HubDashboard';

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          success: { style: { background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' } },
          error:   { style: { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' } },
        }}
      />
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
        <Route path="/staff-dashboard" element={<StaffDashboard />} />
        <Route path="/patients/create" element={<CreatePatientPage />} />
        <Route path="/patients/edit/:id" element={<EditPatientPage />} />
        <Route path="/patients/view/:id" element={<PatientDisplayPage />} />
        <Route path="/ward-management" element={<WardBedManagement />} />
        <Route path="/hub-dashboard" element={<HubDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;