function Header({ subject, topic, currentStep, totalSteps, isCompleted }) {
  const progress = Math.min(100, Math.round((currentStep / totalSteps) * 100));

  return (
    <section className="card header-card">
      <div className="header-meta">
        <span>
          <strong>Subject:</strong> {subject}
        </span>
        <span>
          <strong>Topic:</strong> {topic}
        </span>
        <span>
          <strong>Progress:</strong> Step {currentStep} of {totalSteps}
          {isCompleted ? ' (Completed)' : ''}
        </span>
      </div>
      <div className="progress-track" aria-hidden="true">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
    </section>
  );
}

export default Header;
