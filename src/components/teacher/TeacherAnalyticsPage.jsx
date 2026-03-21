import { useState } from 'react';
import TeacherClassTabs from './TeacherClassTabs';

function TeacherAnalyticsPage({
  classes = [],
  selectedClassroomId = '',
  onSelectClassroom,
  onNavigate,
  performanceOverview,
  reportsLoading = false,
}) {
  const [period, setPeriod] = useState('30');
  const students = performanceOverview?.students || [];
  const activeStudents = students.filter((student) => Number(student.engagementScore || 0) >= 70).length;
  const overdueStudents = students.filter((student) => Number(student.overdueAssignmentsCount || 0) > 0).length;

  return (
    <div className="teacher-page">
      <TeacherClassTabs
        classes={classes}
        selectedClassroomId={selectedClassroomId}
        onSelectClassroom={onSelectClassroom}
        activePage="reports"
        onNavigate={onNavigate}
      />

      <section className="teacher-page-header teacher-panel teacher-page-header-split">
        <div>
          <p className="teacher-page-eyebrow">Аналитика</p>
          <h1>Преглед на паралелка</h1>
          <p className="teacher-page-description">
            Краток увид во завршеност, оценување и активност, без тежок BI интерфејс.
          </p>
        </div>
        <div className="teacher-chip-row teacher-chip-row-period">
          <button
            type="button"
            className={`teacher-filter-chip ${period === '7' ? 'is-active' : ''}`}
            onClick={() => setPeriod('7')}
          >
            Последни 7 дена
          </button>
          <button
            type="button"
            className={`teacher-filter-chip ${period === '30' ? 'is-active' : ''}`}
            onClick={() => setPeriod('30')}
          >
            Последни 30 дена
          </button>
          <button
            type="button"
            className={`teacher-filter-chip ${period === 'semester' ? 'is-active' : ''}`}
            onClick={() => setPeriod('semester')}
          >
            Ова полугодие
          </button>
        </div>
      </section>

      {reportsLoading ? (
        <section className="teacher-panel">
          <p className="empty-state">Се вчитува аналитиката...</p>
        </section>
      ) : !performanceOverview ? (
        <section className="teacher-panel">
          <p className="empty-state">Нема извештај за избраната паралелка.</p>
        </section>
      ) : (
        <>
          <section className="teacher-page-grid">
            <article className="teacher-kpi-card teacher-panel">
              <span>Завршеност на задачи</span>
              <strong>{performanceOverview.averageEngagementScore}%</strong>
            </article>
            <article className="teacher-kpi-card teacher-panel">
              <span>Просечна оценка</span>
              <strong>{performanceOverview.averageGrade}</strong>
            </article>
            <article className="teacher-kpi-card teacher-panel">
              <span>Активни ученици</span>
              <strong>{activeStudents}</strong>
            </article>
            <article className="teacher-kpi-card teacher-panel">
              <span>Задоцнети предавања</span>
              <strong>{overdueStudents}</strong>
            </article>
          </section>

          <section className="teacher-page-grid teacher-page-grid-wide">
            <section className="teacher-panel">
              <div className="teacher-section-heading">
                <div>
                  <p className="teacher-section-label">Тренд</p>
                  <h2>Ученици по ангажман</h2>
                </div>
              </div>
              <div className="teacher-chart-list">
                {students.length === 0 ? (
                  <p className="empty-state">Нема доволно податоци.</p>
                ) : (
                  students.map((student) => (
                    <div key={student.id} className="teacher-chart-row">
                      <div className="teacher-chart-copy">
                        <strong>{student.name}</strong>
                        <span>{student.engagementScore}% ангажман</span>
                      </div>
                      <div className="teacher-chart-track">
                        <div
                          className="teacher-chart-fill teacher-chart-fill-primary"
                          style={{ width: `${Math.max(6, Number(student.engagementScore || 0))}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="teacher-panel">
              <div className="teacher-section-heading">
                <div>
                  <p className="teacher-section-label">Ризик</p>
                  <h2>Ученици со доцнење</h2>
                </div>
              </div>
              <div className="teacher-chart-list">
                {students.length === 0 ? (
                  <p className="empty-state">Нема доволно податоци.</p>
                ) : (
                  students.map((student) => (
                    <div key={`${student.id}-late`} className="teacher-chart-row">
                      <div className="teacher-chart-copy">
                        <strong>{student.name}</strong>
                        <span>{student.overdueAssignmentsCount} задоцнети задачи</span>
                      </div>
                      <div className="teacher-chart-track">
                        <div
                          className="teacher-chart-fill teacher-chart-fill-warn"
                          style={{
                            width: `${Math.max(6, Math.min(100, Number(student.overdueAssignmentsCount || 0) * 18))}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </section>
        </>
      )}
    </div>
  );
}

export default TeacherAnalyticsPage;
