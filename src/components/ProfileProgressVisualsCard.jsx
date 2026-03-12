function ProfileProgressVisualsCard({ weeklyTrend, completedRatio }) {
  const circleStyle = {
    background: `conic-gradient(var(--primary) ${completedRatio}%, var(--surface-border) ${completedRatio}% 100%)`,
  };

  return (
    <section className="dashboard-card content-card">
      <h2 className="section-title">Неделен напредок</h2>
      <div className="weekly-bars">
        {weeklyTrend.map((day) => (
          <div key={day.day} className="weekly-bar-item">
            <div className="weekly-bar-track">
              <div
                className="weekly-bar-fill"
                style={{ height: `${day.progress}%` }}
              />
            </div>
            <span>{day.day}</span>
          </div>
        ))}
      </div>

      <div className="completion-ring-wrap">
        <div className="completion-ring" style={circleStyle}>
          <div className="completion-ring-inner">
            <strong>{completedRatio}%</strong>
            <span>Завршени задачи</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProfileProgressVisualsCard;
