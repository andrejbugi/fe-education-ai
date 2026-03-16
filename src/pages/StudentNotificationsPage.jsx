import AnnouncementsCard from '../components/AnnouncementsCard';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

function StudentNotificationsPage({
  theme,
  onToggleTheme,
  onNavigate,
  onLogout,
  profile,
  announcements,
  onOpenAnnouncement,
  notifications,
  onMarkAsRead,
}) {
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
        <AnnouncementsCard
          items={announcements}
          title="Објави"
          emptyMessage="Нема активни објави."
          onOpenItem={(item) => onOpenAnnouncement?.(item.id)}
        />

        <section className="dashboard-card content-card">
          <h1 className="section-title">Известувања</h1>
          {notifications.length === 0 ? (
            <p className="empty-state">Нема известувања.</p>
          ) : (
            <ul className="list-reset notifications-list">
              {notifications.map((notification) => (
                <li key={notification.id} className="notification-item">
                  <div>
                    <p className="item-title">{notification.title}</p>
                    <p className="item-meta">{notification.detail}</p>
                  </div>
                  <div className="item-actions">
                    <span className="notification-time">{notification.time}</span>
                    {!notification.read && onMarkAsRead ? (
                      <button
                        type="button"
                        className="inline-action"
                        onClick={() => onMarkAsRead(notification.id)}
                      >
                        Прочитано
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default StudentNotificationsPage;
