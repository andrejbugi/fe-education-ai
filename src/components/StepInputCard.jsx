function StepInputCard({
  stepInput,
  onStepInputChange,
  onCheckStep,
  onHint,
  onSkip,
  isSkipDisabled,
  isInputDisabled,
}) {
  return (
    <section className="card">
      <h2 className="card-title">Enter your next step</h2>
      <form className="step-form" onSubmit={onCheckStep}>
        <input
          type="text"
          value={stepInput}
          onChange={onStepInputChange}
          placeholder="Enter your next step"
          aria-label="Enter your next step"
          disabled={isInputDisabled}
        />
        <div className="button-row">
          <button type="submit" className="btn primary-btn" disabled={isInputDisabled}>
            Check Step
          </button>
          <button type="button" className="btn secondary-btn" onClick={onHint}>
            Hint
          </button>
          <button
            type="button"
            className="btn ghost-btn"
            onClick={onSkip}
            disabled={isSkipDisabled}
            title={
              isSkipDisabled
                ? 'Skip is only available before checking this step.'
                : 'Skip this step'
            }
          >
            Skip
          </button>
        </div>
        <p className="skip-note">
          Skip is available only before you check the current step.
        </p>
      </form>
    </section>
  );
}

export default StepInputCard;
