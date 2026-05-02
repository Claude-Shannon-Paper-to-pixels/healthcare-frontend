import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { initAuth } from '../../api/auth';
import { getPatient, updateAdmissionRecord, updatePatient, updatePatientInsurance } from '../../api/patients';
import { createReferralLetter } from '../../api/Referralletter';
import { createAddOnProcedure, updateAddOnProcedure } from '../../api/addOnProcedures';
import { createGLTrackingEntry } from '../../api/glTracking';
import { createDischargeRecord, updateDischargeRecord } from '../../api/discharge';
import { sendAddOnEmail } from '../../utils/sendAddOnEmail';
import { isAdmin, isDoctor, isStaff } from '../../utils/auth';
import directus from '../../api/directus';
import { createItem } from '@directus/sdk';
import Navbar from '../../components/Navbar';
import usePatient from '../../hooks/usePatient';
import useReferralLetters from '../../hooks/useReferralLetters';
import useAddOnProcedures from '../../hooks/useAddOnProcedures';
import useGLTracking from '../../hooks/useGLTracking';
import useDischarge from '../../hooks/useDischarge';
import HeaderActions from './panels/HeaderActions';
import OverviewPanel from './panels/OverviewPanel';
import AdmissionPanel from './panels/AdmissionPanel';
import InsurancePanel from './panels/InsurancePanel';
import ReferralsPanel from './panels/ReferralsPanel';
import AddOnsPanel from './panels/AddOnsPanel';
import GLTrackingPanel from './panels/GLTrackingPanel';
import DischargePanel from './panels/DischargePanel';
import PatientHeader from './PatientHeader';
import SectionTabs from './SectionTabs';
import SectionSearch from './SectionSearch';
import PatientLoading from './PatientLoading';
import DetailGrid from './DetailGrid';
import DetailSection from './DetailSection';
import PatientSummaryCard from './PatientSummaryCard';
import { calculateTotalFee } from '../../utils/costs';
import { analyzeClaimRisk } from '../../ai-analysis/analyzeClaimRisk';
import AiAnalysisModal from '../../ai-analysis/AiAnalysisModal';
import GeneratePafModal from '../GeneratePAF/GeneratePafModal';
import './displayPatient.css';

function PatientDisplayPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [savingSection, setSavingSection] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [showCreateAdmission, setShowCreateAdmission] = useState(false);
  const [showCreateInsurance, setShowCreateInsurance] = useState(false);
  const [showAllAdmissionFields, setShowAllAdmissionFields] = useState(false);
  const [showCreateReferral, setShowCreateReferral] = useState(false);
  const [showCreateAddOn, setShowCreateAddOn] = useState(false);
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);
  const [aiAnalysisError, setAiAnalysisError] = useState('');
  const [aiAnalysisData, setAiAnalysisData] = useState(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showPafModal, setShowPafModal] = useState(false);
  const [activeTab, setActiveTab] = useState(location.state?.initialTab || 'overview');
  const [patientSearch, setPatientSearch] = useState('');
  const [admissionSearch, setAdmissionSearch] = useState('');
  const [insuranceSearch, setInsuranceSearch] = useState('');
  const [showAdvancedAdmission, setShowAdvancedAdmission] = useState(false);
  const {
    patient,
    loading,
    error: patientError,
    refresh: refreshPatient
  } = usePatient(id, Boolean(user));
  const {
    letters: referralLetters,
    loading: referralLoading,
    error: referralError,
    refresh: refreshReferralLetters,
    setError: setReferralError
  } = useReferralLetters(id, Boolean(user));
  const {
    procedures: addOnProcedures,
    loading: addOnLoading,
    error: addOnError,
    refresh: refreshAddOnProcedures,
    setError: setAddOnError
  } = useAddOnProcedures(id, Boolean(user));

  const {
    entries: glEntries,
    loading: glLoading,
    error: glError,
    refresh: refreshGLTracking
  } = useGLTracking(id, Boolean(user));

  const {
    discharge,
    loading: dischargeLoading,
    error: dischargeError,
    refresh: refreshDischarge
  } = useDischarge(id, Boolean(user));

  const [addOnEmailStatus, setAddOnEmailStatus] = useState('idle'); // 'idle' | 'sending' | 'sent' | 'failed'

  // Local page error state (separate from hook-provided errors)
  const [error, setError] = useState('');

  useEffect(() => {
    const initialize = async () => {
      const authenticatedUser = await initAuth();
      if (!authenticatedUser) {
        navigate('/login');
        return;
      }
      setUser(authenticatedUser);
    };

    initialize();
  }, [navigate]);

  const handleBack = () => {
    if (isAdmin()) navigate('/admin-dashboard');
    else if (isDoctor()) navigate('/doctor-dashboard');
    else if (isStaff()) navigate('/staff-dashboard');
    else navigate('/dashboard');
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString();
  };

  const normalizeDateInput = (dateValue) => {
    if (!dateValue) return '';
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === '') return 'N/A';
    const amount = Number(value);
    if (!Number.isFinite(amount)) return 'N/A';
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 2
    }).format(amount);
  };


  const getLatestAdmission = (admissions) => {
    if (!admissions) return null;
    if (!Array.isArray(admissions)) return admissions;
    if (admissions.length === 0) return null;
    return admissions
      .filter((item) => item)
      .sort((a, b) => new Date(b.admission_date) - new Date(a.admission_date))[0];
  };

  const getInsurance = (insurance) => {
    if (!insurance) return null;
    if (!Array.isArray(insurance)) return insurance;
    return insurance[0] || null;
  };

  const admission = useMemo(
    () => getLatestAdmission(patient?.patient_Admission),
    [patient]
  );
  const insurance = useMemo(
    () => getInsurance(patient?.insurance),
    [patient]
  );

  const requiresInsurance = admission?.financial_class === 'Guarantee Letter';

  useEffect(() => {
    setShowCreateAdmission(!admission);
  }, [admission]);

  useEffect(() => {
    setShowCreateInsurance(!insurance && requiresInsurance);
  }, [insurance, requiresInsurance]);

  // Fix auto-created insurance stubs: backend creates with Directus default 'Pending',
  // but it should be Not_submitted until PAF is submitted.
  useEffect(() => {
    if (!user || !insurance?.id || !admission) return;
    if (admission.financial_class !== 'Guarantee Letter') return;
    if (insurance.IGL_status === 'Not_submitted' || insurance.tpa_name) return;
    updatePatientInsurance(insurance.id, { IGL_status: 'Not_submitted' })
      .then(async () => {
        await createGLTrackingEntry({
          gl_category: 'IGL',
          amount: insurance.estimated_cost ?? null,
          status: 'Not_submitted',
          patient: id,
          insurance: insurance.id,
        });
        await refreshPatient();
        await refreshGLTracking();
      })
      .catch(() => {});
  }, [insurance?.id, insurance?.IGL_status, admission?.financial_class, user]);

  const admissionInitialData = useMemo(() => {
    if (!admission) return null;
    return {
      ...admission,
      admission_date: normalizeDateInput(admission.admission_date),
      operation_date: normalizeDateInput(admission.operation_date),
      discharge_date: normalizeDateInput(admission.discharge_date),
      urgent_investigations: Array.isArray(admission.urgent_investigations)
        ? admission.urgent_investigations
        : [],
      endoscopy_procedures: Array.isArray(admission.endoscopy_procedures)
        ? admission.endoscopy_procedures
        : [],
      confirmation_of: Array.isArray(admission.confirmation_of)
        ? admission.confirmation_of
        : []
    };
  }, [admission]);

  const insuranceInitialData = useMemo(() => {
    if (!insurance) return null;
    return {
      ...insurance,
      accident_date: normalizeDateInput(insurance.accident_date),
      illness_symptoms_first_appeared_on_date: normalizeDateInput(
        insurance.illness_symptoms_first_appeared_on_date
      ),
      date_first_consulted: normalizeDateInput(insurance.date_first_consulted),
      date: normalizeDateInput(insurance.date),
      date1: normalizeDateInput(insurance.date1),
      date2: normalizeDateInput(insurance.date2),
      condition_related_to: Array.isArray(insurance.condition_related_to)
        ? insurance.condition_related_to
        : []
    };
  }, [insurance]);



  const admissionSections = useMemo(() => {
    if (!admission) return [];
    return [
      {
        title: 'Admission Basics',
        items: [
          { label: 'Status', value: admission.status },
          { label: 'Admission Category', value: admission.admission_category },
          { label: 'Admission Date', value: formatDate(admission.admission_date) },
          { label: 'Admission Time', value: admission.admission_time },
          { label: 'Admission To', value: admission.admission_to },
          { label: 'Type of Accommodation', value: admission.type_of_accommodation },
          { label: 'Financial Class', value: admission.financial_class },
          { label: 'Diagnosis', value: admission.diagnosis }
        ]
      },
      {
        title: 'Operation Details',
        items: [
          { label: 'Operation Date', value: formatDate(admission.operation_date) },
          { label: 'Operation Time', value: admission.operation_time },
          { label: 'Type of Operation / Procedure', value: admission.type_of_operation_or_procedure },
          { label: 'Surgery Duration', value: admission.Surgery_Duration }
        ]
      },
      {
        title: 'Investigations & Procedures',
        advanced: true,
        items: [
          { label: 'Urgent Investigations', value: admission.urgent_investigations },
          { label: 'Other Investigation', value: admission.other_investigation },
          { label: 'Endoscopy Procedures', value: admission.endoscopy_procedures },
          { label: 'Sedation / Anesthesia', value: admission.Sedation_and_Anesthesia },
          { label: 'Other Endoscopy Procedures', value: admission.other_endoscopy_procedures }
        ]
      },
      {
        title: 'Care Instructions',
        advanced: true,
        items: [
          { label: 'Instructions to Ward Staff', value: admission.instructions_to_ward_staff },
          { label: 'Additional Notes / Risks', value: admission.Additional_Information_and_Individual_Risks },
          { label: 'Confirmation Of', value: admission.confirmation_of }
        ]
      },
      {
        title: 'Cost & Stay',
        items: [
          { label: 'Expected Days of Stay', value: admission.expected_days_of_stay },
          { label: 'Estimated Cost (RM)', value: admission.estimated_cost_RM }
        ]
      },
      {
        title: 'Discharge',
        advanced: true,
        items: [
          { label: 'Discharge Date', value: formatDate(admission.discharge_date) },
          { label: 'Discharge Time', value: admission.discharge_time }
        ]
      }
    ];
  }, [admission]);

  const insuranceSections = useMemo(() => {
    if (!insurance) return [];

    // Helper to filter out empty fields
    const filterItems = (items) => items.filter(
      (item) => {
        // If value is a React element, always show (for grouped/conditional fields)
        if (typeof item.value === 'object' && item.value !== null && !Array.isArray(item.value)) return true;
        // If value is array, show if not empty
        if (Array.isArray(item.value)) return item.value.length > 0;
        // Show if value is not null, undefined, empty string, or 'N/A'
        return item.value !== null && item.value !== undefined && item.value !== '' && item.value !== 'N/A';
      }
    );

    // Admission Information: add accident fields if needed
    const admissionInfoItems = filterItems([
      { label: 'ADMISSION REASON', value: insurance.admission_reason },
      { label: 'ILLNESS SYMPTOMS FIRST APPEARED ON DATE', value: formatDate(insurance.illness_symptoms_first_appeared_on_date) },
      { label: 'DOCTOR(S) CONSULTED FOR THIS ILLNESS', value: insurance.doctors_consulted_for_this_illness },
      { label: "DOCTOR'S OR CLINIC CONTACT", value: insurance.doctors_or_clinic_contact },
      ...(insurance.admission_reason && typeof insurance.admission_reason === 'string' && insurance.admission_reason.toLowerCase().includes('accident') ? [
        { label: 'ACCIDENT DATE', value: formatDate(insurance.accident_date) },
        { label: 'ACCIDENT PLACE', value: insurance.accident_place },
        { label: 'ACCIDENT TIME', value: insurance.accident_time },
        { label: 'ACCIDENT DESCRIPTION', value: insurance.accident_description },
        { label: 'ACCIDENT DETAILS', value: insurance.accident_details }
      ] : [])
    ]);

    return [
      {
        title: 'Patient Information',
        items: filterItems([
          { label: 'POLICY NO./MEMBER ID/CERTIFICATE NO./PLAN/COMPANY NAME', value: insurance.Policy_No },
          { label: 'TPA NAME', value: insurance.tpa_name },
          { label: 'EXPECTED DAYS OF STAY', value: insurance.expected_days_of_stay },
          { label: 'ESTIMATED COST (RM)', value: insurance.estimated_cost },
          { label: 'TYPE OF OPERATION/PROCEDURE', value: insurance.type_of_operation_procedures },
          { label: 'DIAGNOSIS', value: insurance.diagnosis },
          { label: 'PREGNANT ?', value: insurance.pregnant_information },
          { label: 'Pregnancy Duration', value: insurance.pregnancy_duration }
        ])
      },
      {
        title: 'Admission Information',
        items: admissionInfoItems
      },
      {
        title: 'Medical Assessment',
        items: filterItems([
          { label: 'HOW LONG IS PATIENT AWARE OF THE CONDITION?', value: insurance.how_long_is_person_aware_of_this_condition },
          { label: 'DATE FIRST CONSULTED', value: formatDate(insurance.date_first_consulted) },
          // Previous Consultation (grouped)
          {
            label: 'ANY PREVIOUS CONSULTATION?',
            value: (
              <>
                <div>{insurance.any_previous_consultaion}</div>
                {(insurance.any_previous_consultaion && (insurance.any_previous_consultaion === true || String(insurance.any_previous_consultaion).toLowerCase() === 'yes')) && (
                  <div style={{ marginTop: 6, color: '#444' }}>
                    <b>Details:</b> {insurance.details_of_previous_consultation}
                  </div>
                )}
              </>
            )
          },
          // Referral (grouped)
          {
            label: 'WAS THIS PATIENT REFERRED?',
            value: (
              <>
                <div>{insurance.was_this_patient_referred}</div>
                {(insurance.was_this_patient_referred && (insurance.was_this_patient_referred === true || String(insurance.was_this_patient_referred).toLowerCase() === 'yes')) && (
                  <div style={{ marginTop: 6, color: '#444' }}>
                    <b>Details:</b> {insurance.patient_referred_details}
                  </div>
                )}
              </>
            )
          },
          // Condition Exist Before (grouped)
          {
            label: 'CONDITION EXIST BEFORE',
            value: (
              <>
                <div>{insurance.condition_exist_before}</div>
                {(insurance.condition_exist_before && (insurance.condition_exist_before === true || String(insurance.condition_exist_before).toLowerCase() === 'yes')) && (
                  <div style={{ marginTop: 10, color: '#444' }}>
                    <b>Previous Treatment History:</b>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 10 }}>
                      {/* Entry 1 */}
                      {(insurance.date || insurance.disease_or_disorder || insurance.treatment_or_hospitalization_details || insurance.doctor_or_hospital_or_clinic) && (
                        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 16px', background: '#fafbfc' }}>
                          <div style={{ fontWeight: 600, color: '#e11d48', marginBottom: 4 }}>1. Date: {formatDate(insurance.date)}</div>
                          <div style={{ marginLeft: 8 }}>
                            <div><b>Disease/Disorder:</b> {insurance.disease_or_disorder}</div>
                            <div><b>Treatment:</b> {insurance.treatment_or_hospitalization_details}</div>
                            <div><b>Doctor/Hospital/Clinic:</b> {insurance.doctor_or_hospital_or_clinic}</div>
                          </div>
                        </div>
                      )}
                      {/* Entry 2 */}
                      {(insurance.date1 || insurance.disease_or_disorder1 || insurance.treatment_or_hospitalization_details1 || insurance.doctor_or_hospital_or_clinic1) && (
                        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 16px', background: '#fafbfc' }}>
                          <div style={{ fontWeight: 600, color: '#e11d48', marginBottom: 4 }}>2. Date: {formatDate(insurance.date1)}</div>
                          <div style={{ marginLeft: 8 }}>
                            <div><b>Disease/Disorder:</b> {insurance.disease_or_disorder1}</div>
                            <div><b>Treatment:</b> {insurance.treatment_or_hospitalization_details1}</div>
                            <div><b>Doctor/Hospital/Clinic:</b> {insurance.doctor_or_hospital_or_clinic1}</div>
                          </div>
                        </div>
                      )}
                      {/* Entry 3 */}
                      {(insurance.date2 || insurance.disease_or_disorder2 || insurance.treatment_or_hospitalization_details2 || insurance.doctor_or_hospital_or_clinic2) && (
                        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 16px', background: '#fafbfc' }}>
                          <div style={{ fontWeight: 600, color: '#e11d48', marginBottom: 4 }}>3. Date: {formatDate(insurance.date2)}</div>
                          <div style={{ marginLeft: 8 }}>
                            <div><b>Disease/Disorder:</b> {insurance.disease_or_disorder2}</div>
                            <div><b>Treatment:</b> {insurance.treatment_or_hospitalization_details2}</div>
                            <div><b>Doctor/Hospital/Clinic:</b> {insurance.doctor_or_hospital_or_clinic2}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )
          },
          // Condition Managed (show details and reason_for_admission)
          {
            label: 'CONDITION BE MANAGED',
            value: (
              <>
                <div>{insurance.condition_be_managed}</div>
                <div style={{ marginTop: 6, color: '#444' }}>
                  <b>Reason for Admission:</b> {insurance.reason_for_admission}
                </div>
                {(insurance.can_be_managed && (insurance.can_be_managed === false || String(insurance.can_be_managed).toLowerCase() === 'no')) && (
                  <div style={{ marginTop: 6, color: '#444' }}>
                    <b>Details:</b> {insurance.can_be_managed_details}
                  </div>
                )}
              </>
            )
          }
        ])
      },
      {
        title: 'Diagnosis Information',
        items: [
          {
            label: '',
            value: (
              <div className="diagnosis-info-section" style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
                {/* Left: DIAGNOSIS TYPE */}
                <div className="diagnosis-card" style={{ flex: '1 1 320px', minWidth: 320, background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px #e5e7eb', padding: 18, marginBottom: 18 }}>
                  <div style={{ color: '#e11d48', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>DIAGNOSIS TYPE</div>
                  {/* Provisional Diagnosis */}
                  {(insurance.provisional_diagnosis || insurance.diagnosis_information === 'Provisional') && (
                    <div style={{ marginBottom: 18 }}>
                      <div style={{ fontWeight: 600, color: '#222', marginBottom: 4 }}>Provisional Diagnosis</div>
                      {insurance.provisional_diagnosis && <div style={{ marginBottom: 8 }}><b>Diagnosis:</b><br/><span style={{ marginLeft: 12 }}>{insurance.provisional_diagnosis}</span></div>}
                      {insurance.diagnosis_confirmed && <div style={{ marginBottom: 8 }}><b>Confirmed Date:</b><br/><span style={{ marginLeft: 12 }}>{formatDate(insurance.diagnosis_confirmed)}</span></div>}
                      {insurance.advised_patient && <div style={{ marginBottom: 8 }}><b>Advised Date:</b><br/><span style={{ marginLeft: 12 }}>{formatDate(insurance.advised_patient)}</span></div>}
                      {insurance.cause_and_pathology && <div style={{ marginBottom: 8 }}><b>Cause/Pathology:</b><br/><span style={{ marginLeft: 12 }}>{insurance.cause_and_pathology}</span></div>}
                      {insurance.any_possibility_of_relapse && <div><b>Relapse Possibility:</b><br/><span style={{ marginLeft: 12 }}>{insurance.any_possibility_of_relapse}</span></div>}
                    </div>
                  )}
                  {/* Admitting Diagnosis */}
                  {(insurance.admitting_diagnosis || insurance.diagnosis_information === 'Admitting') && (
                    <div>
                      <div style={{ fontWeight: 600, color: '#222', marginBottom: 4 }}>Admitting Diagnosis</div>
                      {insurance.admitting_diagnosis && <div style={{ marginBottom: 8 }}><b>Diagnosis:</b><br/><span style={{ marginLeft: 12 }}>{insurance.admitting_diagnosis}</span></div>}
                      {insurance.admitting_diagnosis_confirmed && <div style={{ marginBottom: 8 }}><b>Confirmed Date:</b><br/><span style={{ marginLeft: 12 }}>{formatDate(insurance.admitting_diagnosis_confirmed)}</span></div>}
                      {insurance.admitting_diagnosis_advised_patien && <div style={{ marginBottom: 8 }}><b>Advised Date:</b><br/><span style={{ marginLeft: 12 }}>{formatDate(insurance.admitting_diagnosis_advised_patien)}</span></div>}
                      {insurance.admitting_diagnosis_cause_and_pathology && <div style={{ marginBottom: 8 }}><b>Cause/Pathology:</b><br/><span style={{ marginLeft: 12 }}>{insurance.admitting_diagnosis_cause_and_pathology}</span></div>}
                      {insurance.admitting_diagnosisany_possibility_of_relapse && <div><b>Relapse Possibility:</b><br/><span style={{ marginLeft: 12 }}>{insurance.admitting_diagnosisany_possibility_of_relapse}</span></div>}
                    </div>
                  )}
                </div>
                {/* Right: CONDITION RELATED TO */}
                {((Array.isArray(insurance.condition_related_to) && insurance.condition_related_to.length > 0) || (typeof insurance.condition_related_to === 'string' && insurance.condition_related_to)) && (
                  <div className="diagnosis-card" style={{ flex: '1 1 320px', minWidth: 320, background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px #e5e7eb', padding: 18, marginBottom: 18, border: '2px solid #e11d48' }}>
                    <div style={{ color: '#e11d48', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>CONDITION RELATED TO</div>
                    <ul style={{ margin: 0, paddingLeft: 24, paddingTop: 4, paddingBottom: 4 }}>
                      {(Array.isArray(insurance.condition_related_to)
                        ? insurance.condition_related_to
                        : insurance.condition_related_to.split(/[,/]/)
                      )
                        .map((item, idx) => item && item.trim() && (
                          <li key={idx} style={{ marginBottom: 6, lineHeight: 1.6 }}>{item.trim()}</li>
                        ))}
                    </ul>
                  </div>
                )}
                {/* Bottom: ANY OTHER CONDITIONS PRESENT? (as two side-by-side groups) */}
                {(insurance.need_to_add_others_copy || insurance.Condition_1 || insurance.Condition_2 || insurance.need_to_add_others) && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginBottom: 0 }}>
                    {/* Group 1: Any other medical/surgical conditions present? */}
                    {(insurance.need_to_add_others_copy || insurance.Condition_1 || insurance.Condition_2) && (
                      <div className="diagnosis-card" style={{ flex: '1 1 340px', minWidth: 320, background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px #e5e7eb', padding: 18 }}>
                        <div style={{ color: '#e11d48', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
                          Any other medical/surgical conditions present?
                        </div>
                        {insurance.need_to_add_others_copy && <div>{insurance.need_to_add_others_copy}</div>}
                        <div style={{ marginTop: 8 }}>
                          <b>Condition Details:</b>
                          <div style={{ marginLeft: 12 }}>
                            {insurance.Condition_1 && (<><span>1. Condition: {insurance.Condition_1}</span><br/>&nbsp;&nbsp;Since: {formatDate(insurance.since)}<br/></>)}
                            {insurance.Condition_2 && (<><span>2. Condition: {insurance.Condition_2}</span><br/>&nbsp;&nbsp;Since: {formatDate(insurance.since_copy)}</>)}
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Group 2: Are there any other conditions to add? */}
                    {insurance.need_to_add_others && (
                      <div className="diagnosis-card" style={{ flex: '1 1 340px', minWidth: 320, background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px #e5e7eb', padding: 18 }}>
                        <div style={{ color: '#e11d48', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
                          Are there any other conditions to add?
                        </div>
                        <div><b>Other Condition Present?</b> <span>{insurance.need_to_add_others}</span></div>
                        {(insurance.need_to_add_others === true || String(insurance.need_to_add_others).toLowerCase() === 'yes') && (
                          <div style={{ marginTop: 8, marginLeft: 12 }}>
                            <b>Please provide the other condition details.</b>
                            <div style={{ marginTop: 4 }}>{insurance.others}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          }
        ]
      },
      {
        title: 'Clinical Assessment',
        items: filterItems([
          { label: 'Blood Pressure', value: insurance.blood_pressure },
          { label: 'Temperature', value: insurance.temperature },
          { label: 'Pulse', value: insurance.pulse }
        ])
      },
      {
        title: 'Other Details',
        items: filterItems([
          { label: 'IGL STATUS', value: insurance.IGL_status },
          { label: 'IGL NUMBER', value: insurance.IGL_number },
        ])
      }
    ];
  }, [insurance]);





  const syncTotalFee = async (admissionData) => {
    if (!admissionData) return;
    const total_fee = calculateTotalFee(admissionData);
    try {
      await updatePatient(id, { total_fee });
    } catch (err) {
      console.error('Update total fee error:', err);
    }
  };

  const handleRunAiAnalysis = async () => {
    if (!patient) return;
    setShowAiModal(true);
    setAiAnalysisLoading(true);
    setAiAnalysisError('');
    setAiAnalysisData(null);

    console.log('Starting Predictive Claims ...');
    console.log('Endpoint:', import.meta.env.VITE_AI_ANALYSIS_URL);

    try {
      const { formatted, raw } = await analyzeClaimRisk({
        patient,
        admission,
        insurance,
        procedures: addOnProcedures
      });

      console.log('Predictive Claims  completed:', { formatted, raw });

      if (!formatted && !raw) {
        throw new Error('Predictive Claims  returned an empty response.');
      }

      setAiAnalysisData(raw);
    } catch (err) {
      console.error('Predictive Claims  error:', err);
      setAiAnalysisError(err.message || 'Failed to run Predictive Claims .');
    } finally {
      setAiAnalysisLoading(false);
    }
  };

  const handlePatientSubmit = async (formData) => {
    setSavingSection('patient');
    setError('');
    try {
      await updatePatient(id, formData);
      setEditingSection(null);
      refreshPatient();
      toast.success('Patient information updated.');
    } catch (err) {
      toast.error(err.message || 'Failed to update patient.');
    } finally {
      setSavingSection(null);
    }
  };

  const handleAdmissionSubmit = async (formData) => {
    if (!admission?.id) return;
    setSavingSection('admission');
    setError('');
    try {
      const { Patient, ...payload } = formData;
      await updateAdmissionRecord(admission.id, payload);
      await syncTotalFee(payload);
      setEditingSection(null);
      refreshPatient();
      toast.success('Admission details saved.');
    } catch (err) {
      toast.error(err.message || 'Failed to save admission details.');
    } finally {
      setSavingSection(null);
    }
  };

  const handleInsuranceSubmit = async (formData) => {
    const insuranceId = insurance?.id || formData?.id;
    console.log('handleInsuranceSubmit called', { formData, insuranceId });
    if (!insuranceId) {
      console.warn('No insuranceId found; aborting update', { insurance, formData });
      setError('No insurance record found to update.');
      return;
    }
    setSavingSection('insurance');
    setError(''); // Clear any previous errors
    try {
      const { pation, ...payload } = formData;
      console.log('Updating insurance', { insuranceId, payload });
      await updatePatientInsurance(insuranceId, payload);
      console.log('Insurance update successful', { insuranceId });
      await createGLTrackingEntry({
        gl_category: 'IGL',
        amount: payload.estimated_cost ?? insurance?.estimated_cost ?? null,
        status: payload.IGL_status ?? null,
        patient: id,
        insurance: insuranceId,
      });
      await refreshGLTracking();
      setEditingSection(null);
      await refreshPatient();
      toast.success('Insurance & GL details saved.');
    } catch (err) {
      console.error('Insurance update failed', err);
      const msg = err.message || 'Failed to update insurance.';
      setError(msg);
      toast.error(msg);
    } finally {
      setSavingSection(null);
    }
  };

  const handleCreateAdmission = async (formData) => {
    setSavingSection('create-admission');
    setError('');
    try {
      await directus.request(createItem('Admission', formData));
      await syncTotalFee(formData);
      setShowCreateAdmission(false);
      await refreshPatient();
      toast.success('Admission created successfully.');

      // If Guarantee Letter, fix the backend auto-created insurance IGL status to Not_submitted
      if (formData.financial_class === 'Guarantee Letter') {
        try {
          const freshPatient = await getPatient(id);
          const autoInsurance = Array.isArray(freshPatient?.insurance)
            ? freshPatient.insurance[0]
            : freshPatient?.insurance;
          if (autoInsurance?.id && autoInsurance.IGL_status !== 'Not_submitted') {
            await updatePatientInsurance(autoInsurance.id, { IGL_status: 'Not_submitted' });
            await createGLTrackingEntry({
              gl_category: 'IGL',
              amount: autoInsurance.estimated_cost ?? null,
              status: 'Not_submitted',
              patient: id,
              insurance: autoInsurance.id,
            });
            await refreshPatient();
            await refreshGLTracking();
          }
        } catch {
          // insurance may not exist yet if backend is async — ignore silently
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create admission.');
    } finally {
      setSavingSection(null);
    }
  };

  const handleCreateInsurance = async (formData) => {
    setSavingSection('create-insurance');
    setError('');
    try {
      const insurancePayload = { ...formData, IGL_status: formData.IGL_status || 'Not_submitted' };
      const createdInsurance = await directus.request(createItem('insurance', insurancePayload));
      await createGLTrackingEntry({
        gl_category: 'IGL',
        amount: insurancePayload.estimated_cost ?? null,
        status: insurancePayload.IGL_status,
        patient: id,
        insurance: createdInsurance.id,
      });
      setShowCreateInsurance(false);
      await refreshPatient();
      await refreshGLTracking();
      toast.success('Insurance record created successfully.');
    } catch (err) {
      toast.error(err.message || 'Failed to create insurance record.');
    } finally {
      setSavingSection(null);
    }
  };

  const handleCreateReferral = async (formData) => {
    setSavingSection('create-referral');
    setReferralError('');
    try {
      await createReferralLetter(formData);
      setShowCreateReferral(false);
      await refreshReferralLetters();
      toast.success('Referral letter created.');
    } catch (err) {
      const msg = err.message || 'Failed to create referral letter.';
      setReferralError(msg);
      toast.error(msg);
    } finally {
      setSavingSection(null);
    }
  };

  const handleUpdateAddOnStatus = async (procedureId, newStatus) => {
    try {
      await updateAddOnProcedure(procedureId, { status: newStatus });
      const procedure = addOnProcedures.find((p) => p.id === procedureId);
      await createGLTrackingEntry({
        gl_category: 'Add-on procedure',
        amount: procedure?.estimated_cost ?? null,
        status: newStatus,
        patient: id,
        addon_procedure: procedureId,
      });
      await refreshAddOnProcedures();
      await refreshGLTracking();
      toast.success('Add-on procedure status updated.');
    } catch (err) {
      const msg = err.message || 'Failed to update status.';
      setAddOnError(msg);
      toast.error(msg);
    }
  };

  const handleCreateAddOnProcedure = async (formData) => {
    setSavingSection('create-add-on');
    setAddOnError('');
    try {
      const createdProcedure = await createAddOnProcedure(formData);
      await createGLTrackingEntry({
        gl_category: 'Add-on procedure',
        amount: formData.estimated_cost ?? null,
        status: formData.status || null,
        patient: id,
        addon_procedure: createdProcedure.id,
      });
      setShowCreateAddOn(false);
      await refreshAddOnProcedures();
      await refreshGLTracking();
      toast.success('Add-on procedure created.');
      setAddOnEmailStatus('sending');
      sendAddOnEmail(patient, insurance, formData)
        .then(() => setAddOnEmailStatus('sent'))
        .catch(() => setAddOnEmailStatus('failed'));
    } catch (err) {
      const msg = err.message || 'Failed to create add-on procedure.';
      setAddOnError(msg);
      toast.error(msg);
    } finally {
      setSavingSection(null);
    }
  };

  const handlePafSubmitted = async () => {
    if (insurance?.IGL_status === 'Not_submitted' && insurance?.id) {
      await updatePatientInsurance(insurance.id, { IGL_status: 'Pending' });
      await createGLTrackingEntry({
        gl_category: 'IGL',
        amount: insurance?.estimated_cost ?? null,
        status: 'Pending',
        patient: id,
        insurance: insurance.id,
      });
      await refreshGLTracking();
      await refreshPatient();
    }
  };

  const handleSubmitDischarge = async (formData, existingId) => {
    setSavingSection('discharge');
    try {
      if (existingId) {
        await updateDischargeRecord(existingId, formData);
      } else {
        await createDischargeRecord(formData);
      }
      await refreshDischarge();
      toast.success(existingId ? 'Discharge record updated.' : 'Discharge form submitted.');
    } catch (err) {
      toast.error(err.message || 'Failed to save discharge record.');
      throw err;
    } finally {
      setSavingSection(null);
    }
  };

  if (!user || loading) return <PatientLoading />;
  if (!patient) return <div className="error-message">Patient not found</div>;

  const isStaffView = isStaff();
  const canManageClinical = isAdmin() || isDoctor();
  const canChangeStatus = isAdmin();
  const summaryChips = [
    { label: 'MRN', value: patient.mrn || 'N/A' },
    { label: 'Admission', value: admission?.status || 'N/A' },
    { label: 'IGL', value: insurance?.IGL_status || 'N/A' },
    { label: 'Total Fee', value: formatCurrency(patient.total_fee) },
    {
      label: 'Updated',
      value: formatDate(patient.date_updated || patient.date_created)
    }
  ];

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'admission', label: 'Admission', hidden: false },
    { key: 'insurance', label: 'Insurance', hidden: !admission },
    { key: 'add-ons', label: 'Add-on Procedures' },
    { key: 'referrals', label: 'Referrals' },
    { key: 'discharge', label: 'Discharge' },
    { key: 'gl-tracking', label: 'GL Tracking' }
  ].filter((tab) => !tab.hidden);

  return (
    <div className="display-page">
      <Navbar user={user} />

      <div className="display-container">
        <PatientHeader
          title="Patient Profile"
          onBack={handleBack}
          chips={summaryChips}
          actions={
            <HeaderActions
              canManageClinical={canManageClinical}
              admission={admission}
              insurance={insurance}
              setActiveTab={setActiveTab}
              setShowCreateAdmission={setShowCreateAdmission}
              setShowCreateReferral={setShowCreateReferral}
              setShowCreateAddOn={setShowCreateAddOn}
              setShowPafModal={setShowPafModal}
              handleRunAiAnalysis={handleRunAiAnalysis}
              aiAnalysisLoading={aiAnalysisLoading}
            />
          }
        />

        {(error || patientError) && (
          <div className="error-message">{error || patientError}</div>
        )}

        <PatientSummaryCard
          patient={patient}
          admission={admission}
          insurance={insurance}
        />

        <SectionTabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {activeTab === "overview" && (
          <OverviewPanel
            isStaffView={isStaffView}
            patient={patient}
            admission={admission}
            insurance={insurance}
            patientSearch={patientSearch}
            setPatientSearch={setPatientSearch}
            editingSection={editingSection}
            setEditingSection={setEditingSection}
            savingSection={savingSection}
            handlePatientSubmit={handlePatientSubmit}
          />
        )}

        {activeTab === "admission" && (
          <AdmissionPanel
            admission={admission}
            patient={patient}
            canManageClinical={canManageClinical}
            showAllAdmissionFields={showAllAdmissionFields}
            setShowAllAdmissionFields={setShowAllAdmissionFields}
            showAdvancedAdmission={showAdvancedAdmission}
            // setShowAdvancedAdmission is no longer used
            admissionSearch={admissionSearch}
            setAdmissionSearch={setAdmissionSearch}
            editingSection={editingSection}
            setEditingSection={setEditingSection}
            savingSection={savingSection}
            handleAdmissionSubmit={handleAdmissionSubmit}
            showCreateAdmission={showCreateAdmission}
            setShowCreateAdmission={setShowCreateAdmission}
            handleCreateAdmission={handleCreateAdmission}
            admissionSections={admissionSections}
          />
        )}

        {activeTab === "insurance" && admission && (
          <InsurancePanel
            insurance={insurance}
            admission={admission}
            patient={patient}
            canManageClinical={canManageClinical}
            // showAdvancedInsurance is no longer used
            insuranceSearch={insuranceSearch}
            setInsuranceSearch={setInsuranceSearch}
            editingSection={editingSection}
            setEditingSection={setEditingSection}
            savingSection={savingSection}
            handleInsuranceSubmit={handleInsuranceSubmit}
            showCreateInsurance={showCreateInsurance}
            setShowCreateInsurance={setShowCreateInsurance}
            handleCreateInsurance={handleCreateInsurance}
            insuranceSections={insuranceSections}
            requiresInsurance={requiresInsurance}
          />
        )}

        {activeTab === "referrals" && (
          <ReferralsPanel
            referralLetters={referralLetters}
            referralLoading={referralLoading}
            referralError={referralError}
            canManageClinical={canManageClinical}
            showCreateReferral={showCreateReferral}
            setShowCreateReferral={setShowCreateReferral}
            handleCreateReferral={handleCreateReferral}
            savingSection={savingSection}
            patientId={patient.id}
          />
        )}

        {activeTab === "add-ons" && (
          <AddOnsPanel
            addOnProcedures={addOnProcedures}
            addOnLoading={addOnLoading}
            addOnError={addOnError}
            canManageClinical={canManageClinical}
            canChangeStatus={canChangeStatus}
            showCreateAddOn={showCreateAddOn}
            setShowCreateAddOn={(val) => {
              setShowCreateAddOn(val);
              if (val) setAddOnEmailStatus("idle");
            }}
            handleCreateAddOnProcedure={handleCreateAddOnProcedure}
            savingSection={savingSection}
            patientId={patient.id}
            addOnEmailStatus={addOnEmailStatus}
            onStatusChange={handleUpdateAddOnStatus}
            patient={patient}
          />
        )}

        {activeTab === 'discharge' && (
          <DischargePanel
            patient={patient}
            admission={admission}
            discharge={discharge}
            dischargeLoading={dischargeLoading}
            dischargeError={dischargeError}
            canEdit={isAdmin() || isStaff()}
            onSubmitDischarge={handleSubmitDischarge}
            savingSection={savingSection}
          />
        )}

        {activeTab === 'gl-tracking' && (
          <GLTrackingPanel
            entries={glEntries}
            loading={glLoading}
            error={glError}
          />
        )}

        <AiAnalysisModal
          isOpen={showAiModal}
          onClose={() => setShowAiModal(false)}
          loading={aiAnalysisLoading}
          error={aiAnalysisError}
          analysisData={aiAnalysisData}
        />

        {showPafModal && (
          <GeneratePafModal
            patient={patient}
            admission={admission}
            insurance={insurance}
            onClose={() => setShowPafModal(false)}
            onPafSubmitted={handlePafSubmitted}
          />
        )}
      </div>
    </div>
  );
}

export default PatientDisplayPage;
