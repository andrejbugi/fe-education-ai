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

function uniqueValues(values) {
  const seen = new Set();

  return values.filter((value) => {
    const normalized = String(value || '').trim();
    if (!normalized || seen.has(normalized)) {
      return false;
    }

    seen.add(normalized);
    return true;
  });
}

function getBlockText(block) {
  if (!block || typeof block !== 'object') {
    return '';
  }

  return String(block.text || block.content || block.value || '').trim();
}

function formatAnswerKeyValue(value, mode) {
  const rawValue = String(value || '').trim();
  if (!rawValue) {
    return '';
  }

  if (mode !== 'regex') {
    return rawValue;
  }

  return rawValue
    .replace(/^\^/, '')
    .replace(/\$$/, '')
    .replace(/\\s\*/g, ' ')
    .replace(/\\s\+/g, ' ')
    .replace(/\\=/g, '=')
    .replace(/\\\\/g, '\\')
    .replace(/\s+/g, ' ')
    .trim();
}

function getAssignmentIntroLines(assignment) {
  return uniqueValues((assignment?.contentBlocks || assignment?.contentJson || []).map(getBlockText));
}

function getStepQuestionLines(step) {
  return uniqueValues([
    step?.content,
    ...(step?.contentBlocks || step?.content_json || []).map(getBlockText),
  ]);
}

function getExpectedAnswerLines(step, stepAnswer) {
  return uniqueValues([
    stepAnswer?.correctAnswerText,
    ...((step?.answerKeys || step?.answer_keys || []).map((answerKey) =>
      formatAnswerKeyValue(answerKey?.value, step?.evaluationMode || step?.evaluation_mode)
    )),
  ]);
}

function SubmissionReviewPage({
  review,
  loading,
  error,
  gradeValue,
  feedbackValue,
  isEditing,
  onGradeChange,
  onFeedbackChange,
  onStartEdit,
  onCancelEdit,
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
  const assignmentIntroLines = getAssignmentIntroLines(assignment);
  const hasSavedReview = submission?.status === 'reviewed';
  const maxPointsText =
    assignment?.maxPoints !== undefined && assignment?.maxPoints !== null && assignment?.maxPoints !== ''
      ? String(assignment.maxPoints)
      : 'Не се поставени';

  return (
    <section className="dashboard-card content-card submission-review-page">
      <div className="submission-review-header">
        <button type="button" className="back-button" onClick={onBack}>
          Назад
        </button>
        <div className="submission-review-heading">
          <p className="hero-eyebrow">Оценки</p>
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
          <p className="item-meta">
            Резултат:{' '}
            {submission?.totalScore !== undefined && submission?.totalScore !== null && submission?.totalScore !== ''
              ? submission.totalScore
              : 'Се уште нема внесени поени'}
          </p>
        </div>
      </div>

      <div className="submission-review-grid">
        <section className="dashboard-card content-card submission-review-main">
          <h2 className="section-title teacher-subtitle">Одговори по чекор</h2>
          {assignmentIntroLines.length > 0 ? (
            <div className="task-detail-block">
              <h3 className="section-title">Упатство за задачата</h3>
              {assignmentIntroLines.map((line, index) => (
                <p key={`assignment-intro-${index}`} className="item-meta">
                  {line}
                </p>
              ))}
            </div>
          ) : null}
          {assignmentSteps.length === 0 ? (
            <p className="empty-state">Нема чекори за оваа задача.</p>
          ) : (
            <div className="submission-step-list">
              {assignmentSteps.map((step, index) => {
                const stepAnswer = stepAnswers.find(
                  (item) => String(item.assignmentStepId) === String(step.id)
                );
                const questionLines = getStepQuestionLines(step);
                const expectedAnswerLines = getExpectedAnswerLines(step, stepAnswer);

                return (
                  <article key={String(step.id || index)} className="teacher-assignment-item submission-step-card">
                    <p className="item-title">
                      {index + 1}. {step.title || `Чекор ${index + 1}`}
                    </p>
                    {step.prompt ? <p className="item-meta">Поттик: {step.prompt}</p> : null}
                    {step.evaluation_mode ? (
                      <p className="item-meta">
                        Проверка: {getEvaluationLabel(step.evaluation_mode)}
                      </p>
                    ) : null}
                    <p className="item-meta">
                      Статус: {getStepStatusLabel(stepAnswer)}
                    </p>
                    {questionLines.length > 0 ? (
                      <div className="task-detail-block">
                        <h3 className="section-title">Прашање / равенка</h3>
                        {questionLines.map((line, lineIndex) => (
                          <p key={`${step.id}-question-${lineIndex}`} className="item-title">
                            {line}
                          </p>
                        ))}
                      </div>
                    ) : null}
                    <div className="task-detail-block">
                      <h3 className="section-title">Одговор на ученик</h3>
                      <p className="item-meta">
                        {stepAnswer?.answerText || 'Нема зачуван одговор за овој чекор.'}
                      </p>
                    </div>
                    {expectedAnswerLines.length > 0 ? (
                      <div className="task-detail-block">
                        <h3 className="section-title">Точен одговор</h3>
                        {expectedAnswerLines.map((line, lineIndex) => (
                          <p key={`${step.id}-expected-${lineIndex}`} className="item-meta">
                            {line}
                          </p>
                        ))}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="dashboard-card content-card submission-review-side">
          <div className="submission-review-side-header">
            <h2 className="section-title teacher-subtitle">Оценување и коментар</h2>
            {hasSavedReview && !isEditing ? (
              <button
                type="button"
                className="btn btn-secondary submission-review-edit-button"
                onClick={onStartEdit}
                aria-label="Измени оценка"
                title="Измени оценка"
              >
                ✎ Измени
              </button>
            ) : null}
          </div>
          <div className="submission-review-score-cap">Макс. поени: {maxPointsText}</div>
          {hasSavedReview && !isEditing ? (
            <div className="submission-review-summary">
              <p className="item-meta">Оценката е зачувана. Кликни „Измени“ за промени.</p>
              <div className="task-detail-block">
                <h3 className="section-title">Поени</h3>
                <p className="item-title">{gradeValue || submission?.totalScore || 'Нема внесени поени'}</p>
              </div>
              <div className="task-detail-block">
                <h3 className="section-title">Коментар</h3>
                <p className="item-meta">{feedbackValue || 'Нема внесен коментар.'}</p>
              </div>
            </div>
          ) : (
            <>
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
              <div className="submission-review-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={onSave}
                  disabled={saving}
                >
                  {saving ? 'Се зачувува...' : 'Зачувај оценка'}
                </button>
                {hasSavedReview ? (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={onCancelEdit}
                    disabled={saving}
                  >
                    Откажи
                  </button>
                ) : null}
              </div>
            </>
          )}
        </section>
      </div>
    </section>
  );
}

export default SubmissionReviewPage;
