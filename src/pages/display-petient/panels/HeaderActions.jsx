function HeaderActions({
  canManageClinical,
  admission,
  insurance,
  setActiveTab,
  setShowCreateAdmission,
  setShowCreateReferral,
  setShowCreateAddOn,
  setShowPafModal,
  handleRunAiAnalysis,
  aiAnalysisLoading
}) {
  return (
    <div className="header-actions-group">
      {canManageClinical && !admission && (
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            setActiveTab("admission");
            setShowCreateAdmission(true);
          }}
        >
          + Admission
        </button>
      )}

      {canManageClinical && (
        <>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setActiveTab("referrals");
              setShowCreateReferral(true);
            }}
          >
            + Referral
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setActiveTab("add-ons");
              setShowCreateAddOn(true);
            }}
          >
            + Add-on Procedure
          </button>
        </>
      )}

      {admission && insurance && insurance.tpa_name && (
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setShowPafModal(true)}
          disabled={!insurance}
        >
          Submit PAF
        </button>
      )}

      {/* {canManageClinical && (
        <button type="button" className="btn-secondary" onClick={handleRunAiAnalysis} disabled={aiAnalysisLoading}>
          {aiAnalysisLoading ? 'Running Predictive Claims ...' : '+ Predictive Claims'}
        </button>
      )} */}
    </div>
  );
}

export default HeaderActions;
