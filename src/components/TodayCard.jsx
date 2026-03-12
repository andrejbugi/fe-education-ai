function TodayCard({ items }) {
  return (
    <section className="dashboard-card content-card">
      <h2 className="section-title">Денес</h2>
      <ul className="list-reset timeline-list">
        {items.map((item) => (
          <li key={item} className="timeline-item">
            <span className="timeline-dot" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default TodayCard;
