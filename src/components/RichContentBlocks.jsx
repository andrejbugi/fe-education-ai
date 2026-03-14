function blockHref(block) {
  return block.url || block.file_url || block.external_url || block.embed_url || '';
}

function RichContentBlocks({ blocks = [], title = 'Содржина' }) {
  if (!blocks.length) {
    return null;
  }

  return (
    <section className="task-detail-block">
      <h2 className="section-title">{title}</h2>
      <div className="rich-block-list">
        {blocks.map((block, index) => {
          const key = block.id || `${block.type || 'block'}-${index}`;
          const href = blockHref(block);

          if (block.type === 'heading') {
            return (
              <h3 key={key} className="rich-heading">
                {block.text || block.content}
              </h3>
            );
          }

          if (['paragraph', 'instruction', 'text'].includes(block.type)) {
            return (
              <div key={key} className="rich-block-item">
                {block.type === 'instruction' ? (
                  <p className="item-title">Инструкција</p>
                ) : null}
                <p className="item-meta">{block.text || block.content}</p>
              </div>
            );
          }

          if (block.type === 'list' && Array.isArray(block.items)) {
            return (
              <ul key={key} className="list-reset rich-list">
                {block.items.map((item) => (
                  <li key={`${key}-${item}`}>{item}</li>
                ))}
              </ul>
            );
          }

          if (['link', 'file', 'pdf'].includes(block.type) && href) {
            return (
              <div key={key} className="rich-block-item">
                <p className="item-title">{block.title || block.text || 'Материјал'}</p>
                {block.description ? <p className="item-meta">{block.description}</p> : null}
                <a className="inline-action assignment-link" href={href} target="_blank" rel="noreferrer">
                  Отвори
                </a>
              </div>
            );
          }

          return (
            <div key={key} className="rich-block-item">
              {block.title ? <p className="item-title">{block.title}</p> : null}
              <p className="item-meta">{block.text || block.content || ''}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default RichContentBlocks;
