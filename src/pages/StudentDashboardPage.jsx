import { useEffect, useState } from 'react';
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
import QuizGamesCard from '../components/QuizGamesCard';

const STUDENT_TASK_TYPE_ORDER = ['домашна', 'чекори', 'вежба', 'квиз', 'тест', 'проект'];

function normalizeTaskType(type) {
  return String(type || '')
    .trim()
    .toLowerCase();
}

function formatTaskTypeLabel(type) {
  const normalized = normalizeTaskType(type);

  if (normalized === 'all') {
    return 'Сите';
  }
  if (normalized === 'домашна') {
    return 'Домашни';
  }
  if (normalized === 'чекори') {
    return 'По чекори';
  }
  if (normalized === 'вежба') {
    return 'Вежби';
  }
  if (normalized === 'квиз') {
    return 'Квизови';
  }
  if (normalized === 'тест') {
    return 'Тестови';
  }
  if (normalized === 'проект') {
    return 'Проекти';
  }

  const cleaned = normalized.replace(/_/g, ' ');
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function getTaskTypeMonogram(type) {
  const normalized = normalizeTaskType(type);

  if (normalized === 'домашна') {
    return 'Д';
  }
  if (normalized === 'чекори') {
    return 'Ч';
  }
  if (normalized === 'вежба') {
    return 'В';
  }
  if (normalized === 'квиз') {
    return 'К';
  }
  if (normalized === 'тест') {
    return 'Т';
  }
  if (normalized === 'проект') {
    return 'П';
  }

  return normalized.charAt(0).toUpperCase() || 'З';
}

function getStudentTaskStatus(task) {
  if (task?.submission?.status === 'reviewed') {
    return { label: 'Прегледано', tone: 'reviewed' };
  }
  if (task?.submission?.status === 'late' || task?.submission?.late) {
    return { label: 'Предадено со доцнење', tone: 'overdue' };
  }
  if (task?.submission?.submittedAt || task?.submission?.status === 'submitted') {
    return { label: 'Предадено', tone: 'submitted' };
  }
  if (task?.dueCategory === 'overdue') {
    return { label: 'Рокот е поминат', tone: 'overdue' };
  }
  if (task?.status === 'in_progress') {
    return { label: 'Во тек', tone: 'progress' };
  }

  return { label: 'Не е започнато', tone: 'idle' };
}

function getStudentTaskActionLabel(task) {
  if (task?.submission?.status === 'late' || task?.submission?.late) {
    return 'Прегледај';
  }
  if (task?.submission?.submittedAt || task?.submission?.status === 'submitted') {
    return 'Прегледај';
  }
  if (task?.status === 'in_progress' || task?.submission?.id) {
    return 'Продолжи';
  }

  return 'Решавај';
}

function getTaskDueFilter(task) {
  return task?.dueCategory === 'overdue' ? 'late' : 'active';
}

function StudentDashboardPage({
  theme,
  onToggleTheme,
  onNavigate,
  onLogout,
  activePage = 'dashboard',
  profile,
  nextTask,
  quickStats,
  tasks,
  announcements,
  onOpenAnnouncement,
  todayItems,
  projects,
  deadlines,
  notifications,
  completedCount,
  weeklyProgress,
  average,
  progress,
  onOpenTask,
  onContinueTask,
  onSubmitTask,
  dailyQuizAvailability,
  learningGamesAvailability,
  dailyQuiz,
  dailyQuizAnswer,
  learningGames,
  onOpenDailyQuiz,
  onOpenLearningGames,
  listTitle = 'Домашни задачи',
  showTypeFilters = false,
}) {
  const brandTitle = profile?.school || 'Ученички простор';
  const brandSubtitle = [profile?.fullName, profile?.className].filter(Boolean).join(' · ');
  const avatarLabel = profile?.initials || 'УЧ';
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const [selectedTaskType, setSelectedTaskType] = useState('all');
  const [selectedDueFilter, setSelectedDueFilter] = useState('active');

  useEffect(() => {
    setSelectedTaskType('all');
    setSelectedDueFilter('active');
  }, [activePage, showTypeFilters]);

  const dueFilteredTasks = safeTasks.filter((task) =>
    selectedDueFilter === 'late'
      ? getTaskDueFilter(task) === 'late'
      : getTaskDueFilter(task) === 'active'
  );
  const availableTaskTypes = Array.from(
    new Set(
      dueFilteredTasks
        .map((task) => normalizeTaskType(task?.type))
        .filter(Boolean)
    )
  ).sort((left, right) => {
    const leftIndex = STUDENT_TASK_TYPE_ORDER.indexOf(left);
    const rightIndex = STUDENT_TASK_TYPE_ORDER.indexOf(right);

    if (leftIndex === -1 && rightIndex === -1) {
      return left.localeCompare(right, 'mk');
    }
    if (leftIndex === -1) {
      return 1;
    }
    if (rightIndex === -1) {
      return -1;
    }

    return leftIndex - rightIndex;
  });
  const taskCountByType = dueFilteredTasks.reduce((counts, task) => {
    const key = normalizeTaskType(task?.type);
    if (!key) {
      return counts;
    }

    return {
      ...counts,
      [key]: (counts[key] || 0) + 1,
    };
  }, {});

  const filteredTasks =
    showTypeFilters && selectedTaskType !== 'all'
      ? dueFilteredTasks.filter((task) => normalizeTaskType(task?.type) === selectedTaskType)
      : dueFilteredTasks;
  const dueScopedListTitle = selectedDueFilter === 'late' ? 'Доцни задачи' : listTitle;
  const visibleListTitle =
    showTypeFilters && selectedTaskType !== 'all'
      ? `${formatTaskTypeLabel(selectedTaskType)}${selectedDueFilter === 'late' ? ' · Доцни' : ''}`
      : dueScopedListTitle;
  const classworkSections = (selectedTaskType === 'all'
    ? availableTaskTypes
    : availableTaskTypes.filter((taskType) => taskType === selectedTaskType)
  )
    .map((taskType) => ({
      id: taskType,
      label: formatTaskTypeLabel(taskType),
      items: dueFilteredTasks.filter((task) => normalizeTaskType(task?.type) === taskType),
    }))
    .filter((section) => section.items.length > 0);
  const reviewedCount = dueFilteredTasks.filter(
    (task) => task?.submission?.status === 'reviewed'
  ).length;
  const activeCount = dueFilteredTasks.filter((task) => task?.status === 'in_progress').length;
  const topActionTask =
    (nextTask && getTaskDueFilter(nextTask) === selectedDueFilter ? nextTask : null) ||
    dueFilteredTasks[0] ||
    null;
  const dueFilterOptions = [
    {
      id: 'active',
      label: 'Тековни',
      count: safeTasks.filter((task) => getTaskDueFilter(task) === 'active').length,
    },
    {
      id: 'late',
      label: 'Доцни',
      count: safeTasks.filter((task) => getTaskDueFilter(task) === 'late').length,
    },
  ];
  const filteredDeadlines = (Array.isArray(deadlines) ? deadlines : []).filter((item) =>
    selectedDueFilter === 'late' ? item?.category === 'overdue' : item?.category !== 'overdue'
  );

  if (showTypeFilters) {
    return (
      <div className={`dashboard-root theme-${theme} student-root`}>
        <Navbar
          theme={theme}
          activePage={activePage}
          onToggleTheme={onToggleTheme}
          onNavigate={onNavigate}
          onLogout={onLogout}
          brandTitle={brandTitle}
          brandSubtitle={brandSubtitle || 'Следи задачи и рокови'}
          avatarLabel={avatarLabel}
        />

        <main className="dashboard-main student-main">
          <section className="dashboard-card hero-card student-class-banner student-classwork-banner">
            <div className="student-banner-grid">
              <div>
                <p className="hero-eyebrow">Classwork</p>
                <h1 className="hero-title">{profile?.className || 'Мој клас'}</h1>
                <p className="student-banner-subtitle">
                  Организирани задачи по тип, со јасни рокови и статуси.
                </p>
                <p className="hero-meta">
                  {profile?.school || 'Училишен простор'}
                  {profile?.studentId ? ` · ID: ${profile.studentId}` : ''}
                </p>
              </div>
              <div className="student-banner-metrics">
                <article className="student-banner-metric">
                  <p>Вкупно задачи</p>
                  <strong>{dueFilteredTasks.length}</strong>
                </article>
                <article className="student-banner-metric">
                  <p>Во тек</p>
                  <strong>{activeCount}</strong>
                </article>
                <article className="student-banner-metric">
                  <p>Прегледани</p>
                  <strong>{reviewedCount}</strong>
                </article>
                <article className="student-banner-metric">
                  <p>Типови</p>
                  <strong>{availableTaskTypes.length || 1}</strong>
                </article>
              </div>
            </div>
          </section>

          <section className="dashboard-card student-classwork-shell">
            <div className="student-classwork-toolbar">
              <div className="student-classwork-actions">
                <button
                  type="button"
                  className="btn btn-primary student-classwork-primary"
                  onClick={() => {
                    if (topActionTask) {
                      onContinueTask(topActionTask.id);
                    }
                  }}
                  disabled={!topActionTask}
                >
                  {topActionTask
                    ? `${getStudentTaskActionLabel(topActionTask)}`
                    : 'Нема активна задача'}
                </button>
                <div className="student-classwork-summary">
                  <span>{visibleListTitle}</span>
                  <span>{filteredTasks.length} задачи</span>
                </div>
              </div>
              <div className="student-classwork-links">
                <button
                  type="button"
                  className="student-classwork-link"
                  onClick={() => onNavigate('calendar')}
                >
                  Календар
                </button>
                <button
                  type="button"
                  className="student-classwork-link"
                  onClick={() => onNavigate('notifications')}
                >
                  Известувања
                </button>
              </div>
            </div>

            <div className="student-task-filter-row" aria-label="Филтер по рок на задача">
              {dueFilterOptions.map((filterOption) => (
                <button
                  key={filterOption.id}
                  type="button"
                  className={`student-task-filter-chip ${selectedDueFilter === filterOption.id ? 'active' : ''}`}
                  onClick={() => setSelectedDueFilter(filterOption.id)}
                >
                  {filterOption.label}
                  <span>{filterOption.count}</span>
                </button>
              ))}
            </div>

            <div className="student-classwork-grid">
              <aside className="student-classwork-topics">
                <p className="student-classwork-topics-title">Сите теми</p>
                <div className="student-classwork-topic-list">
                  <button
                    type="button"
                    className={`student-classwork-topic ${selectedTaskType === 'all' ? 'active' : ''}`}
                    onClick={() => setSelectedTaskType('all')}
                  >
                    <span>Сите</span>
                    <strong>{dueFilteredTasks.length}</strong>
                  </button>
                  {availableTaskTypes.map((taskType) => (
                    <button
                      key={taskType}
                      type="button"
                      className={`student-classwork-topic ${selectedTaskType === taskType ? 'active' : ''}`}
                      onClick={() => setSelectedTaskType(taskType)}
                    >
                      <span>{formatTaskTypeLabel(taskType)}</span>
                      <strong>{taskCountByType[taskType] || 0}</strong>
                    </button>
                  ))}
                </div>
              </aside>

              <div className="student-classwork-content">
                {classworkSections.length === 0 ? (
                  <section className="student-classwork-section">
                    <div className="student-classwork-empty">
                      <h2>Нема задачи за овој филтер</h2>
                      <p>Избери друга тема или врати се на „Сите“ за да ги видиш сите задачи.</p>
                    </div>
                  </section>
                ) : (
                  classworkSections.map((section) => (
                    <section key={section.id} className="student-classwork-section">
                      <div className="student-classwork-section-header">
                        <h2>{section.label}</h2>
                        <span>{section.items.length}</span>
                      </div>
                      <div className="student-classwork-section-list">
                        {section.items.map((task) => {
                          const status = getStudentTaskStatus(task);

                          return (
                            <article
                              key={task.id}
                              className="student-classwork-item"
                            >
                              <div
                                className={`student-classwork-item-icon tone-${normalizeTaskType(task.type) || 'all'}`}
                              >
                                {getTaskTypeMonogram(task.type)}
                              </div>
                              <div className="student-classwork-item-copy">
                                <div className="student-classwork-item-head">
                                  <h3>{task.title}</h3>
                                  <span className={`student-classwork-status tone-${status.tone}`}>
                                    {status.label}
                                  </span>
                                </div>
                                <p className="student-classwork-item-meta">
                                  {task.subject}
                                  {task.classroomName ? ` · ${task.classroomName}` : ''}
                                  {task.teacherName ? ` · Наставник: ${task.teacherName}` : ''}
                                </p>
                                <p className="student-classwork-item-meta">
                                  Тип: {formatTaskTypeLabel(task.type)}
                                  {task.dueText ? ` · Рок: ${task.dueText}` : ''}
                                </p>
                                {task.submission?.feedback ? (
                                  <p className="student-classwork-item-note">
                                    Коментар: {task.submission.feedback}
                                  </p>
                                ) : null}
                              </div>
                              <div className="student-classwork-item-side">
                                {task.submission?.totalScore ? (
                                  <p className="student-classwork-item-score">
                                    {task.submission.totalScore}
                                    {task.maxPoints ? ` / ${task.maxPoints}` : ''}
                                  </p>
                                ) : (
                                  <p className="student-classwork-item-date">
                                    {task.dueText || 'Наскоро'}
                                  </p>
                                )}
                                <div className="student-classwork-item-actions">
                                  <button
                                    type="button"
                                    className="inline-action"
                                    onClick={() => onOpenTask(task.id)}
                                  >
                                    Отвори
                                  </button>
                                  <button
                                    type="button"
                                    className="inline-action"
                                    onClick={() => onContinueTask(task.id)}
                                  >
                                    {getStudentTaskActionLabel(task)}
                                  </button>
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </section>
                  ))
                )}
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className={`dashboard-root theme-${theme} student-root`}>
      <Navbar
        theme={theme}
        activePage={activePage}
        onToggleTheme={onToggleTheme}
        onNavigate={onNavigate}
        onLogout={onLogout}
        brandTitle={brandTitle}
        brandSubtitle={brandSubtitle || 'Следи задачи и рокови'}
        avatarLabel={avatarLabel}
      />

      <main className="dashboard-main student-main">
        <section className="dashboard-card hero-card student-class-banner">
          <div className="student-banner-grid">
            <div>
              <p className="hero-eyebrow">Мој клас</p>
              <h1 className="hero-title">{profile?.className || 'Мој клас'}</h1>
              <p className="student-banner-subtitle">{profile?.school || 'Училишен простор'}</p>
              <p className="hero-meta">
                {profile?.studentId ? `ID: ${profile.studentId}` : 'Подготви се за следната задача'}
                {profile?.email ? ` · ${profile.email}` : ''}
              </p>
            </div>
            <div className="student-banner-metrics">
              {quickStats.slice(0, 4).map((stat) => (
                <article key={stat.label} className="student-banner-metric">
                  <p>{stat.label}</p>
                  <strong>{stat.value}</strong>
                </article>
              ))}
            </div>
          </div>
        </section>

        <AnnouncementsCard
          items={announcements}
          maxItems={3}
          truncateWordsCount={18}
          onOpenItem={(item) => onOpenAnnouncement?.(item.id)}
          onSeeMore={() => onNavigate('notifications')}
          seeMoreLabel="Види повеќе"
        />

        <section className="student-dashboard-layout">
          <aside className="student-side-column">
            <DeadlinesCard deadlines={filteredDeadlines} onOpenTask={onOpenTask} />
            <ProgressCard
              completed={completedCount}
              average={average}
              weeklyProgress={weeklyProgress}
              progress={progress}
            />
            <QuickStatsRow stats={quickStats} />
          </aside>

          <div className="student-main-column">
            <HeroNextCard
              item={topActionTask}
              onContinue={onContinueTask}
              onViewDetails={onOpenTask}
            />
            <section className="dashboard-card student-task-toolbar">
              <div>
                <p className="student-task-toolbar-eyebrow">Филтрирај по рок</p>
                <h2 className="student-task-toolbar-title">Прикажи тековни или доцни задачи</h2>
              </div>
              <div className="student-task-filter-row" aria-label="Филтер по рок на задача">
                {dueFilterOptions.map((filterOption) => (
                  <button
                    key={filterOption.id}
                    type="button"
                    className={`student-task-filter-chip ${selectedDueFilter === filterOption.id ? 'active' : ''}`}
                    onClick={() => setSelectedDueFilter(filterOption.id)}
                  >
                    {filterOption.label}
                    <span>{filterOption.count}</span>
                  </button>
                ))}
              </div>
            </section>
            <HomeworkListCard
              items={filteredTasks}
              onOpenTask={onOpenTask}
              onContinueTask={onContinueTask}
              onSubmitTask={onSubmitTask}
              title={visibleListTitle}
            />
            <QuizGamesCard
              quizAvailability={dailyQuizAvailability}
              gamesAvailability={learningGamesAvailability}
              quiz={dailyQuiz}
              games={learningGames}
              answerRecord={dailyQuizAnswer}
              onOpenQuiz={onOpenDailyQuiz}
              onOpenGames={onOpenLearningGames}
            />
            <TodayCard items={todayItems} />
            <ProjectsCard projects={projects} />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default StudentDashboardPage;
