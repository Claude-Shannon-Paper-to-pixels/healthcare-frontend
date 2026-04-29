// src/pages/AdminDashboard.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { initAuth } from '../api/auth';
import { assignBedToPatient, getPatients, updateAdmissionRecord, updatePatientInsurance } from '../api/patients';
import Navbar from '../components/Navbar';
import AssignBedModal from './bedcollection/AssignBedModal';
import AdmissionStatusModal from '../components/AdmissionStatusModal';
import IglStatusModal from '../components/IglStatusModal';
import DefermentModal from '../components/DefermentModal';
import AddOnStatusModal from '../components/AddOnStatusModal';
import IglStatusPieChart from './charts/IglStatusPieChart';
import AdmissionStatusPieChart from './charts/AdmissionStatusPieChart';
import FiltersBar from './dashboard-widgets/FiltersBar';
import VoiceWidget from './voice/VoiceWidget';
import KpiCards from './dashboard-widgets/KpiCards';

function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [initializing, setInitializing] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [selectedStatusPatient, setSelectedStatusPatient] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [iglModalOpen, setIglModalOpen] = useState(false);
  const [selectedIglPatient, setSelectedIglPatient] = useState(null);
  const [selectedInsurance, setSelectedInsurance] = useState(null);
  const [iglUpdating, setIglUpdating] = useState(false);
  const [iglError, setIglError] = useState('');
  const [defermentModalOpen, setDefermentModalOpen] = useState(false);
  const [selectedDefermentPatient, setSelectedDefermentPatient] = useState(null);
  const [selectedDefermentInsurance, setSelectedDefermentInsurance] = useState(null);
  const [defermentUpdating, setDefermentUpdating] = useState(false);
  const [uploadedFilesMap, setUploadedFilesMap] = useState(() => new Map());
  const [searchTerm, setSearchTerm] = useState('');
  const [operationDateFilter, setOperationDateFilter] = useState('');
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [expandedIglCells, setExpandedIglCells] = useState(new Set());
  // Demo-only: timestamps recorded in-session. Replace with insurance.date_modified from Directus when backend tracks this.
  const [iglStatusTimestamps, setIglStatusTimestamps] = useState(() => {
    try {
      const saved = localStorage.getItem("iglStatusTimestamps");
      return saved ? new Map(JSON.parse(saved)) : new Map();
    } catch {
      return new Map();
    }
  });
  const [addOnModalOpen, setAddOnModalOpen] = useState(false);
  const [selectedAddOnPatient, setSelectedAddOnPatient] = useState(null);

  useEffect(() => {
    const initialize = async () => {
      const authenticatedUser = await initAuth();

      if (!authenticatedUser) {
        navigate('/login');
        return;
      }

      if (authenticatedUser.role?.name !== 'Administrator') {
        navigate('/dashboard');
        return;
      }
      
      setUser(authenticatedUser);
      setInitializing(false);
    };

    initialize();
  }, [navigate]);

  useEffect(() => {
    if (!user || initializing) return;
    fetchPatients();
  }, [user, initializing]);

  const saveTimestamp = (insuranceId) => {
    setIglStatusTimestamps((prev) => {
      const next = new Map(prev);
      next.set(insuranceId, new Date().toISOString());
      localStorage.setItem("iglStatusTimestamps", JSON.stringify([...next]));
      return next;
    });
  };

  const sendTelegramNotification = async (patientName, mrn, newStatus) => {
    const BOT_TOKEN = "8768105862:AAHdryyODCWHMxm34RQEEr5iq1fuh-EsMPA"; // ← paste your token here
    const CHAT_ID = "5882947647"; // ← paste your chat id here

    const message =
      `🏥 *IGL Status Updated*\n` +
      `👤 Patient: ${patientName}\n` +
      `🪪 MRN: ${mrn || "N/A"}\n` +
      `📋 New Status: ${newStatus}\n` +
      `🕐 Time: ${new Date().toLocaleString("en-GB")}`;

    try {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message,
          parse_mode: "Markdown",
        }),
      });
    } catch (err) {
      console.error("Telegram notification failed:", err);
    }
  };

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const data = await getPatients();
      setPatients(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAssign = (patient) => {
    setSelectedPatient(patient);
    setAssignError('');
    setAssignModalOpen(true);
  };

  const handleOpenStatus = (patient, admission) => {
    if (!admission?.id) return;
    setSelectedStatusPatient(patient);
    setSelectedAdmission(admission);
    setStatusError('');
    setStatusModalOpen(true);
  };

  const handleStatusSave = async (newStatus) => {
    if (!selectedAdmission?.id) return;
    setStatusUpdating(true);
    setStatusError('');
    try {
      await updateAdmissionRecord(selectedAdmission.id, { status: newStatus });
      
      // Optimistic update - update local state without full refetch
      setPatients(prevPatients => 
        prevPatients.map(patient => {
          if (patient.id === selectedStatusPatient.id) {
            const updatedAdmissions = Array.isArray(patient.patient_Admission)
              ? patient.patient_Admission.map(adm => 
                  adm.id === selectedAdmission.id 
                    ? { ...adm, status: newStatus }
                    : adm
                )
              : patient.patient_Admission?.id === selectedAdmission.id
                ? { ...patient.patient_Admission, status: newStatus }
                : patient.patient_Admission;
            return { ...patient, patient_Admission: updatedAdmissions };
          }
          return patient;
        })
      );
      
      setStatusModalOpen(false);
      setSelectedAdmission(null);
      setSelectedStatusPatient(null);
    } catch (err) {
      setStatusError(err.message || 'Failed to update admission status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleOpenIglStatus = (patient, insurance) => {
    if (!insurance?.id) return;
    setSelectedIglPatient(patient);
    setSelectedInsurance(insurance);
    setIglError('');
    setIglModalOpen(true);
  };

  const handleIglStatusSave = async (newStatus) => {
    if (!selectedInsurance?.id) return;
    setIglUpdating(true);
    setIglError('');
    try {
      await updatePatientInsurance(selectedInsurance.id, {
        IGL_status: newStatus,
      });

      // Optimistic update - update local state without full refetch
      setPatients((prevPatients) =>
        prevPatients.map((patient) => {
          if (patient.id === selectedIglPatient.id) {
            const updatedInsurance = Array.isArray(patient.insurance)
              ? patient.insurance.map((ins) =>
                  ins.id === selectedInsurance.id
                    ? {
                        ...ins,
                        IGL_status: newStatus,
                        date_modified: new Date().toISOString(),
                      }
                    : ins,
                )
              : patient.insurance?.id === selectedInsurance.id
                ? {
                    ...patient.insurance,
                    IGL_status: newStatus,
                    date_modified: new Date().toISOString(),
                  }
                : patient.insurance;
            return { ...patient, insurance: updatedInsurance };
          }
          return patient;
        }),
      );

      saveTimestamp(selectedInsurance.id);
      // ADD THIS LINE:
      await sendTelegramNotification(
        selectedIglPatient.patient_name,
        selectedIglPatient.mrn,
        newStatus,
      );
      setIglModalOpen(false);
      setSelectedInsurance(null);
      setSelectedIglPatient(null);
    } catch (err) {
      setIglError(err.message || 'Failed to update IGL status');
    } finally {
      setIglUpdating(false);
    }
  };

  const handleOpenDeferment = (patient, insurance) => {
    if (!insurance?.id) return;
    setSelectedDefermentPatient(patient);
    setSelectedDefermentInsurance(insurance);
    setDefermentModalOpen(true);
  };

  const handleDefermentSubmit = async (file) => {
    if (!selectedDefermentInsurance?.id) return;
    setDefermentUpdating(true);
    try {
      await updatePatientInsurance(selectedDefermentInsurance.id, {
        IGL_status: "Deferment Replied",
      });
      setUploadedFilesMap((prev) => {
        const next = new Map(prev);
        next.set(selectedDefermentInsurance.id, file);
        return next;
      });
      setPatients((prevPatients) =>
        prevPatients.map((patient) => {
          if (patient.id === selectedDefermentPatient.id) {
            const updatedInsurance = Array.isArray(patient.insurance)
              ? patient.insurance.map((ins) =>
                  ins.id === selectedDefermentInsurance.id
                    ? {
                        ...ins,
                        IGL_status: "Deferment Replied",
                        date_modified: new Date().toISOString(),
                      }
                    : ins,
                )
              : patient.insurance?.id === selectedDefermentInsurance.id
                ? {
                    ...patient.insurance,
                    IGL_status: "Deferment Replied",
                    date_modified: new Date().toISOString(),
                  }
                : patient.insurance;
            return { ...patient, insurance: updatedInsurance };
          }
          return patient;
        }),
      );
      saveTimestamp(selectedDefermentInsurance.id);
      // ADD this line after saveTimestamp in handleDefermentSubmit:
      await sendTelegramNotification(
        selectedDefermentPatient.patient_name,
        selectedDefermentPatient.mrn,
        "Deferment Replied",
      );
      // Keep modal open so the user can see the email send status; update insurance state to reflect the new status
      setSelectedDefermentInsurance((prev) =>
        prev ? { ...prev, IGL_status: "Deferment Replied" } : prev,
      );
    } catch (err) {
      console.error('Failed to update deferment status:', err);
    } finally {
      setDefermentUpdating(false);
    }
  };

  const handleAssignBed = async (bed) => {
    if (!selectedPatient) return;
    setAssigning(true);
    setAssignError('');
    try {
      await assignBedToPatient(selectedPatient.id, bed.id);
      
      // Optimistic update - update local state without full refetch
      setPatients(prevPatients => 
        prevPatients.map(patient => {
          if (patient.id === selectedPatient.id) {
            return { 
              ...patient, 
              patient_bed: {
                id: bed.id,
                bed_no: bed.bed_no,
                Status: 'Booking',
                select_ward: bed.select_ward
              }
            };
          }
          return patient;
        })
      );
      
      setAssignModalOpen(false);
      setSelectedPatient(null);
    } catch (err) {
      setAssignError(err.message || 'Failed to assign bed');
    } finally {
      setAssigning(false);
    }
  };


  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (date) => {
    if (!date) return '—';
    return date.toLocaleString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const toggleIglCell = (insuranceId) => {
    setExpandedIglCells(prev => {
      const next = new Set(prev);
      if (next.has(insuranceId)) next.delete(insuranceId);
      else next.add(insuranceId);
      return next;
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    const [hours, minutes] = timeString.split(':');
    if (!hours || !minutes) return timeString;
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Helper function to get the latest admission
  const getLatestAdmission = (admissions) => {
    if (!admissions || admissions.length === 0) return null;
    
    // If single admission object (Many-to-One)
    if (!Array.isArray(admissions)) return admissions;
    
    // If array of admissions (One-to-Many), get the latest
    return admissions.sort((a, b) => 
      new Date(b.admission_date) - new Date(a.admission_date)
    )[0];
  };

  // Helper function to get insurance data
  const getInsurance = (insurance) => {
    if (!insurance) return null;
    
    // If single insurance object
    if (!Array.isArray(insurance)) return insurance;
    
    // If array, get the first or active one
    return insurance[0] || null;
  };

  // Helper function to get bed data
  const getBed = (bed) => {
    if (!bed) return null;
    
    // If single bed object
    if (!Array.isArray(bed)) return bed;
    
    // If array, get the current/active bed
    return bed[0] || null;
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      // Unified search - patient name, MRN, insurance company, bed no
      if (normalizedSearch) {
        const insurance = getInsurance(patient.insurance);
        const bed = getBed(patient.patient_bed);
        const admission = getLatestAdmission(patient.patient_Admission);
        const searchTarget = [
          patient.patient_name || '',
          patient.mrn || '',
          insurance?.tpa_name || '',
          insurance?.tpa_company || '',
          bed?.bed_no || '',
          admission?.status || '',
          (insurance?.IGL_status) || ''
        ].join(' ').toLowerCase();
        if (!searchTarget.includes(normalizedSearch)) return false;
      }

      // Operation date filter
      if (operationDateFilter) {
        const admission = getLatestAdmission(patient.patient_Admission);
        if (!admission?.operation_date) return false;
        const opDate = admission.operation_date.split('T')[0];
        if (opDate !== operationDateFilter) return false;
      }

      return true;
    });
  }, [patients, normalizedSearch, operationDateFilter]);

  const iglChartData = useMemo(() => {
    const counts = { 
      Pending: 0, 
      Approved: 0, 
      Rejected: 0, 
      'Partial Approval': 0, 
      'Under Review': 0, 
      Cancelled: 0 
    };
    filteredPatients.forEach((patient) => {
      const insurance = getInsurance(patient.insurance);
      const status = (insurance?.IGL_status || '').toLowerCase();
      if (status.includes('reject')) counts.Rejected += 1;
      else if (status.includes('partial')) counts['Partial Approval'] += 1;
      else if (status.includes('review')) counts['Under Review'] += 1;
      else if (status.includes('cancel')) counts.Cancelled += 1;
      else if (status.includes('approve')) counts.Approved += 1;
      else counts.Pending += 1;
    });
    return [
      { name: 'Pending', value: counts.Pending },
      { name: 'Approved', value: counts.Approved },
      { name: 'Rejected', value: counts.Rejected },
      { name: 'Partial Approval', value: counts['Partial Approval'] },
      { name: 'Under Review', value: counts['Under Review'] },
      { name: 'Cancelled', value: counts.Cancelled }
    ];
  }, [filteredPatients]);

  const admissionChartData = useMemo(() => {
    const counts = {};
    filteredPatients.forEach((patient) => {
      const admission = getLatestAdmission(patient.patient_Admission);
      const rawStatus = admission?.status;
      const status = (typeof rawStatus === 'string' ? rawStatus.trim() : (rawStatus || 'Unknown'));
      counts[status] = (counts[status] || 0) + 1;
    });

    console.debug('Admin dashboard - admission status raw counts:', counts);

    const preferredOrder = [
      'Admission Pending',
      'Admitted',
      'Discharge Pending',
      'Today Discharged',
      'KIV Discharged',
      'Tomorrow Discharge'
    ];

    const result = [];
    preferredOrder.forEach((name) => {
      if (counts[name]) {
        result.push({ name, value: counts[name] });
        delete counts[name];
      }
    });
    Object.keys(counts).forEach((name) => result.push({ name, value: counts[name] }));

    console.debug('Admin dashboard - admission chart data prepared:', result);
    return result;
  }, [filteredPatients]);

  const kpiData = useMemo(() => {
    const pendingCount = filteredPatients.filter((patient) => {
      const admission = getLatestAdmission(patient.patient_Admission);
      return (admission?.status || '').toLowerCase().includes('pending');
    }).length;

    const admittedCount = filteredPatients.filter((patient) => {
      const admission = getLatestAdmission(patient.patient_Admission);
      return (admission?.status || '').toLowerCase().includes('admitted');
    }).length;

    const iglApproved = filteredPatients.filter((patient) => {
      const insurance = getInsurance(patient.insurance);
      const status = (insurance?.IGL_status || '').toLowerCase();
      return status.includes('approve');
    }).length;

    return [
      { label: 'Number of Patients', value: filteredPatients.length },
      { label: 'IGL Approved', value: iglApproved },
      { label: 'Total Admitted', value: admittedCount },
      { label: 'Total Admission Pending', value: pendingCount }
    ];
  }, [filteredPatients]);

  const handleOpenAddOnModal = (patient) => {
    setSelectedAddOnPatient(patient);
    setAddOnModalOpen(true);
  };

  if (!user || initializing) return <div className="loading">Loading...</div>;

  return (
    <div>
      <Navbar user={user} />
      
      <div className="page-container">
        <div className="page-header">
          <h1>Administrator Dashboard</h1>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => navigate('/patients/create')} 
              className="btn-primary"
            >
              + Create New Patient
            </button>
            <button
              onClick={() => navigate('/ward-management')}
              className="btn-secondary"
            >
              Ward & Bed Management
            </button>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <KpiCards items={kpiData} />

        <div className="dashboard-charts">
          <IglStatusPieChart data={iglChartData} />
          <AdmissionStatusPieChart data={admissionChartData} />
        </div>

        <FiltersBar 
          searchTerm={searchTerm} 
          onSearchChange={setSearchTerm} 
          operationDateFilter={operationDateFilter}
          onOperationDateChange={setOperationDateFilter}
          voiceWidget={<VoiceWidget />}
        />

        {loading ? (
          <div className="loading">Loading patients...</div>
        ) : (
          <div className="table-container dashboard-table-container">
            <div className="table-info">
              <span>Showing {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''}</span>
            </div>
            <table className="data-table dashboard-table">
              <thead>
                <tr>
                  <th className="th-expand"></th>
                  <th className="sticky-col">Patient Name</th>
                  <th>GL Service</th>
                  <th>MRN</th>
                  <th>Insurance</th>
                  <th>Bed</th>
                  <th>Admission Status</th>
                  <th>IGL Status</th>
                  <th>Add-on Status</th>
                  <th>Operation Date</th>
                  <th>Doctor</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan="12" className="text-center">
                      No patients found.
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map((patient) => {
                    const admission = getLatestAdmission(patient.patient_Admission);
                    // console.log(patient.patient_Admission)
                    const insurance = getInsurance(patient.insurance);
                    console.log(insurance)
                    const bed = getBed(patient.patient_bed);
                    // Display tpa_name when available; otherwise show 'Self-Pay'
                    const insuranceLabel = insurance?.tpa_name || 'Self-Pay';
                    const canAssignBed = admission?.status === 'Admission Pending';
                    const isExpanded = expandedRows.has(patient.id);

                    return (
                      <React.Fragment key={patient.id}>
                        <tr className={isExpanded ? "row-expanded" : ""}>
                          <td className="td-expand">
                            <button
                              type="button"
                              className={`expand-btn${isExpanded ? " expanded" : ""}`}
                              onClick={() => {
                                const newExpanded = new Set(expandedRows);
                                if (isExpanded) {
                                  newExpanded.delete(patient.id);
                                } else {
                                  newExpanded.add(patient.id);
                                }
                                setExpandedRows(newExpanded);
                              }}
                              title={isExpanded ? "Collapse" : "Expand"}
                              aria-expanded={isExpanded}
                            >
                              <svg
                                className={`expand-icon ${isExpanded ? "rotated" : ""}`}
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                aria-hidden
                              >
                                <path
                                  d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"
                                  fill="currentColor"
                                />
                              </svg>
                            </button>
                          </td>
                          <td className="sticky-col">
                            <span
                              className="patient-name"
                              title={patient.patient_name}
                            >
                              <strong>{patient.patient_name}</strong>
                            </span>
                          </td>
                          <td>
                            {admission?.gl_service === 'in_patient' && (
                              <span className="status-badge status-Admitted">In Patient</span>
                            )}
                            {admission?.gl_service === 'out_patient' && (
                              <span className="status-badge status-KIV-Discharged">Out Patient</span>
                            )}
                            {!admission?.gl_service && <span>N/A</span>}
                          </td>
                          <td className="td-mrn">{patient.mrn}</td>
                          <td className="td-insurance">{insuranceLabel}</td>
                          <td>
                            <div className="bed-cell">
                              <button
                                type="button"
                                onClick={() => handleOpenAssign(patient)}
                                disabled={!canAssignBed || assigning}
                                className={`bed-link${canAssignBed ? "" : " disabled"}`}
                                title={
                                  canAssignBed
                                    ? "Assign bed"
                                    : "Admission must be Pending"
                                }
                              >
                                {bed?.bed_no || "Assign"}
                              </button>
                            </div>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="status-button"
                              onClick={() =>
                                handleOpenStatus(patient, admission)
                              }
                              disabled={!admission?.id || statusUpdating}
                            >
                              <span
                                className={`status-badge status-${(admission?.status || "unknown").replace(/\s+/g, "-")}`}
                              >
                                {admission?.status || "N/A"}
                              </span>
                            </button>
                          </td>
                          <td>
                            <div className="igl-cell-v2">
                              <div className="igl-cell-header">
                                <button
                                  type="button"
                                  className="status-button igl-status-btn"
                                  onClick={() =>
                                    handleOpenIglStatus(patient, insurance)
                                  }
                                  disabled={!insurance?.id || iglUpdating}
                                >
                                  <span
                                    className={`igl-badge ${(insurance?.IGL_status || "").toLowerCase().replace(/\s+/g, "-")}`}
                                  >
                                    {insurance?.IGL_status || "N/A"}
                                  </span>
                                  {iglStatusTimestamps.get(insurance?.id) && (
                                    <span className="igl-status-time">
                                      <svg
                                        width="10"
                                        height="10"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                        aria-hidden="true"
                                      >
                                        <circle
                                          cx="12"
                                          cy="12"
                                          r="10"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                        />
                                        <path
                                          d="M12 6v6l4 2"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          strokeLinecap="round"
                                        />
                                      </svg>
                                      {formatDateTime(
                                        iglStatusTimestamps.get(insurance?.id)
                                          ? new Date(
                                              iglStatusTimestamps.get(
                                                insurance?.id,
                                              ),
                                            )
                                          : null,
                                      )}
                                    </span>
                                  )}
                                </button>
                                {insurance?.id &&
                                  [
                                    "Approved",
                                    "Declined",
                                    "Deferment",
                                    "Deferment Replied",
                                  ].includes(insurance?.IGL_status) && (
                                    <button
                                      type="button"
                                      className="igl-expand-btn"
                                      onClick={() =>
                                        toggleIglCell(insurance.id)
                                      }
                                      aria-label="Toggle IGL details"
                                    >
                                      <svg
                                        className={`igl-chevron${expandedIglCells.has(insurance.id) ? " expanded" : ""}`}
                                        width="12"
                                        height="12"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                        aria-hidden="true"
                                      >
                                        <path
                                          d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"
                                          fill="currentColor"
                                        />
                                      </svg>
                                    </button>
                                  )}
                              </div>
                              {expandedIglCells.has(insurance?.id) && (
                                <div className="igl-expand-panel">
                                  <div className="igl-expand-docs">
                                    {insurance?.IGL_status === "Approved" && (
                                      <button
                                        type="button"
                                        className="igl-letter-btn igl-letter-approved"
                                        onClick={() =>
                                          window.open("/approved.pdf", "_blank")
                                        }
                                      >
                                        <svg
                                          width="11"
                                          height="11"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          xmlns="http://www.w3.org/2000/svg"
                                          aria-hidden="true"
                                        >
                                          <path
                                            d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          />
                                          <path
                                            d="M14 2v6h6M9 13h6M9 17h6M9 9h1"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                          />
                                        </svg>
                                        View GL
                                      </button>
                                    )}
                                    {insurance?.IGL_status === "Declined" && (
                                      <button
                                        type="button"
                                        className="igl-letter-btn igl-letter-declined"
                                        onClick={() =>
                                          window.open("/declined.pdf", "_blank")
                                        }
                                      >
                                        <svg
                                          width="11"
                                          height="11"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          xmlns="http://www.w3.org/2000/svg"
                                          aria-hidden="true"
                                        >
                                          <path
                                            d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          />
                                          <path
                                            d="M14 2v6h6M9 13h6M9 17h6M9 9h1"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                          />
                                        </svg>
                                        View Denial
                                      </button>
                                    )}
                                    {insurance?.IGL_status === "Deferment" && (
                                      <button
                                        type="button"
                                        className="igl-letter-btn igl-letter-deferment"
                                        onClick={() =>
                                          handleOpenDeferment(
                                            patient,
                                            insurance,
                                          )
                                        }
                                      >
                                        <svg
                                          width="11"
                                          height="11"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          xmlns="http://www.w3.org/2000/svg"
                                          aria-hidden="true"
                                        >
                                          <path
                                            d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          />
                                          <path
                                            d="M14 2v6h6M9 13h6M9 17h6M9 9h1"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                          />
                                        </svg>
                                        View Deferment
                                      </button>
                                    )}
                                    {insurance?.IGL_status ===
                                      "Deferment Replied" && (
                                      <button
                                        type="button"
                                        className="igl-letter-btn igl-letter-deferment-replied"
                                        onClick={() =>
                                          handleOpenDeferment(
                                            patient,
                                            insurance,
                                          )
                                        }
                                      >
                                        <svg
                                          width="11"
                                          height="11"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          xmlns="http://www.w3.org/2000/svg"
                                          aria-hidden="true"
                                        >
                                          <path
                                            d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          />
                                          <path
                                            d="M14 2v6h6M9 13h6M9 17h6M9 9h1"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                          />
                                        </svg>
                                        View Reply
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            {(() => {
                              const procs = Array.isArray(patient.Add_on_Procedures)
                                ? patient.Add_on_Procedures
                                : (patient.Add_on_Procedures ? [patient.Add_on_Procedures] : []);
                              if (!procs.length) return <span style={{ color: '#94a3b8' }}>—</span>;
                              return (
                                <button
                                  type="button"
                                  className="status-button"
                                  onClick={() => handleOpenAddOnModal(patient)}
                                >
                                  <span className="igl-badge under-review">
                                    {procs.length} Procedure{procs.length !== 1 ? 's' : ''}
                                  </span>
                                </button>
                              );
                            })()}
                          </td>
                          <td className="td-date">
                            {formatDate(admission?.operation_date)}
                          </td>
                          <td className="td-doctor">
                            <div className="doctor-cell">
                              {admission?.user_created?.first_name ||
                              patient.user_created?.first_name ? (
                                <>
                                  {admission?.user_created?.first_name ||
                                    patient.user_created?.first_name}{" "}
                                  {admission?.user_created?.last_name ||
                                    patient.user_created?.last_name}
                                </>
                              ) : (
                                "N/A"
                              )}
                            </div>
                          </td>
                          <td className="actions">
                            <button
                              onClick={() =>
                                navigate(`/patients/view/${patient.id}`)
                              }
                              className="btn-view"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="expanded-details-row">
                            <td colSpan="12">
                              <div className="expanded-details">
                                <div className="detail-item">
                                  <span className="detail-label">
                                    Insurance
                                  </span>
                                  <span className="detail-value">
                                    {insuranceLabel}
                                  </span>
                                </div>
                                <div className="detail-item">
                                  <span className="detail-label">
                                    Policy No
                                  </span>
                                  <span className="detail-value">
                                    {insurance?.Policy_No || "N/A"}
                                  </span>
                                </div>
                                <div className="detail-item">
                                  <span className="detail-label">
                                    IGL Number
                                  </span>
                                  <span className="detail-value">
                                    {insurance?.IGL_number || "N/A"}
                                  </span>
                                </div>
                                <div className="detail-item">
                                  <span className="detail-label">
                                    Admission Date
                                  </span>
                                  <span className="detail-value">
                                    {formatDate(admission?.admission_date)}
                                  </span>
                                </div>
                                <div className="detail-item">
                                  <span className="detail-label">
                                    Operation Time
                                  </span>
                                  <span className="detail-value">
                                    {formatTime(admission?.operation_time)}
                                  </span>
                                </div>
                                <div className="detail-item">
                                  <span className="detail-label">Ward</span>
                                  <span className="detail-value">
                                    {bed?.select_ward?.ward_name || "N/A"}
                                  </span>
                                </div>
                                <div className="detail-item">
                                  <span className="detail-label">Bed No</span>
                                  <span className="detail-value">
                                    {bed?.bed_no || "N/A"}
                                  </span>
                                </div>
                                <div className="detail-item">
                                  <span className="detail-label">
                                    Bed Status
                                  </span>
                                  <span className="detail-value">
                                    {bed?.Status || "N/A"}
                                  </span>
                                </div>
                                <div className="detail-item">
                                  <span className="detail-label">Created</span>
                                  <span className="detail-value">
                                    {formatDate(patient.date_created)}
                                  </span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AssignBedModal
        isOpen={assignModalOpen}
        patient={selectedPatient}
        onClose={() => {
          if (!assigning) {
            setAssignModalOpen(false);
            setSelectedPatient(null);
          }
        }}
        onAssign={handleAssignBed}
      />

      <AdmissionStatusModal
        isOpen={statusModalOpen}
        patient={selectedStatusPatient}
        admission={selectedAdmission}
        onClose={() => {
          if (!statusUpdating) {
            setStatusModalOpen(false);
            setSelectedAdmission(null);
            setSelectedStatusPatient(null);
          }
        }}
        onSave={handleStatusSave}
        loading={statusUpdating}
        error={statusError}
      />

      <IglStatusModal
        isOpen={iglModalOpen}
        patient={selectedIglPatient}
        insurance={selectedInsurance}
        onClose={() => {
          if (!iglUpdating) {
            setIglModalOpen(false);
            setSelectedInsurance(null);
            setSelectedIglPatient(null);
          }
        }}
        onSave={handleIglStatusSave}
        loading={iglUpdating}
        error={iglError}
      />

      <DefermentModal
        isOpen={defermentModalOpen}
        patient={selectedDefermentPatient}
        insurance={selectedDefermentInsurance}
        uploadedFile={selectedDefermentInsurance ? uploadedFilesMap.get(selectedDefermentInsurance.id) : null}
        onClose={() => {
          if (!defermentUpdating) {
            setDefermentModalOpen(false);
            setSelectedDefermentInsurance(null);
            setSelectedDefermentPatient(null);
          }
        }}
        onSubmit={handleDefermentSubmit}
        loading={defermentUpdating}
      />

      <AddOnStatusModal
        isOpen={addOnModalOpen}
        patient={selectedAddOnPatient}
        procedures={
          Array.isArray(selectedAddOnPatient?.Add_on_Procedures)
            ? selectedAddOnPatient.Add_on_Procedures
            : (selectedAddOnPatient?.Add_on_Procedures ? [selectedAddOnPatient.Add_on_Procedures] : [])
        }
        onClose={() => {
          setAddOnModalOpen(false);
          setSelectedAddOnPatient(null);
        }}
      />

      {assignError && <div className="error-message">{assignError}</div>}
    </div>
  );
}

export default AdminDashboard;