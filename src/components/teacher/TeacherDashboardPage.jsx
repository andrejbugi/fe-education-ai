function TeacherDashboardPage({
  featuredClassroomLabel,
  teacherName,
  school,
  overviewCards = [],
  calendarItems = [],
  classes = [],
  reviewQueue = [],
  announcements = [],
  activities = [],
  loadError = '',
  onNavigate,
  onOpenCreate,
}) {
  return (
    <div className="teacher-page">
      <section className="teacher-page-header teacher-panel teacher-page-header-split">
        <div>
          <p className="teacher-page-eyebrow">Контролна табла</p>
          <h1>{featuredClassroomLabel}</h1>
          <p className="teacher-page-subtitle">
            {teacherName ? `${teacherName} · ` : ''}
            {school || 'Наставнички простор'}
          </p>
          <p className="teacher-page-description">
            Едноставен преглед на рокови, паралелки, задачи и предавања што чекаат проверка.
          </p>
          <div className="teacher-action-row">
            <button type="button" className="btn btn-primary" onClick={onOpenCreate}>
              Креирај задача
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => onNavigate?.('assignments')}>
              Отвори задачи
            </button>
          </div>
          {loadError ? <p className="auth-error">{loadError}</p> : null}
        </div>

        <div className="teacher-kpi-grid teacher-kpi-grid-compact">
          {overviewCards.map((item) => (
            <article key={item.label} className="teacher-kpi-card">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="teacher-page-grid teacher-page-grid-wide">
        <section className="teacher-panel">
          <div className="teacher-section-heading">
            <div>
              <p className="teacher-section-label">Наскоро</p>
              <h2>Календар и рокови</h2>
            </div>
            <button type="button" className="inline-action" onClick={() => onNavigate?.('calendar')}>
              Отвори календар
            </button>
          </div>

          {calendarItems.length === 0 ? (
            <p className="empty-state">Нема рокови во следниот период.</p>
          ) : (
            <ul className="teacher-simple-list list-reset">
              {calendarItems.slice(0, 4).map((item) => (
                <li key={item.id} className="teacher-simple-row">
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.when}</p>
                  </div>
                  <span className="teacher-tag">Рок</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="teacher-panel">
          <div className="teacher-section-heading">
            <div>
              <p className="teacher-section-label">За проверка</p>
              <h2>Нови предавања</h2>
            </div>
            <button type="button" className="inline-action" onClick={() => onNavigate?.('students')}>
              Отвори ученици
            </button>
          </div>

          {reviewQueue.length === 0 ? (
            <p className="empty-state">Нема предавања за преглед.</p>
          ) : (
            <ul className="teacher-simple-list list-reset">
              {reviewQueue.slice(0, 5).map((item) => (
                <li key={item.id} className="teacher-simple-row">
                  <div>
                    <strong>{item.assignmentTitle}</strong>
                    <p>
                      {item.studentName} · {item.className}
                    </p>
                  </div>
                  <span>{item.submittedAt}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>

      <section className="teacher-page-grid">
        <section className="teacher-panel">
          <div className="teacher-section-heading">
            <div>
              <p className="teacher-section-label">Паралелки</p>
              <h2>Мои класови</h2>
            </div>
            <button type="button" className="inline-action" onClick={() => onNavigate?.('classes')}>
              Види сите
            </button>
          </div>

          {classes.length === 0 ? (
            <p className="empty-state">Нема достапни паралелки.</p>
          ) : (
            <div className="teacher-card-grid">
              {classes.map((classroom) => (
                <article key={classroom.id} className="teacher-mini-card">
                  <strong>{classroom.name}</strong>
                  <p>{classroom.gradeLevel} одделение</p>
                  <p>{classroom.students} ученици</p>
                  <p>{classroom.assignmentCount} активни задачи</p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="teacher-panel">
          <div className="teacher-section-heading">
            <div>
              <p className="teacher-section-label">Поток</p>
              <h2>Објави</h2>
            </div>
            <button
              type="button"
              className="inline-action"
              onClick={() => onNavigate?.('announcements')}
            >
              Управувај
            </button>
          </div>

          {announcements.length === 0 ? (
            <p className="empty-state">Нема објави.</p>
          ) : (
            <ul className="teacher-simple-list list-reset">
              {announcements.slice(0, 4).map((item) => (
                <li key={item.id} className="teacher-simple-row">
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.body || 'Без опис'}</p>
                  </div>
                  <span className={`teacher-tag priority-${item.priority}`}>{item.priorityLabel}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>

      <section className="teacher-panel">
        <div className="teacher-section-heading">
          <div>
            <p className="teacher-section-label">Преглед</p>
            <h2>Активност по паралелка</h2>
          </div>
        </div>
        {activities.length === 0 ? (
          <p className="empty-state">Нема активности.</p>
        ) : (
          <ul className="teacher-activity-list list-reset">
            {activities.map((activity) => (
              <li key={activity}>{activity}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default TeacherDashboardPage;
