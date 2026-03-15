import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { TASK_STATUS_LABEL } from '../data/mockTasks';
import AssignmentResourcesCard from '../components/AssignmentResourcesCard';
import RichContentBlocks from '../components/RichContentBlocks';

function TaskDetailsPage({
  theme,
  onToggleTheme,
  onNavigate,
  onLogout,
  task,
  onStartTask,
  onBack,
  startLabel = 'Започни',
}) {
  return (
    <div className={`dashboard-root theme-${theme}`}>
      <Navbar
        theme={theme}
        activePage="assignments"
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
          {task.description ? <p className="item-meta">{task.description}</p> : null}
          <p className="item-meta">Тип: {task.type}</p>
          {task.teacherName ? <p className="item-meta">Наставник: {task.teacherName}</p> : null}
          {task.classroomName ? <p className="item-meta">Клас: {task.classroomName}</p> : null}
          <p className="item-meta">Тежина: {task.difficulty}</p>
          {task.maxPoints ? <p className="item-meta">Макс. поени: {task.maxPoints}</p> : null}
          <p className="item-meta">Рок: {task.dueText}</p>
          {task.publishedAt ? <p className="item-meta">Објавено: {task.publishedAt}</p> : null}
          <p className="item-meta">Статус: {TASK_STATUS_LABEL[task.status]}</p>
          {Array.isArray(task.steps) && task.steps.length > 0 ? (
            <p className="item-meta">Број на чекори: {task.steps.length}</p>
          ) : null}
          {task.submission ? (
            <div className="task-detail-block">
              <h2 className="section-title">Предавање</h2>
              <p>Статус: {task.submission.statusLabel || task.submission.status}</p>
              {task.submission.startedAt ? <p>Започнато: {task.submission.startedAt}</p> : null}
              {task.submission.submittedAt ? <p>Предадено: {task.submission.submittedAt}</p> : null}
              {task.submission.totalScore ? <p>Поени: {task.submission.totalScore}</p> : null}
              <p>Доцнење: {task.submission.late ? 'Да' : 'Не'}</p>
            </div>
          ) : null}
          <div className="task-detail-block">
            <h2 className="section-title">Инструкции</h2>
            <p>{task.instructions}</p>
          </div>
          <RichContentBlocks blocks={task.contentBlocks} title="Структурирана содржина" />
          <AssignmentResourcesCard resources={task.resources} />
          {Array.isArray(task.steps) && task.steps.length > 0 ? (
            <div className="task-detail-block">
              <h2 className="section-title">Чекори</h2>
              <ul className="list-reset flow-list">
                {task.steps.map((step) => (
                  <li key={step.id} className="flow-item task-step-item">
                    <div>
                      <span>
                        {step.position}. {step.title}
                        {step.required ? ' *' : ''}
                      </span>
                      {step.prompt ? <p className="item-meta">{step.prompt}</p> : null}
                      {step.exampleAnswer ? (
                        <p className="item-meta">Пример: {step.exampleAnswer}</p>
                      ) : null}
                      {step.resourceUrl ? (
                        <a
                          className="inline-action assignment-link"
                          href={step.resourceUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Отвори ресурс за чекор
                        </a>
                      ) : null}
                      <RichContentBlocks
                        blocks={step.contentBlocks}
                        title="Содржина на чекор"
                      />
                    </div>
                    <span className="flow-status">
                      {step.stepTypeLabel}
                      {step.estimatedMinutes ? ` · ${step.estimatedMinutes} мин` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="hero-actions">
            <button type="button" className="btn btn-primary" onClick={onStartTask}>
              {startLabel}
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
