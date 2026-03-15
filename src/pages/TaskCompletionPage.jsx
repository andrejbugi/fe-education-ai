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
  const reviewedSteps = stepAnswers.filter((step) =>
    ['answered', 'correct', 'incorrect'].includes(step.status)
  ).length;
  const totalSteps = Array.isArray(task?.steps) ? task.steps.length : 0;
  const pendingTeacherReview =
    task?.submission?.status && ['submitted', 'in_progress'].includes(task.submission.status);

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
            {pendingTeacherReview ? <p>Чека преглед и повратна информација од наставник.</p> : null}
          </div>
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
