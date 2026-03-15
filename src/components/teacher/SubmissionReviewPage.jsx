function getStepStatusLabel(stepAnswer) {
  if (stepAnswer?.status === 'correct') {
    return 'Точно';
  }
  if (stepAnswer?.status === 'incorrect') {
    return 'Неточно';
  }
  if (stepAnswer?.status === 'answered') {
    return 'Одговорено';
  }
  return 'Нема одговор';
}

function getEvaluationLabel(mode) {
  if (mode === 'manual') {
    return 'Потребен преглед';
  }
  if (mode === 'numeric') {
    return 'Автоматска бројчена проверка';
  }
  if (mode === 'regex') {
    return 'Автоматска проверка по образец';
  }
  if (mode === 'normalized_text') {
    return 'Автоматска проверка';
  }
  return '';
}

function SubmissionReviewPage({
  review,
  loading,
  error,
  gradeValue,
  feedbackValue,
  onGradeChange,
  onFeedbackChange,
  onSave,
  onBack,
  saving,
}) {
  if (loading) {
    return (
      <section className="dashboard-card content-card">
        <p className="empty-state">Се вчитува предавањето...</p>
      </section>
    );
  }

  if (!review) {
    return (
      <section className="dashboard-card content-card">
        <button type="button" className="back-button" onClick={onBack}>
          Назад
        </button>
        <p className="empty-state">
          {error || 'Не успеавме да го пронајдеме поднесувањето за преглед.'}
        </p>
      </section>
    );
  }

  const { student, assignment, submission } = review;
  const assignmentSteps = Array.isArray(assignment?.steps) ? assignment.steps : [];
  const stepAnswers = Array.isArray(submission?.stepAnswers) ? submission.stepAnswers : [];

  return (
    <section className="dashboard-card content-card submission-review-page">
      <div className="submission-review-header">
        <button type="button" className="back-button" onClick={onBack}>
          Назад
        </button>
        <div>
          <h1 className="section-title">Преглед на поднесување</h1>
          <p className="item-meta">
            {student?.fullName || 'Ученик'}
            {assignment?.classroomName ? ` · ${assignment.classroomName}` : ''}
          </p>
          <p className="item-meta">{assignment?.title || 'Задача'}</p>
          <p className="item-meta">
            Статус: {submission?.statusLabel || submission?.status || 'Нема податок'}
            {submission?.submittedAt ? ` · Поднесено: ${submission.submittedAt}` : ''}
          </p>
        </div>
      </div>

      <div className="submission-review-grid">
        <section className="dashboard-card content-card">
          <h2 className="section-title teacher-subtitle">Одговори по чекор</h2>
          {assignmentSteps.length === 0 ? (
            <p className="empty-state">Нема чекори за оваа задача.</p>
          ) : (
            <div className="submission-step-list">
              {assignmentSteps.map((step, index) => {
                const stepAnswer = stepAnswers.find(
                  (item) => String(item.assignmentStepId) === String(step.id)
                );

                return (
                  <article key={String(step.id || index)} className="teacher-assignment-item">
                    <p className="item-title">
                      {index + 1}. {step.title || `Чекор ${index + 1}`}
                    </p>
                    {step.content ? <p className="item-meta">Задача: {step.content}</p> : null}
                    {step.prompt ? <p className="item-meta">Поттик: {step.prompt}</p> : null}
                    {step.example_answer ? (
                      <p className="item-meta">Пример: {step.example_answer}</p>
                    ) : null}
                    {step.evaluation_mode ? (
                      <p className="item-meta">
                        Проверка: {getEvaluationLabel(step.evaluation_mode)}
                      </p>
                    ) : null}
                    <p className="item-meta">
                      Статус: {getStepStatusLabel(stepAnswer)}
                    </p>
                    <div className="task-detail-block">
                      <h3 className="section-title">Одговор на ученик</h3>
                      <p className="item-meta">
                        {stepAnswer?.answerText || 'Нема зачуван одговор за овој чекор.'}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="dashboard-card content-card">
          <h2 className="section-title teacher-subtitle">Оценување и коментар</h2>
          <label className="teacher-filter-label">
            Поени
            <input
              type="number"
              min="0"
              step="0.1"
              value={gradeValue}
              onChange={(event) => onGradeChange(event.target.value)}
            />
          </label>
          <label className="teacher-filter-label">
            Коментар
            <textarea
              rows={6}
              value={feedbackValue}
              onChange={(event) => onFeedbackChange(event.target.value)}
              placeholder="Остави коментар за ученикот."
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button
            type="button"
            className="btn btn-primary"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? 'Се зачувува...' : 'Зачувај оценка'}
          </button>
        </section>
      </div>
    </section>
  );
}

export default SubmissionReviewPage;
