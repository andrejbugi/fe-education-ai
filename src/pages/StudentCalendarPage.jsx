import Navbar from '../components/Navbar';
import CalendarMockView from '../components/CalendarMockView';
import UpcomingDeadlines from '../components/UpcomingDeadlines';
import TodayAgenda from '../components/TodayAgenda';
import Footer from '../components/Footer';

function StudentCalendarPage({
  theme,
  onToggleTheme,
  onNavigate,
  onLogout,
  profile,
  tasks,
  onOpenTask,
}) {
  return (
    <div className={`dashboard-root theme-${theme} student-root`}>
      <Navbar
        theme={theme}
        activePage="calendar"
        onToggleTheme={onToggleTheme}
        onNavigate={onNavigate}
        onLogout={onLogout}
        brandTitle={profile?.school || 'Ученички простор'}
        brandSubtitle={[profile?.fullName, profile?.className].filter(Boolean).join(' · ')}
        avatarLabel={profile?.initials || 'УЧ'}
      />
      <main className="dashboard-main student-main">
        <CalendarMockView />
        <section className="dashboard-grid">
          <UpcomingDeadlines tasks={tasks} onOpenTask={onOpenTask} />
          <TodayAgenda />
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default StudentCalendarPage;
