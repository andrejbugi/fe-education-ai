import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

function StudentNotificationsPage({
  theme,
  onToggleTheme,
  onNavigate,
  onLogout,
  notifications,
}) {
  return (
    <div className={`dashboard-root theme-${theme}`}>
      <Navbar
        theme={theme}
        activePage="notifications"
        onToggleTheme={onToggleTheme}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />
      <main className="dashboard-main">
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
                  <span className="notification-time">{notification.time}</span>
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
