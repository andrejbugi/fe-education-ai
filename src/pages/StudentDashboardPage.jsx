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
  notifications,
  completedCount,
  weeklyProgress,
  average,
  onOpenTask,
  onContinueTask,
  onSubmitTask,
  listTitle = 'Домашни задачи',
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
        <HeroNextCard
          item={nextTask}
          onContinue={onContinueTask}
          onViewDetails={onOpenTask}
        />
        <QuickStatsRow stats={quickStats} />

        <section className="dashboard-grid">
          <HomeworkListCard
            items={tasks}
            onOpenTask={onOpenTask}
            onContinueTask={onContinueTask}
            onSubmitTask={onSubmitTask}
            title={listTitle}
          />
          <TodayCard items={todayItems} />
        </section>

        <section className="dashboard-grid">
          <ProjectsCard projects={projects} />
          <DeadlinesCard deadlines={deadlines} onOpenTask={onOpenTask} />
        </section>

        <section className="dashboard-grid">
          <ProgressCard
            completed={completedCount}
            average={average}
            weeklyProgress={weeklyProgress}
          />
          <AnnouncementsCard items={notifications} />
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default StudentDashboardPage;
