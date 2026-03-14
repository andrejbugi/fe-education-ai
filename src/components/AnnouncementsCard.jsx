function AnnouncementsCard({ items }) {
  return (
    <section className="dashboard-card content-card">
      <h2 className="section-title">Известувања</h2>
      {items.length === 0 ? (
        <p className="empty-state">Нема активни известувања.</p>
      ) : (
        <ul className="list-reset announcements-list">
          {items.map((item, index) => {
            const key =
              typeof item === 'string' ? `${item}-${index}` : item.id || `${item.title}-${index}`;
            const title = typeof item === 'string' ? item : item.title || 'Известување';
            const detail =
              typeof item === 'string' ? '' : item.detail || item.body || item.scope || '';
            const priority = typeof item === 'string' ? '' : item.priorityLabel || item.priority || '';
            const meta =
              typeof item === 'string'
                ? ''
                : [item.scope, item.publishedLabel, item.audienceLabel].filter(Boolean).join(' · ');

            return (
              <li key={key} className="announcement-item">
                <div className="announcement-top">
                  <strong>{title}</strong>
                  {priority ? (
                    <span
                      className={`urgency-badge announcement-priority priority-${item.priority || 'normal'}`}
                    >
                      {priority}
                    </span>
                  ) : null}
                </div>
                {detail ? <p className="item-meta">{detail}</p> : null}
                {meta ? <p className="item-meta">{meta}</p> : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default AnnouncementsCard;
