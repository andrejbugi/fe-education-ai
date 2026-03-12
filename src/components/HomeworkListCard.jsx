import { TASK_STATUS_LABEL } from '../data/mockTasks';

const STATUS_CLASS = {
  not_started: 'status-not-started',
  in_progress: 'status-in-progress',
  done: 'status-submitted',
  skipped: 'status-overdue',
};

function HomeworkListCard({ items, onOpenTask }) {
  return (
    <section className="dashboard-card content-card">
      <h2 className="section-title">Домашни задачи</h2>
      <ul className="list-reset homework-list">
        {items.map((item) => (
          <li key={`${item.subject}-${item.title}`} className="homework-item">
            <div className="homework-top">
              <p className="item-subject">{item.subject}</p>
              <span className={`status-badge ${STATUS_CLASS[item.status]}`}>
                {TASK_STATUS_LABEL[item.status]}
              </span>
            </div>
            <p className="item-title">{item.title}</p>
            <p className="item-meta">Рок: {item.dueText}</p>
            <div className="item-actions">
              <button
                type="button"
                className="inline-action"
                onClick={() => onOpenTask(item.id)}
              >
                Отвори
              </button>
              <button
                type="button"
                className="inline-action"
                onClick={() => onOpenTask(item.id)}
              >
                Прикачи решение
              </button>
              <button
                type="button"
                className="inline-action"
                onClick={() => onOpenTask(item.id)}
              >
                Предај
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default HomeworkListCard;
