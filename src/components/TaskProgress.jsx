import { TASK_STATUS_LABEL } from '../data/mockTasks';

function TaskProgress({ tasks, activeTaskId }) {
  const completed = tasks.filter((task) => task.status === 'done').length;
  const progress = Math.round((completed / tasks.length) * 100);

  return (
    <section className="workspace-card">
      <h2 className="section-title">Тек на задачи</h2>
      <div className="progress-track" aria-hidden="true">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <ul className="list-reset flow-list">
        {tasks.map((task, index) => (
          <li
            key={task.id}
            className={`flow-item ${task.id === activeTaskId ? 'current' : ''}`}
          >
            <span>
              {index + 1}. {task.subject}
            </span>
            <span className="flow-status">{TASK_STATUS_LABEL[task.status]}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default TaskProgress;
