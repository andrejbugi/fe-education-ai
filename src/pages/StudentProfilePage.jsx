import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProfileInfoCard from '../components/ProfileInfoCard';
import ProfileSummaryRow from '../components/ProfileSummaryRow';
import ProfileSubjectPerformanceCard from '../components/ProfileSubjectPerformanceCard';
import ProfileProgressVisualsCard from '../components/ProfileProgressVisualsCard';
import ProfileRecentActivityCard from '../components/ProfileRecentActivityCard';
import ProfileSettingsCard from '../components/ProfileSettingsCard';

const STUDENT = {
  fullName: 'Андреј Костов',
  initials: 'АК',
  className: 'IX-2',
  school: 'ОУ Браќа Миладиновци',
  email: 'andrej.kostov@school.mk',
  studentId: 'ID-9241',
  mentor: 'проф. Марија Стојанова',
};

const SUBJECT_PERFORMANCE = [
  { name: 'Математика', score: 92 },
  { name: 'Македонски јазик', score: 84 },
  { name: 'Англиски јазик', score: 95 },
  { name: 'Историја', score: 76 },
  { name: 'Биологија', score: 88 },
  { name: 'Информатика', score: 97 },
];

const WEEKLY_TREND = [
  { day: 'Пон', progress: 55 },
  { day: 'Вто', progress: 62 },
  { day: 'Сре', progress: 74 },
  { day: 'Чет', progress: 68 },
  { day: 'Пет', progress: 83 },
  { day: 'Саб', progress: 48 },
  { day: 'Нед', progress: 64 },
];

const RECENT_ACTIVITIES = [
  'Предадена домашна по математика',
  'Завршен квиз по англиски',
  'Нов коментар од наставник',
  'Добиена оценка по историја',
  'Одлична работа оваа недела',
];

function StudentProfilePage({
  theme,
  onToggleTheme,
  onNavigate,
  onLogout,
  completedCount,
  activeCount,
  overdueCount,
  totalTaskCount,
  profile,
  performance,
  recentActivities,
  subjectPerformance,
  attendance,
}) {
  const summaryItems = [
    { label: 'Просечна оценка', value: performance?.averageGrade ?? '4.6' },
    { label: 'Завршени задачи', value: completedCount },
    { label: 'Активни задачи', value: activeCount },
    { label: 'Доцнења', value: performance?.missedAssignments ?? overdueCount },
    { label: 'Присуство', value: performance?.attendanceRate ?? '96%' },
    { label: 'Streak', value: performance?.streak ?? '6 дена' },
  ];

  const completionRatio = Math.min(
    100,
    Math.round((completedCount / Math.max(totalTaskCount, 1)) * 100)
  );

  return (
    <div className={`dashboard-root theme-${theme}`}>
      <Navbar
        theme={theme}
        activePage="profile"
        onToggleTheme={onToggleTheme}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      <main className="dashboard-main">
        <ProfileInfoCard student={profile || STUDENT} />
        <ProfileSummaryRow items={summaryItems} />

        <section className="dashboard-grid">
          <ProfileSubjectPerformanceCard subjects={subjectPerformance || SUBJECT_PERFORMANCE} />
          <ProfileProgressVisualsCard
            weeklyTrend={performance?.weeklyTrend || WEEKLY_TREND}
            completedRatio={completionRatio}
          />
        </section>

        <section className="dashboard-grid">
          <ProfileRecentActivityCard activities={recentActivities || RECENT_ACTIVITIES} />
          <ProfileSettingsCard theme={theme} onToggleTheme={onToggleTheme} />
        </section>

        <section className="dashboard-grid">
          <section className="dashboard-card content-card">
            <h2 className="section-title">Присуство</h2>
            {attendance?.summary ? (
              <div className="profile-settings-list">
                {attendance.summary.map((item) => (
                  <div key={item.label} className="profile-setting-item">
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-state">Нема податоци за присуство.</p>
            )}
          </section>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default StudentProfilePage;
