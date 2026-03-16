function truncateWords(text, maxWords) {
  if (!text || !maxWords || maxWords < 1) {
    return text || '';
  }

  const words = String(text).trim().split(/\s+/);
  if (words.length <= maxWords) {
    return text;
  }

  return `${words.slice(0, maxWords).join(' ')}...`;
}

function sortAnnouncements(items) {
  return [...items].sort((left, right) => {
    const leftDate = left?.publishedAt ? new Date(left.publishedAt).getTime() : 0;
    const rightDate = right?.publishedAt ? new Date(right.publishedAt).getTime() : 0;

    return rightDate - leftDate;
  });
}

function AnnouncementsCard({
  items,
  title = 'Објави',
  emptyMessage = 'Нема активни објави.',
  maxItems,
  truncateWordsCount,
  onOpenItem,
  onSeeMore,
  seeMoreLabel = 'Види повеќе',
}) {
  const sortedItems = sortAnnouncements(Array.isArray(items) ? items : []);
  const visibleItems =
    typeof maxItems === 'number' && maxItems > 0 ? sortedItems.slice(0, maxItems) : sortedItems;

  return (
    <section className="dashboard-card content-card">
      <h2 className="section-title">{title}</h2>
      {visibleItems.length === 0 ? (
        <p className="empty-state">{emptyMessage}</p>
      ) : (
        <ul className="list-reset announcements-list">
          {visibleItems.map((item, index) => {
            const key =
              typeof item === 'string' ? `${item}-${index}` : item.id || `${item.title}-${index}`;
            const title = typeof item === 'string' ? item : item.title || 'Известување';
            const detail =
              typeof item === 'string'
                ? ''
                : truncateWords(
                    item.detail || item.body || item.scope || item.message || '',
                    truncateWordsCount
                  );
            const priority =
              typeof item === 'string' ? '' : item.priorityLabel || item.priority || '';
            const meta =
              typeof item === 'string'
                ? ''
                : [item.scope, item.publishedLabel, item.audienceLabel, item.time]
                    .filter(Boolean)
                    .join(' · ');
            const isClickable =
              typeof onOpenItem === 'function' &&
              typeof item === 'object' &&
              item !== null &&
              item.id !== undefined &&
              item.id !== null;
            const handleOpen = () => {
              if (isClickable) {
                onOpenItem(item);
              }
            };

            return (
              <li
                key={key}
                className={`announcement-item${isClickable ? ' is-clickable' : ''}`}
                onClick={handleOpen}
                onKeyDown={(event) => {
                  if (!isClickable) {
                    return;
                  }

                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleOpen();
                  }
                }}
                role={isClickable ? 'button' : undefined}
                tabIndex={isClickable ? 0 : undefined}
              >
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
                {isClickable ? (
                  <div className="item-actions">
                    <span className="inline-action">Отвори</span>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
      {onSeeMore && visibleItems.length > 0 ? (
        <div className="item-actions">
          <button type="button" className="inline-action" onClick={onSeeMore}>
            {seeMoreLabel}
          </button>
        </div>
      ) : null}
    </section>
  );
}

export default AnnouncementsCard;
