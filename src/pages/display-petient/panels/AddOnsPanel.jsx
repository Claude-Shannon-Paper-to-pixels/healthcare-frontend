import AddOnProceduresForm from '../../Add_on_Procedures/AddOnProceduresForm';
import AddOnProceduresDetails from '../../Add_on_Procedures/AddOnProceduresDetails';
import DetailSection from '../DetailSection';
import '../../../components/DefermentModal.css';

function AddOnsPanel({
  addOnProcedures,
  addOnLoading,
  addOnError,
  canManageClinical,
  canChangeStatus,
  showCreateAddOn,
  setShowCreateAddOn,
  handleCreateAddOnProcedure,
  savingSection,
  patientId,
  addOnEmailStatus,
  onStatusChange,
  patient,
}) {
  return (
    <DetailSection
      title="Add-on Procedures"
      subtitle="Procedures linked to this patient"
      isEditing={false}
      onEdit={() => {}}
      showEdit={false}
    >
      {canManageClinical && !showCreateAddOn && (
        <div className="detail-actions">
          <button
            type="button"
            className="icon-button"
            onClick={() => setShowCreateAddOn(true)}
          >
            <span className="icon">+</span>
            Create Add-on Procedure
          </button>
          {addOnEmailStatus !== "idle" && (
            <div className={`def-email-status def-email-${addOnEmailStatus}`}>
              {addOnEmailStatus === "sending" && (
                <>
                  <span className="def-email-spinner" />
                  Sending email to insurance…
                </>
              )}
              {addOnEmailStatus === "sent" && (
                <>
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M20 6L9 17l-5-5"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Email sent to insurance
                </>
              )}
              {addOnEmailStatus === "failed" && (
                <>
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M18 6L6 18M6 6l12 12"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Email failed — procedure was still saved
                </>
              )}
            </div>
          )}
        </div>
      )}

      {canManageClinical && showCreateAddOn && (
        <AddOnProceduresForm
          patientId={patientId}
          onSubmit={handleCreateAddOnProcedure}
          onCancel={() => setShowCreateAddOn(false)}
          loading={savingSection === "create-add-on"}
        />
      )}

      <AddOnProceduresDetails
        procedures={addOnProcedures}
        loading={addOnLoading}
        error={addOnError}
        canManageClinical={canManageClinical}
        canChangeStatus={canChangeStatus}
        onStatusChange={onStatusChange}
        patient={patient}
      />
    </DetailSection>
  );
}

export default AddOnsPanel;
