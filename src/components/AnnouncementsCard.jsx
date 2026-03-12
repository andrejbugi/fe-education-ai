function AnnouncementsCard({ items }) {
  return (
    <section className="dashboard-card content-card">
      <h2 className="section-title">Известувања</h2>
      <ul className="list-reset announcements-list">
        {items.map((item) => (
          <li key={item} className="announcement-item">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default AnnouncementsCard;
