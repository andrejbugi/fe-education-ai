import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { TASK_STATUS_LABEL } from '../data/mockTasks';

function TaskDetailsPage({
  theme,
  onToggleTheme,
  onNavigate,
  onLogout,
  task,
  onStartTask,
  onBack,
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
        <section className="dashboard-card task-details-card">
          <p className="hero-eyebrow">Детали за задача</p>
          <h1 className="hero-title">
            {task.subject} - {task.title}
          </h1>
          <p className="item-meta">Тип: {task.type}</p>
          <p className="item-meta">Тежина: {task.difficulty}</p>
          <p className="item-meta">Рок: {task.dueText}</p>
          <p className="item-meta">Статус: {TASK_STATUS_LABEL[task.status]}</p>
          <div className="task-detail-block">
            <h2 className="section-title">Инструкции</h2>
            <p>{task.instructions}</p>
          </div>
          <div className="task-detail-block">
            <h2 className="section-title">Прикачен материјал</h2>
            <ul className="list-reset">
              <li>PDF - Упатство за задачата</li>
              <li>Слајдови од час</li>
            </ul>
          </div>
          <div className="hero-actions">
            <button type="button" className="btn btn-primary" onClick={onStartTask}>
              Започни задача
            </button>
            <button type="button" className="btn btn-secondary" onClick={onBack}>
              Назад
            </button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default TaskDetailsPage;
