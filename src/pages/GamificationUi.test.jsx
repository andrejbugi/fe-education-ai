import { render, screen } from '@testing-library/react';
import StudentDashboardPage from './StudentDashboardPage';
import StudentProfilePage from './StudentProfilePage';

const baseProfile = {
  fullName: 'Марија Стојанова',
  initials: 'МС',
  className: '7-A',
  school: 'ОУ Браќа Миладиновци',
  email: 'student1@edu.mk',
  studentId: 'ID-9241',
};

const baseProgress = {
  totalXp: 155,
  totalXpLabel: '155 XP',
  currentLevel: 2,
  currentLevelLabel: 'Ниво 2',
  currentStreak: 5,
  currentStreakLabel: '5 дена',
  longestStreak: 5,
  longestStreakLabel: '5 дена',
  nextLevelXp: 200,
  xpToNextLevel: 45,
  nextLevelText: 'Уште 45 XP до 200',
  levelProgressPercent: 55,
  badgesCount: 2,
  lastActiveLabel: '17.03.2026',
  breakdown: {
    completedAssignments: 90,
    gradeBonus: 40,
    attendance: 10,
    aiLearning: 5,
  },
  badges: [
    {
      id: 'badge-1',
      code: 'ai_explorer',
      name: 'AI истражувач',
      description: 'Започната е AI сесија за учење.',
      awardedAt: '2026-03-17T10:20:30.000Z',
    },
    {
      id: 'badge-2',
      code: 'first_completion',
      name: 'Прва победа',
      description: 'Завршена е првата задача.',
      awardedAt: '2026-03-16T10:20:30.000Z',
    },
  ],
};

test('student dashboard renders gamification progress card', () => {
  render(
    <StudentDashboardPage
      theme="light"
      onToggleTheme={() => {}}
      onNavigate={() => {}}
      onLogout={() => {}}
      activePage="dashboard"
      profile={baseProfile}
      nextTask={null}
      quickStats={[]}
      tasks={[]}
      announcements={[]}
      onOpenAnnouncement={() => {}}
      todayItems={[]}
      projects={[]}
      deadlines={[]}
      notifications={[]}
      completedCount={5}
      weeklyProgress={55}
      average="92.5"
      progress={baseProgress}
      onOpenTask={() => {}}
      onContinueTask={() => {}}
      onSubmitTask={() => {}}
    />
  );

  expect(screen.getByText(/Ниво 2/i)).toBeInTheDocument();
  expect(screen.getByText(/155 XP/i)).toBeInTheDocument();
  expect(screen.getByText(/AI истражувач/i)).toBeInTheDocument();
  expect(screen.getByText(/Уште 45 XP/i)).toBeInTheDocument();
});

test('student profile renders rewards and progress details', () => {
  render(
    <StudentProfilePage
      theme="light"
      onToggleTheme={() => {}}
      onNavigate={() => {}}
      onLogout={() => {}}
      completedCount={5}
      activeCount={1}
      overdueCount={0}
      totalTaskCount={6}
      profile={baseProfile}
      performance={{
        averageGrade: '92.5',
        attendanceRate: '100%',
        missedAssignments: 0,
        streak: '5 дена',
        weeklyTrend: [
          { day: 'Пон', progress: 50 },
          { day: 'Вто', progress: 60 },
          { day: 'Сре', progress: 70 },
          { day: 'Чет', progress: 80 },
          { day: 'Пет', progress: 55 },
          { day: 'Саб', progress: 20 },
          { day: 'Нед', progress: 45 },
        ],
      }}
      progress={baseProgress}
      recentActivities={['Предадена задача']}
      subjectPerformance={[{ name: 'Математика', score: 92 }]}
      attendance={{ summary: [{ label: 'Присутен', value: 5 }] }}
    />
  );

  expect(screen.getByRole('heading', { name: /Значки и награди/i })).toBeInTheDocument();
  expect(screen.getByText(/Прва победа/i)).toBeInTheDocument();
  expect(screen.getByText(/Вкупно XP/i)).toBeInTheDocument();
  expect(screen.getByText(/Уште 45 XP до 200/i)).toBeInTheDocument();
});
