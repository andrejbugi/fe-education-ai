function HeroNextCard({ item, onContinue }) {
  if (!item) {
    return (
      <section className="dashboard-card hero-card">
        <p className="hero-eyebrow">Следно за тебе</p>
        <h1 className="hero-title">Нема активни задачи</h1>
        <p className="hero-meta">Одлично. Сите задачи се завршени.</p>
      </section>
    );
  }

  return (
    <section className="dashboard-card hero-card">
      <p className="hero-eyebrow">Следно за тебе</p>
      <h1 className="hero-title">
        {item.subject} - {item.title}
      </h1>
      <p className="hero-meta">Рок: {item.dueText}</p>
      <div className="hero-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => onContinue(item.id)}
        >
          Продолжи
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => onContinue(item.id)}
        >
          Види детали
        </button>
      </div>
    </section>
  );
}

export default HeroNextCard;
