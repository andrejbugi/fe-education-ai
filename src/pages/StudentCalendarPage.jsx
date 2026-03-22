import Navbar from '../components/Navbar';
import UpcomingDeadlines from '../components/UpcomingDeadlines';
import TodayAgenda from '../components/TodayAgenda';
import WeeklyScheduleCalendar, {
  buildTodayScheduleAgendaItems,
} from '../components/WeeklyScheduleCalendar';
import Footer from '../components/Footer';

function StudentCalendarPage({
  theme,
  onToggleTheme,
  onNavigate,
  onLogout,
  profile,
  tasks,
  onOpenTask,
  scheduleSlots,
}) {
  const todayAgendaItems = buildTodayScheduleAgendaItems(scheduleSlots, 'student');

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
        <section className="dashboard-card content-card">
          <WeeklyScheduleCalendar
            title="Неделен распоред"
            description="Часовите се распоредени по недели, како во едноставен classroom календар."
            slots={scheduleSlots}
            viewer="student"
            emptyText="Нема додадени часови за твојата недела."
          />
        </section>
        <section className="dashboard-grid">
          <UpcomingDeadlines tasks={tasks} onOpenTask={onOpenTask} />
          <TodayAgenda
            title="Денешни часови"
            items={todayAgendaItems}
            emptyText="Немаш закажани часови за денес."
          />
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default StudentCalendarPage;
