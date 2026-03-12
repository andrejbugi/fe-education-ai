const URGENCY_CLASS = {
  Денес: 'urgency-today',
  Утре: 'urgency-tomorrow',
  Наскоро: 'urgency-soon',
  Задоцнето: 'urgency-overdue',
};

function DeadlinesCard({ deadlines }) {
  return (
    <section className="dashboard-card content-card">
      <h2 className="section-title">Рокови</h2>
      {deadlines.length === 0 ? (
        <p className="empty-state">Нема рокови за денес.</p>
      ) : (
        <ul className="list-reset deadlines-list">
          {deadlines.map((deadline) => (
            <li key={`${deadline.title}-${deadline.when}`} className="deadline-item">
              <div>
                <p className="item-title">{deadline.title}</p>
                <p className="item-meta">{deadline.when}</p>
              </div>
              <span className={`urgency-badge ${URGENCY_CLASS[deadline.urgency]}`}>
                {deadline.urgency}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default DeadlinesCard;
