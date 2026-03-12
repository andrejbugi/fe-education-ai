import { TASK_STATUS_LABEL } from '../data/mockTasks';

function TaskCard({ task }) {
  const statusClass = `status-${task.status.replace('_', '-')}`;

  return (
    <section className="workspace-card task-card">
      <div className="task-card-top">
        <p className="item-subject">{task.subject}</p>
        <span className={`status-badge ${statusClass}`}>
          {TASK_STATUS_LABEL[task.status]}
        </span>
      </div>
      <h2 className="section-title">{task.title}</h2>
      <p className="item-meta">Тип: {task.type}</p>
      <p className="item-meta">Тежина: {task.difficulty}</p>
      <p className="task-instructions">{task.instructions}</p>
      <p className="item-meta">Рок: {task.dueText}</p>
    </section>
  );
}

export default TaskCard;
