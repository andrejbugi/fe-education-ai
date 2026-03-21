import { TASK_STATUS_LABEL } from '../data/mockTasks';

const STATUS_CLASS = {
  not_started: 'status-not-started',
  in_progress: 'status-in-progress',
  done: 'status-submitted',
  skipped: 'status-overdue',
};

function getHomeworkStatus(item) {
  if (item?.submission?.status === 'reviewed') {
    return { label: 'Прегледано', className: 'status-submitted' };
  }

  if (item?.submission?.status === 'late' || item?.submission?.late) {
    return { label: 'Предадено со доцнење', className: 'status-overdue' };
  }

  if (item?.submission?.submittedAt || item?.submission?.status === 'submitted') {
    return { label: 'Предадено', className: 'status-submitted' };
  }

  if (item?.dueCategory === 'overdue') {
    return { label: 'Рокот е поминат', className: 'status-overdue' };
  }

  return {
    label: TASK_STATUS_LABEL[item.status],
    className: STATUS_CLASS[item.status],
  };
}

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
          {items.map((item) => {
            const status = getHomeworkStatus(item);

            return (
              <li key={`${item.id || item.subject}-${item.title}`} className="homework-item student-task-item">
                <div className="homework-top">
                  <p className="item-subject">{item.subject}</p>
                  <span className={`status-badge ${status.className}`}>
                    {status.label}
                  </span>
                </div>
                <p className="item-title">{item.title}</p>
                <p className="item-meta">
                  {item.classroomName ? `${item.classroomName} · ` : ''}
                  {item.teacherName ? `Наставник: ${item.teacherName}` : 'Училишна задача'}
                </p>
                {item.teacherName ? (
                  <p className="item-meta">Тип: {item.type}</p>
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
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default HomeworkListCard;
