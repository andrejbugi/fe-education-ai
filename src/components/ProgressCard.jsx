function ProgressCard({ completed, average, weeklyProgress, progress }) {
  const level = progress?.currentLevel || 1;
  const totalXp = progress?.totalXp || 0;
  const streak = progress?.currentStreak || 0;
  const badgesCount = progress?.badgesCount || 0;
  const progressPercent =
    progress?.levelProgressPercent ?? Math.max(0, Math.min(100, weeklyProgress || 0));
  const nextLevelXp = progress?.nextLevelXp;
  const xpToNextLevel = progress?.xpToNextLevel;
  const badges = Array.isArray(progress?.badges) ? progress.badges.slice(0, 3) : [];

  return (
    <section className="dashboard-card content-card progress-card-shell">
      <h2 className="section-title">Мој напредок</h2>

      <div className="progress-card-header">
        <div>
          <p className="item-meta">Ниво</p>
          <strong className="progress-card-level">Ниво {level}</strong>
        </div>
        <div className="progress-card-xp-chip">
          <strong>{totalXp} XP</strong>
          {nextLevelXp ? <span>Следно ниво: {nextLevelXp}</span> : null}
        </div>
      </div>

      <div className="progress-metrics progress-metrics-rich">
        <p>Завршени задачи: {completed}</p>
        <p>Просек: {average}</p>
        <p>Серија: {streak} дена</p>
        <p>Значки: {badgesCount}</p>
      </div>

      <div className="weekly-progress">
        <div className="progress-caption-row">
          <p className="item-meta">Напредок до следно ниво</p>
          {typeof xpToNextLevel === 'number' ? (
            <span className="progress-caption-pill">Уште {xpToNextLevel} XP</span>
          ) : null}
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="progress-caption">
          {Math.round(progressPercent)}% напредок во тековното ниво
        </p>
      </div>

      {badges.length > 0 ? (
        <div className="progress-card-badges">
          {badges.map((badge) => (
            <article key={badge.id || badge.code} className="progress-badge-chip">
              <span className="progress-badge-icon">З</span>
              <div>
                <strong>{badge.name}</strong>
                {badge.description ? <p>{badge.description}</p> : null}
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export default ProgressCard;
