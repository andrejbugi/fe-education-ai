function resourceLabel(type) {
  switch (type) {
    case 'pdf':
      return 'PDF';
    case 'file':
      return 'Датотека';
    case 'image':
      return 'Слика';
    case 'video':
      return 'Видео';
    case 'link':
      return 'Линк';
    case 'embed':
      return 'Вметнато';
    case 'text':
      return 'Белешка';
    default:
      return 'Ресурс';
  }
}

function resourceHref(resource) {
  return resource.fileUrl || resource.externalUrl || resource.embedUrl || '';
}

function AssignmentResourcesCard({ resources = [] }) {
  if (resources.length === 0) {
    return null;
  }

  return (
    <section className="task-detail-block">
      <h2 className="section-title">Материјали</h2>
      <ul className="list-reset assignment-resource-list">
        {resources.map((resource) => {
          const href = resourceHref(resource);
          return (
            <li key={resource.id} className="assignment-resource-item">
              <div className="announcement-top">
                <strong>{resource.title}</strong>
                <span className="urgency-badge urgency-soon">
                  {resourceLabel(resource.resourceType)}
                </span>
              </div>
              {resource.description ? <p className="item-meta">{resource.description}</p> : null}
              {resource.isRequired ? <p className="item-meta">Задолжително</p> : null}
              {resource.metadata?.file_size ? (
                <p className="item-meta">Големина: {resource.metadata.file_size}</p>
              ) : null}
              {resource.metadata?.mime_type ? (
                <p className="item-meta">Тип: {resource.metadata.mime_type}</p>
              ) : null}
              {href ? (
                <a
                  className="inline-action assignment-link"
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                >
                  Отвори материјал
                </a>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default AssignmentResourcesCard;
