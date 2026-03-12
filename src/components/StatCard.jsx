function StatCard({ label, value }) {
  return (
    <article className="dashboard-card stat-card">
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
    </article>
  );
}

export default StatCard;
