import StepItem from './StepItem';

function StepHistory({ steps, totalSteps }) {
  return (
    <section className="card">
      <h2 className="card-title">Steps</h2>
      {steps.length === 0 ? (
        <p className="empty-history">No solved steps yet.</p>
      ) : (
        <ol className="step-list">
          {steps.map((step) => (
            <StepItem
              key={`${step.stepNumber}-${step.status}`}
              index={step.stepNumber}
              text={step.text}
              status={step.status}
            />
          ))}
        </ol>
      )}
      <p className="history-meta">
        Completed: {steps.length}/{totalSteps} steps
      </p>
    </section>
  );
}

export default StepHistory;
