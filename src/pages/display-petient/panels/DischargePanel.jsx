import { useState } from 'react';
import DetailSection from '../DetailSection';
import DischargeForm from '../../Discharge/DischargeForm';
import DischargeSubmitModal from '../../GeneratePAF/DischargeSubmitModal';

function fmtDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-MY');
}

function fmtDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('en-MY', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  });
}

const ROW_STYLE = {
  display: 'flex',
  gap: 12,
  padding: '10px 0',
  borderBottom: '1px solid #f3f4f6'
};

const LABEL_STYLE = {
  minWidth: 230,
  color: '#6b7280',
  fontSize: 13,
  fontWeight: 500,
  flexShrink: 0
};

const VALUE_STYLE = {
  color: '#111827',
  fontSize: 14,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word'
};

function Row({ label, value }) {
  return (
    <div style={ROW_STYLE}>
      <div style={LABEL_STYLE}>{label}</div>
      <div style={VALUE_STYLE}>{value || '—'}</div>
    </div>
  );
}

function DischargeReadView({ discharge, onEdit, canEdit, onSubmitDischarge }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f766e' }}>Discharge Record</div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 3 }}>
            Submitted on {fmtDateTime(discharge.date_created)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {canEdit && (
            <button type="button" className="icon-button" onClick={onEdit}>
              <span className="icon">✎</span>
              Edit Discharge Form
            </button>
          )}
          <button type="button" className="btn-primary" onClick={onSubmitDischarge}>
            Submit Discharge
          </button>
        </div>
      </div>

      <Row label="When to Discharge" value={discharge.discharge_timing} />
      <Row label="Undertaking Letter Ref No" value={discharge.undertaking_letter_ref_no} />
      <Row label="Home Medications" value={discharge.home_medications} />
      <Row label="Final Diagnosis" value={discharge.final_diagnosis} />
      <Row label="Cause & Pathology of Diagnosis" value={discharge.cause_and_pathology} />
      <Row label="ICD Code" value={discharge.icd_code} />
      <Row label="Treatment / Investigation Done" value={discharge.treatment_investigation} />
      <Row label="Surgical Procedures Performed" value={discharge.surgical_procedures} />
      <Row label="Date of Surgery / Procedure" value={fmtDate(discharge.date_of_surgery)} />
      <Row label="MMA / PHFSR Code" value={discharge.mma_phfsr_code} />
      <Row label="Recovery Complications" value={discharge.recovery_complications} />
      <Row label="Death Occurred" value={discharge.death_occurred ? 'Yes' : 'No'} />
      {discharge.death_occurred && (
        <>
          <Row label="Date/Time of Death" value={fmtDateTime(discharge.date_time_of_death)} />
          <Row label="Cause of Death" value={discharge.cause_of_death} />
        </>
      )}
    </div>
  );
}

function DischargePanel({
  patient,
  admission,
  insurance,
  discharge,
  dischargeLoading,
  dischargeError,
  canEdit,
  onSubmitDischarge,
  savingSection
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [showModal, setShowModal] = useState(false);

  return (
    <DetailSection
      title="Discharge"
      subtitle="Patient discharge record and form"
      isEditing={false}
      onEdit={() => {}}
      showEdit={false}
    >
      {dischargeLoading && (
        <div style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>Loading...</div>
      )}

      {dischargeError && (
        <div style={{ padding: '12px', color: '#dc2626', background: '#fee2e2', borderRadius: 8 }}>
          {dischargeError}
        </div>
      )}

      {!dischargeLoading && !dischargeError && discharge && !isEditing && (
        <DischargeReadView
          discharge={discharge}
          onEdit={() => setIsEditing(true)}
          canEdit={canEdit}
          onSubmitDischarge={() => setShowModal(true)}
        />
      )}

      {showModal && (
        <DischargeSubmitModal
          patient={patient}
          admission={admission}
          insurance={insurance}
          discharge={discharge}
          onClose={() => setShowModal(false)}
        />
      )}

      {!dischargeLoading && !dischargeError && !discharge && !canEdit && (
        <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
          No discharge record has been submitted yet.
        </div>
      )}

      {!dischargeLoading && !dischargeError && (!discharge || isEditing) && canEdit && (
        <DischargeForm
          patient={patient}
          admission={admission}
          initialData={isEditing ? discharge : null}
          onSubmit={async (data) => {
            await onSubmitDischarge(data, discharge?.id);
            setIsEditing(false);
          }}
          onCancel={isEditing ? () => setIsEditing(false) : null}
          loading={savingSection === 'discharge'}
        />
      )}
    </DetailSection>
  );
}

export default DischargePanel;
