const URGENCY_CLASS = {
  Денес: 'urgency-today',
  Утре: 'urgency-tomorrow',
  Наскоро: 'urgency-soon',
  Задоцнето: 'urgency-overdue',
};

function DeadlinesCard({ deadlines, onOpenTask }) {
  return (
    <section className="dashboard-card content-card">
      <h2 className="section-title">Наредни задачи</h2>
      {deadlines.length === 0 ? (
        <p className="empty-state">Нема наредни задачи.</p>
      ) : (
        <ul className="list-reset deadlines-list">
          {deadlines.map((deadline) => (
            <li key={`${deadline.title}-${deadline.when}`} className="deadline-item">
              <div>
                <p className="item-title">{deadline.title}</p>
                <p className="item-meta">{deadline.when}</p>
                {deadline.subject ? (
                  <p className="item-meta">Предмет: {deadline.subject}</p>
                ) : null}
              </div>
              <div className="item-actions">
                <span className={`urgency-badge ${URGENCY_CLASS[deadline.urgency]}`}>
                  {deadline.urgency}
                </span>
                {deadline.taskId ? (
                  <button
                    type="button"
                    className="inline-action"
                    onClick={() => onOpenTask?.(deadline.taskId)}
                  >
                    Отвори
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default DeadlinesCard;
