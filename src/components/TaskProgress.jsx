function getStepStatus(step, currentStepId, stepAnswers) {
  const stepAnswer = stepAnswers.find(
    (answer) => String(answer.assignmentStepId) === String(step.id)
  );

  if (stepAnswer?.status === 'correct') {
    return 'Точно';
  }
  if (stepAnswer?.status === 'incorrect') {
    return 'Неточно';
  }
  if (stepAnswer?.status === 'answered') {
    return step.evaluationMode === 'manual' ? 'Одговорено' : 'Зачувано';
  }
  if (String(step.id) === String(currentStepId)) {
    return 'Во тек';
  }
  return 'Не е започнато';
}

function TaskProgress({ steps, currentStepId, submission }) {
  const safeSteps = Array.isArray(steps) && steps.length > 0 ? steps : [];
  const stepAnswers = Array.isArray(submission?.stepAnswers) ? submission.stepAnswers : [];
  const completedSteps = safeSteps.filter((step) =>
    stepAnswers.some((answer) => {
      if (String(answer.assignmentStepId) !== String(step.id)) {
        return false;
      }
      return ['answered', 'correct', 'incorrect'].includes(answer.status);
    })
  ).length;
  const progress =
    safeSteps.length > 0 ? Math.round((completedSteps / safeSteps.length) * 100) : 0;

  return (
    <section className="workspace-card">
      <h2 className="section-title">Тек на чекори</h2>
      <div className="progress-track" aria-hidden="true">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <ul className="list-reset flow-list">
        {safeSteps.map((step, index) => (
          <li
            key={step.id}
            className={`flow-item ${String(step.id) === String(currentStepId) ? 'current' : ''}`}
          >
            <span>
              {index + 1}. {step.title || `Чекор ${index + 1}`}
            </span>
            <span className="flow-status">
              {getStepStatus(step, currentStepId, stepAnswers)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default TaskProgress;
