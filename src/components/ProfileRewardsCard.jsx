const bronzeRibbon = '/img/bronze.png';

function ProfileRewardsCard({ progress }) {
  const badges = Array.isArray(progress?.badges) ? progress.badges : [];
  const breakdown = progress?.breakdown || {};

  return (
    <section className="dashboard-card content-card rewards-card">
      <div className="rewards-card-header">
        <div>
          <h2 className="section-title">Значки и награди</h2>
          <p className="item-meta">Тековно наградите се milestone значки од backend.</p>
        </div>
        <div className="rewards-card-total">
          <strong>{progress?.badgesCount || 0}</strong>
          <span>вкупно значки</span>
        </div>
      </div>

      <div className="rewards-breakdown-grid">
        <article className="reward-breakdown-item">
          <span>Завршени задачи</span>
          <strong>{breakdown.completedAssignments || 0} XP</strong>
        </article>
        <article className="reward-breakdown-item">
          <span>Оценки</span>
          <strong>{breakdown.gradeBonus || 0} XP</strong>
        </article>
        <article className="reward-breakdown-item">
          <span>Присуство</span>
          <strong>{breakdown.attendance || 0} XP</strong>
        </article>
        <article className="reward-breakdown-item">
          <span>AI учење</span>
          <strong>{breakdown.aiLearning || 0} XP</strong>
        </article>
      </div>

      {badges.length > 0 ? (
        <div className="rewards-badge-grid">
          {badges.map((badge) => (
            <article key={badge.id || badge.code} className="rewards-badge-card">
              <div className="rewards-badge-mark">
                <img src={bronzeRibbon} alt="" className="rewards-badge-ribbon" />
              </div>
              <div>
                <h3>{badge.name}</h3>
                <p>{badge.description || 'Освоена значка.'}</p>
                {badge.awardedAt ? (
                  <span>
                    Освоена: {new Date(badge.awardedAt).toLocaleDateString('mk-MK')}
                  </span>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="empty-state">Се уште нема освоени значки.</p>
      )}
    </section>
  );
}

export default ProfileRewardsCard;
