import { TASK_STATUS_LABEL } from '../data/mockTasks';

const STATUS_CLASS = {
  not_started: 'status-not-started',
  in_progress: 'status-in-progress',
  done: 'status-submitted',
  skipped: 'status-overdue',
};

function HomeworkListCard({
  items,
  onOpenTask,
  onContinueTask,
  onSubmitTask,
  title = 'Домашни задачи',
}) {
  return (
    <section className="dashboard-card content-card">
      <h2 className="section-title">{title}</h2>
      {items.length === 0 ? (
        <p className="empty-state">Нема активни задачи.</p>
      ) : (
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
              {item.teacherName ? (
                <p className="item-meta">Наставник: {item.teacherName}</p>
              ) : null}
              {item.classroomName ? (
                <p className="item-meta">Клас: {item.classroomName}</p>
              ) : null}
              {item.submission?.totalScore ? (
                <p className="item-meta">Резултат: {item.submission.totalScore}</p>
              ) : null}
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
                  onClick={() => onContinueTask(item.id)}
                >
                  {item.status === 'done' ? 'Прегледај' : 'Решавај'}
                </button>
                <button
                  type="button"
                  className="inline-action"
                  onClick={() => onSubmitTask(item.id)}
                  disabled={Boolean(item.submission?.submittedAt)}
                >
                  {item.submission?.submittedAt ? 'Предадено' : 'Предај'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default HomeworkListCard;
