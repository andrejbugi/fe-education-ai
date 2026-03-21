import ThemeToggle from '../../components/ThemeToggle';
import AdminInvitationModal from './AdminInvitationModal';

function getPageWindow(currentPage, totalPages) {
  if (totalPages <= 1) {
    return [1];
  }

  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  return [...pages].filter((page) => page >= 1 && page <= totalPages).sort((left, right) => left - right);
}

function AdminDashboardPage({
  theme,
  palette,
  palettes,
  onChangePalette,
  paletteStyle,
  userName,
  schoolName,
  schoolOptions,
  selectedSchoolId,
  onSelectSchool,
  onLogout,
  onToggleTheme,
  activeTab,
  onChangeTab,
  createMenuOpen,
  onToggleCreateMenu,
  onOpenCreateModal,
  onOpenAssignmentModal,
  inviteModal,
  inviteEmail,
  onInviteEmailChange,
  onOpenInviteModal,
  onCloseInviteModal,
  onSubmitInvite,
  inviteLoading,
  inviteError,
  stats,
  schoolSummary,
  teachers,
  students,
  teacherCount,
  studentCount,
  classroomCount,
  subjectCount,
  studentDirectory,
  onChangeStudentPage,
  classrooms,
  subjects,
  loading,
  loadError,
}) {
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'setup', label: 'Setup' },
    { id: 'people', label: 'People' },
  ];

  const renderPeopleSection = (title, role, people, emptyMessage, options = {}) => {
    const pagination = options.pagination || null;
    const showPagination = Boolean(pagination && pagination.totalPages > 1);
    const pageWindow = showPagination ? getPageWindow(pagination.page, pagination.totalPages) : [];
    const rangeStart = pagination?.total ? (pagination.page - 1) * pagination.perPage + 1 : 0;
    const rangeEnd = pagination?.total ? rangeStart + people.length - 1 : 0;

    return (
      <section className="admin-people-section">
        <div className="admin-people-section-head">
          <div>
            <h2>{title}</h2>
            {pagination?.total ? (
              <p className="admin-section-caption">
                {pagination.total} вкупно · {pagination.perPage} по страница
              </p>
            ) : null}
          </div>
          <button
            type="button"
            className="admin-invite-button"
            aria-label={`Покани ${role === 'teacher' ? 'наставник' : 'ученик'}`}
            onClick={() => onOpenInviteModal(role)}
          >
            <span aria-hidden="true">+</span>
          </button>
        </div>
        <div className="admin-people-divider" />

        {people.length === 0 && !pagination?.loading ? (
          <div className="admin-empty-panel">
            <p>{emptyMessage}</p>
          </div>
        ) : (
          <>
            <ul className="list-reset admin-people-list">
              {people.map((person) => (
                <li key={person.id} className="admin-person-row">
                  <button
                    type="button"
                    className="admin-row-trigger"
                    onClick={() => onOpenAssignmentModal(role, person)}
                  >
                    <div className="admin-person-main">
                      <span
                        className={`admin-person-avatar ${
                          role === 'teacher' ? 'is-teacher' : 'is-student'
                        }`}
                      >
                        {person.name.slice(0, 1).toUpperCase()}
                      </span>
                      <div>
                        <strong>{person.name}</strong>
                        <p>{person.email || 'Без е-пошта'}</p>
                      </div>
                    </div>
                    <div className="admin-row-meta">
                      <span className={`admin-status-pill ${person.statusTone}`}>{person.statusLabel}</span>
                      {person.assignmentSummary ? <small>{person.assignmentSummary}</small> : null}
                    </div>
                  </button>
                </li>
              ))}
            </ul>

            {pagination ? (
              <div className="admin-people-footer">
                <div className="admin-people-footer-copy" aria-live="polite">
                  {pagination.loading ? (
                    <span>Се вчитува страница...</span>
                  ) : pagination.total > 0 ? (
                    <span>
                      Прикажани {rangeStart}-{rangeEnd} од {pagination.total}
                    </span>
                  ) : null}
                  {pagination.error ? <span className="admin-section-error">{pagination.error}</span> : null}
                </div>

                {showPagination ? (
                  <nav className="admin-pagination" aria-label="Страници за ученици">
                    <button
                      type="button"
                      className="admin-pagination-button"
                      onClick={() => onChangeStudentPage?.(pagination.page - 1)}
                      disabled={pagination.loading || pagination.page === 1}
                    >
                      Назад
                    </button>
                    {pageWindow.map((page, index) => {
                      const previousPage = pageWindow[index - 1];
                      const needsGap = previousPage && page - previousPage > 1;

                      return (
                        <span key={`student-page-${page}`} className="admin-pagination-slot">
                          {needsGap ? <span className="admin-pagination-gap">…</span> : null}
                          <button
                            type="button"
                            className={`admin-pagination-button ${
                              pagination.page === page ? 'is-active' : ''
                            }`}
                            aria-current={pagination.page === page ? 'page' : undefined}
                            onClick={() => onChangeStudentPage?.(page)}
                            disabled={pagination.loading}
                          >
                            {page}
                          </button>
                        </span>
                      );
                    })}
                    <button
                      type="button"
                      className="admin-pagination-button"
                      onClick={() => onChangeStudentPage?.(pagination.page + 1)}
                      disabled={pagination.loading || pagination.page === pagination.totalPages}
                    >
                      Напред
                    </button>
                  </nav>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </section>
    );
  };

  const renderOverviewTab = () => (
    <>
      <section className="quick-stats-row admin-stats-row">
        {stats.map((item) => (
          <article key={item.label} className="dashboard-card stat-card admin-stat-card">
            <p className="stat-label">{item.label}</p>
            <p className="stat-value">{item.value}</p>
            <p className="admin-stat-note">{item.note}</p>
          </article>
        ))}
      </section>

      <section className="dashboard-grid admin-dashboard-grid">
        <section className="dashboard-card content-card">
          <div className="admin-section-head">
            <div>
              <p className="hero-eyebrow">Училиште</p>
              <h2 className="section-title">Основен контекст</h2>
            </div>
            <span className={`admin-status-pill ${schoolSummary.active ? 'is-active' : 'is-inactive'}`}>
              {schoolSummary.active ? 'Активно' : 'Неактивно'}
            </span>
          </div>

          <dl className="admin-meta-grid">
            <div>
              <dt>Назив</dt>
              <dd>{schoolSummary.name || schoolName || 'Без назив'}</dd>
            </div>
            <div>
              <dt>Код</dt>
              <dd>{schoolSummary.code || 'Нема'}</dd>
            </div>
            <div>
              <dt>Град</dt>
              <dd>{schoolSummary.city || 'Нема'}</dd>
            </div>
            <div>
              <dt>Паралелки</dt>
              <dd>{schoolSummary.classroomCount}</dd>
            </div>
            <div>
              <dt>Предмети</dt>
              <dd>{schoolSummary.subjectCount}</dd>
            </div>
            <div>
              <dt>Теми</dt>
              <dd>{schoolSummary.topicCount}</dd>
            </div>
          </dl>
        </section>

        <section className="dashboard-card content-card">
          <div className="admin-section-head">
            <div>
              <p className="hero-eyebrow">People Snapshot</p>
              <h2 className="section-title">Кој е веќе внатре</h2>
            </div>
          </div>
          <ul className="list-reset admin-overview-list">
            <li className="admin-overview-row">
              <strong>Наставници</strong>
              <span>{teacherCount}</span>
            </li>
            <li className="admin-overview-row">
              <strong>Ученици</strong>
              <span>{studentCount}</span>
            </li>
            <li className="admin-overview-row">
              <strong>Паралелки</strong>
              <span>{classroomCount}</span>
            </li>
            <li className="admin-overview-row">
              <strong>Предмети</strong>
              <span>{subjectCount}</span>
            </li>
          </ul>
        </section>
      </section>
    </>
  );

  const renderPeopleTab = () => (
    <section className="admin-people-shell">
      {renderPeopleSection(
        'Teachers',
        'teacher',
        teachers,
        'Invite teachers to this school to start setting up subjects and classrooms.'
      )}
      {renderPeopleSection(
        'Students',
        'student',
        studentDirectory?.items || students,
        'Invite students or share the school onboarding flow once class setup is ready.',
        {
          pagination: studentDirectory,
        }
      )}
    </section>
  );

  const renderSetupTab = () => (
    <section className="admin-setup-shell">
      <section className="admin-setup-toolbar">
        <div className="admin-create-wrap">
          <button type="button" className="admin-create-button" onClick={onToggleCreateMenu}>
            <span aria-hidden="true">+</span>
            <span>Create</span>
          </button>
          {createMenuOpen ? (
            <div className="admin-create-menu">
              <button type="button" onClick={() => onOpenCreateModal('classroom')}>
                <span className="admin-create-menu-icon" aria-hidden="true">
                  □
                </span>
                Classroom
              </button>
              <button type="button" onClick={() => onOpenCreateModal('subject')}>
                <span className="admin-create-menu-icon" aria-hidden="true">
                  ≡
                </span>
                Subject
              </button>
            </div>
          ) : null}
        </div>

        <div className="admin-setup-links">
          <span>School setup</span>
          <span>Teacher preparation</span>
        </div>
      </section>

      <section className="admin-setup-guide">
        <h2>Подготви ја школската структура тука</h2>
        <ul className="list-reset admin-setup-guide-list">
          <li>Креирај паралелки за да можеш да организираш ученици по одделение.</li>
          <li>Додај предмети за да можеш подоцна да им ги доделиш на наставниците.</li>
          <li>Потоа продолжи во People за да испратиш покани и да ги врзеш профилите.</li>
        </ul>
      </section>

      <section className="dashboard-grid admin-dashboard-grid">
        <section className="dashboard-card content-card admin-list-shell">
          <div className="admin-section-head">
            <div>
              <p className="hero-eyebrow">Classrooms</p>
              <h2 className="section-title">Паралелки</h2>
            </div>
          </div>
          {classrooms.length === 0 ? (
            <p className="empty-state">Сè уште нема паралелки за ова училиште.</p>
          ) : (
            <ul className="list-reset admin-people-list">
              {classrooms.map((classroom) => (
                <li key={classroom.id} className="admin-person-row">
                  <button
                    type="button"
                    className="admin-row-trigger"
                    onClick={() => onOpenAssignmentModal('classroom', classroom)}
                  >
                    <div className="admin-person-main">
                      <span className="admin-person-avatar is-classroom">{classroom.name.slice(0, 1)}</span>
                      <div>
                        <strong>{classroom.name}</strong>
                        <p>{classroom.subtitle}</p>
                      </div>
                    </div>
                    <div className="admin-row-meta">
                      <span className="admin-status-pill is-neutral">{classroom.studentCount} ученици</span>
                      <small>{classroom.teacherCount} наставници</small>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="dashboard-card content-card admin-list-shell">
          <div className="admin-section-head">
            <div>
              <p className="hero-eyebrow">Subjects</p>
              <h2 className="section-title">Предмети</h2>
            </div>
          </div>
          {subjects.length === 0 ? (
            <p className="empty-state">Сè уште нема предмети за ова училиште.</p>
          ) : (
            <div className="admin-subject-grid admin-subject-grid-single">
              {subjects.map((subject) => (
                <button
                  key={subject.id}
                  type="button"
                  className="admin-subject-card admin-subject-card-button"
                  onClick={() => onOpenAssignmentModal('subject', subject)}
                >
                  <strong>{subject.name}</strong>
                  <p>{subject.code || 'Без код'}</p>
                  <div className="admin-subject-meta">
                    <span>{subject.topicCount} теми</span>
                    <span>{subject.teacherCount} наставници</span>
                    <span>{subject.classroomCount} паралелки</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </section>
    </section>
  );

  return (
    <div className={`dashboard-root admin-root theme-${theme}`} style={paletteStyle}>
      <header className="navbar admin-navbar">
        <div className="nav-brand admin-brand">
          <div>
            <span className="brand-logo">{schoolName || 'Edu Admin'}</span>
            <p className="admin-brand-subtitle">
              {schoolSummary.city || 'School setup workspace'}
              {schoolSummary.code ? ` · ${schoolSummary.code}` : ''}
            </p>
          </div>
        </div>

        <div className="admin-nav-center">
          <nav className="admin-tab-nav" aria-label="Admin sections">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`admin-tab-button ${activeTab === tab.id ? 'is-active' : ''}`}
                onClick={() => onChangeTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="nav-right">
          <div className="admin-palette-picker" aria-label="Admin color palette">
            {palettes.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`admin-palette-swatch ${palette === item.id ? 'is-active' : ''}`}
                style={{ '--swatch-color': item.swatch }}
                aria-label={`${item.label} palette`}
                aria-pressed={palette === item.id}
                onClick={() => onChangePalette(item.id)}
              />
            ))}
          </div>
          {schoolOptions.length > 1 ? (
            <label className="admin-school-select">
              <span>Училиште</span>
              <select
                value={selectedSchoolId}
                onChange={(event) => onSelectSchool(event.target.value)}
                disabled={loading}
              >
                {schoolOptions.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />
          <button type="button" className="top-action-btn" onClick={onLogout}>
            Одјава
          </button>
        </div>
      </header>

      <main className="dashboard-main admin-main">
        <section className="dashboard-card hero-card admin-hero-card">
          <p className="hero-eyebrow">Админ контролна табла</p>
          <h1 className="hero-title">{schoolName || 'Училишна подготовка'}</h1>
          <p className="hero-meta">
            {userName ? `${userName} · ` : ''}
            Подготви основна структура за наставниците и учениците без да се чепка нивниот
            работен простор.
          </p>
          <div className="hero-actions">
            <span className="admin-hero-chip">{teacherCount} наставници</span>
            <span className="admin-hero-chip">{studentCount} ученици</span>
            <span className="admin-hero-chip">{classroomCount} паралелки</span>
            <span className="admin-hero-chip">{subjectCount} предмети</span>
          </div>
          {loadError ? <p className="auth-error admin-load-error">{loadError}</p> : null}
        </section>

        {activeTab === 'overview' ? renderOverviewTab() : null}
        {activeTab === 'people' ? renderPeopleTab() : null}
        {activeTab === 'setup' ? renderSetupTab() : null}
      </main>

      {inviteModal ? (
        <AdminInvitationModal
          role={inviteModal}
          email={inviteEmail}
          onEmailChange={onInviteEmailChange}
          onClose={onCloseInviteModal}
          onSubmit={onSubmitInvite}
          loading={inviteLoading}
          error={inviteError}
        />
      ) : null}
    </div>
  );
}

export default AdminDashboardPage;
