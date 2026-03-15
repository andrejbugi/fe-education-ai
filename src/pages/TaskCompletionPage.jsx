import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

function TaskCompletionPage({
  theme,
  onToggleTheme,
  onNavigate,
  onLogout,
  task,
  hasNextTask,
  onNextTask,
  onBackHome,
}) {
  const stepAnswers = Array.isArray(task?.submission?.stepAnswers) ? task.submission.stepAnswers : [];
  const submittedAnswers = Array.isArray(task?.steps)
    ? task.steps
        .map((step, index) => ({
          id: String(step.id ?? `step-${index}`),
          title: step.title || `Чекор ${index + 1}`,
          answer:
            stepAnswers.find(
              (stepAnswer) => String(stepAnswer.assignmentStepId) === String(step.id)
            )?.answerText || '',
        }))
        .filter((item) => item.answer)
    : [];
  const reviewedSteps = stepAnswers.filter((step) =>
    ['answered', 'correct', 'incorrect'].includes(step.status)
  ).length;
  const totalSteps = Array.isArray(task?.steps) ? task.steps.length : 0;
  const pendingTeacherReview =
    task?.submission?.status && ['submitted', 'in_progress'].includes(task.submission.status);
  const teacherFeedback = String(task?.submission?.feedback || '').trim();
  const scoreSummary =
    task?.submission?.totalScore !== undefined &&
    task?.submission?.totalScore !== null &&
    String(task.submission.totalScore) !== ''
      ? task.maxPoints
        ? `${task.submission.totalScore} / ${task.maxPoints}`
        : String(task.submission.totalScore)
      : '';

  return (
    <div className={`dashboard-root theme-${theme}`}>
      <Navbar
        theme={theme}
        activePage="dashboard"
        onToggleTheme={onToggleTheme}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />
      <main className="dashboard-main">
        <section className="dashboard-card completion-page-card">
          <p className="hero-eyebrow">Резултат</p>
          <h1 className="hero-title">Успешно предадено</h1>
          <p className="hero-meta">
            Завршена е задачата: {task.subject} - {task.title}
          </p>
          <div className="task-detail-block">
            <h2 className="section-title">Резиме на поднесување</h2>
            <p>Статус: {task.submission?.statusLabel || 'Предадено'}</p>
            <p>
              Завршени чекори: {reviewedSteps}/{totalSteps || reviewedSteps}
            </p>
            {task.submission?.submittedAt ? <p>Поднесено: {task.submission.submittedAt}</p> : null}
            {scoreSummary ? <p>Поени: {scoreSummary}</p> : null}
            {pendingTeacherReview ? <p>Чека преглед и повратна информација од наставник.</p> : null}
          </div>
          {teacherFeedback ? (
            <div className="task-detail-block">
              <h2 className="section-title">Повратна информација од наставник</h2>
              <p className="reviewed-feedback-text">{teacherFeedback}</p>
            </div>
          ) : null}
          {submittedAnswers.length > 0 ? (
            <div className="task-detail-block">
              <h2 className="section-title">Поднесени одговори</h2>
              {submittedAnswers.map((item) => (
                <div key={item.id}>
                  <p>{item.title}</p>
                  <p>{item.answer}</p>
                </div>
              ))}
            </div>
          ) : null}
          <div className="hero-actions">
            <button type="button" className="btn btn-primary" onClick={onNextTask}>
              {hasNextTask ? 'Следна задача' : 'Заврши'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onBackHome}>
              Назад на почетна
            </button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default TaskCompletionPage;
