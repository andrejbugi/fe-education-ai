function ProgressCard({ completed, average, weeklyProgress }) {
  return (
    <section className="dashboard-card content-card">
      <h2 className="section-title">Мој напредок</h2>
      <div className="progress-metrics">
        <p>Завршени задачи: {completed}</p>
        <p>Просек: {average}</p>
      </div>
      <div className="weekly-progress">
        <p className="item-meta">Неделен напредок</p>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${weeklyProgress}%` }}
          />
        </div>
        <p className="progress-caption">{weeklyProgress}% завршено оваа недела</p>
      </div>
    </section>
  );
}

export default ProgressCard;
