function ProfileSubjectPerformanceCard({ subjects }) {
  return (
    <section className="dashboard-card content-card">
      <h2 className="section-title">Успех по предмети</h2>
      <ul className="list-reset subject-performance-list">
        {subjects.map((subject) => (
          <li key={subject.name} className="subject-performance-item">
            <div className="subject-row">
              <span>{subject.name}</span>
              <strong>{subject.score}</strong>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${subject.score}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default ProfileSubjectPerformanceCard;
