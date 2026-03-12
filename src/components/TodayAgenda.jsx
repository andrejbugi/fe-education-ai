function TodayAgenda() {
  const items = [
    '08:00 Математика',
    '11:00 Историја',
    'Домашна по математика до 19:00',
    'Потсетник: квиз по англиски во петок',
  ];

  return (
    <section className="dashboard-card content-card">
      <h2 className="section-title">Денешни активности</h2>
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

export default TodayAgenda;
