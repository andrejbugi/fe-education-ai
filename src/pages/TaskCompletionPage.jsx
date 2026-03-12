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
