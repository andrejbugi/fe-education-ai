function UpcomingDeadlines({ tasks, onOpenTask }) {
  return (
    <section className="dashboard-card content-card">
      <h2 className="section-title">Претстојни рокови</h2>
      {tasks.length === 0 ? (
        <p className="empty-state">Нема рокови за денес.</p>
      ) : (
        <ul className="list-reset deadlines-list">
          {tasks.map((task) => (
            <li key={task.id} className="deadline-item">
              <div>
                <p className="item-title">
                  {task.subject} - {task.title}
                </p>
                <p className="item-meta">{task.dueText}</p>
              </div>
              <button
                type="button"
                className="inline-action"
                onClick={() => onOpenTask(task.id)}
              >
                Отвори
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default UpcomingDeadlines;
