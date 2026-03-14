import Navbar from '../components/Navbar';
import HeroNextCard from '../components/HeroNextCard';
import QuickStatsRow from '../components/QuickStatsRow';
import HomeworkListCard from '../components/HomeworkListCard';
import TodayCard from '../components/TodayCard';
import ProjectsCard from '../components/ProjectsCard';
import DeadlinesCard from '../components/DeadlinesCard';
import ProgressCard from '../components/ProgressCard';
import AnnouncementsCard from '../components/AnnouncementsCard';
import Footer from '../components/Footer';

function StudentDashboardPage({
  theme,
  onToggleTheme,
  onNavigate,
  onLogout,
  activePage = 'dashboard',
  nextTask,
  quickStats,
  tasks,
  todayItems,
  projects,
  deadlines,
  announcements,
  completedCount,
  weeklyProgress,
  average,
  onOpenTask,
}) {
  return (
    <div className={`dashboard-root theme-${theme}`}>
      <Navbar
        theme={theme}
        activePage={activePage}
        onToggleTheme={onToggleTheme}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      <main className="dashboard-main">
        <HeroNextCard item={nextTask} onContinue={onOpenTask} />
        <QuickStatsRow stats={quickStats} />

        <section className="dashboard-grid">
          <HomeworkListCard items={tasks} onOpenTask={onOpenTask} />
          <TodayCard items={todayItems} />
        </section>

        <section className="dashboard-grid">
          <ProjectsCard projects={projects} />
          <DeadlinesCard deadlines={deadlines} />
        </section>

        <section className="dashboard-grid">
          <ProgressCard
            completed={completedCount}
            average={average}
            weeklyProgress={weeklyProgress}
          />
          <AnnouncementsCard items={announcements} />
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default StudentDashboardPage;
