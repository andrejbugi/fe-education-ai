function TeacherClassTabs({
  classes = [],
  selectedClassroomId = '',
  onSelectClassroom,
  activePage = 'assignments',
  onNavigate,
}) {
  if (!Array.isArray(classes) || classes.length === 0) {
    return null;
  }

  const tabs = [
    { page: 'assignments', label: 'Задачи' },
    { page: 'students', label: 'Ученици' },
    { page: 'grades', label: 'Оценки' },
    { page: 'reports', label: 'Аналитика' },
  ];
  const selectedClassroom =
    classes.find((classroom) => String(classroom.id) === String(selectedClassroomId)) || classes[0];
  const metaItems = [
    selectedClassroom?.gradeLevel ? `${selectedClassroom.gradeLevel} одделение` : '',
    selectedClassroom?.academicYear || '',
    Number.isFinite(Number(selectedClassroom?.students))
      ? `${selectedClassroom.students} ученици`
      : '',
  ].filter(Boolean);

  return (
    <section className="teacher-classroom-shell teacher-panel">
      <div className="teacher-classroom-shell-head">
        <div className="teacher-page-toolbar-copy teacher-classroom-shell-copy">
          <p className="teacher-page-toolbar-label">Паралелка</p>
          <h2>{selectedClassroom?.name || 'Клас'}</h2>
          <p>{metaItems.length > 0 ? metaItems.join(' · ') : 'Без избрана паралелка'}</p>
        </div>

        <label className="teacher-inline-select teacher-classroom-select">
          <span>Избери клас</span>
          <select
            value={selectedClassroomId || selectedClassroom?.id || ''}
            onChange={(event) => onSelectClassroom?.(event.target.value)}
          >
            {classes.map((classroom) => (
              <option key={classroom.id} value={classroom.id}>
                {classroom.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <nav className="teacher-class-tabs-nav teacher-classroom-tabs" aria-label="Навигација во паралелка">
        {tabs.map((tab) => (
          <button
            key={tab.page}
            type="button"
            className={`teacher-class-tab ${activePage === tab.page ? 'is-active' : ''}`}
            onClick={() => onNavigate?.(tab.page)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </section>
  );
}

export default TeacherClassTabs;
