import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

function StudentAnnouncementDetailsPage({
  theme,
  onToggleTheme,
  onNavigate,
  onLogout,
  profile,
  announcement,
  onBack,
}) {
  const scopeLabel = [announcement?.classroomName, announcement?.subjectName]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className={`dashboard-root theme-${theme} student-root`}>
      <Navbar
        theme={theme}
        activePage="notifications"
        onToggleTheme={onToggleTheme}
        onNavigate={onNavigate}
        onLogout={onLogout}
        brandTitle={profile?.school || 'Ученички простор'}
        brandSubtitle={[profile?.fullName, profile?.className].filter(Boolean).join(' · ')}
        avatarLabel={profile?.initials || 'УЧ'}
      />
      <main className="dashboard-main student-main">
        <section className="dashboard-card task-details-card">
          <p className="hero-eyebrow">Објава</p>
          <h1 className="hero-title">{announcement?.title || 'Се вчитува објавата...'}</h1>
          {announcement?.priorityLabel ? (
            <p className="item-meta">Приоритет: {announcement.priorityLabel}</p>
          ) : null}
          {announcement?.publishedLabel ? (
            <p className="item-meta">Објавено: {announcement.publishedLabel}</p>
          ) : null}
          {announcement?.authorName ? (
            <p className="item-meta">Автор: {announcement.authorName}</p>
          ) : null}
          {scopeLabel ? <p className="item-meta">Опфат: {scopeLabel}</p> : null}
          {announcement?.audienceLabel ? (
            <p className="item-meta">{announcement.audienceLabel}</p>
          ) : null}

          <div className="task-detail-block">
            <h2 className="section-title">Опис</h2>
            <p>{announcement?.detail || 'Нема дополнителен опис за оваа објава.'}</p>
          </div>

          {Array.isArray(announcement?.comments) && announcement.comments.length > 0 ? (
            <div className="task-detail-block">
              <h2 className="section-title">Коментари</h2>
              <ul className="list-reset announcements-list">
                {announcement.comments.map((comment) => (
                  <li key={comment.id} className="announcement-item">
                    <p className="item-meta">{comment.authorName || 'Корисник'}</p>
                    <p>{comment.body}</p>
                    {comment.createdAt ? <p className="item-meta">{comment.createdAt}</p> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="hero-actions">
            <button type="button" className="btn btn-secondary" onClick={onBack}>
              Назад до објави
            </button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default StudentAnnouncementDetailsPage;
