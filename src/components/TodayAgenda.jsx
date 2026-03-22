function TodayAgenda({
  items = [],
  title = 'Денешни активности',
  emptyText = 'Нема активности за денес.',
}) {
  return (
    <section className="dashboard-card content-card">
      <h2 className="section-title">{title}</h2>
      {items.length === 0 ? (
        <p className="empty-state">{emptyText}</p>
      ) : (
        <ul className="list-reset timeline-list">
          {items.map((item, index) => {
            const normalizedItem =
              typeof item === 'string'
                ? { id: item, title: item, detail: '' }
                : {
                    id: item?.id || `${item?.title || 'agenda'}-${index}`,
                    title: item?.title || '',
                    detail: item?.detail || '',
                  };

            return (
              <li key={normalizedItem.id} className="timeline-item">
                <span className="timeline-dot" />
                <span>
                  <strong>{normalizedItem.title}</strong>
                  {normalizedItem.detail ? <small>{normalizedItem.detail}</small> : null}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default TodayAgenda;
