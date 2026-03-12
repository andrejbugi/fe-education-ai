import Navbar from '../components/Navbar';
import CalendarMockView from '../components/CalendarMockView';
import UpcomingDeadlines from '../components/UpcomingDeadlines';
import TodayAgenda from '../components/TodayAgenda';
import Footer from '../components/Footer';

function StudentCalendarPage({
  theme,
  onToggleTheme,
  onNavigate,
  tasks,
  onOpenTask,
}) {
  return (
    <div className={`dashboard-root theme-${theme}`}>
      <Navbar
        theme={theme}
        activePage="calendar"
        onToggleTheme={onToggleTheme}
        onNavigate={onNavigate}
      />
      <main className="dashboard-main">
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
