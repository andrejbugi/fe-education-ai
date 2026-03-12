function ProfileRecentActivityCard({ activities }) {
  return (
    <section className="dashboard-card content-card">
      <h2 className="section-title">Последни активности</h2>
      <ul className="list-reset profile-activity-list">
        {activities.map((activity) => (
          <li key={activity} className="profile-activity-item">
            {activity}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default ProfileRecentActivityCard;
