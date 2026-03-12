function ProfileSummaryRow({ items }) {
  return (
    <section className="profile-summary-row">
      {items.map((item) => (
        <article key={item.label} className="dashboard-card profile-summary-card">
          <p>{item.label}</p>
          <strong>{item.value}</strong>
        </article>
      ))}
    </section>
  );
}

export default ProfileSummaryRow;
