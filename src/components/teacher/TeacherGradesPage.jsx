import TeacherClassTabs from './TeacherClassTabs';

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatRate(value, suffix = '%') {
  if (value === null || value === undefined || value === '') {
    return 'Нема';
  }

  return `${value}${suffix}`;
}

function TeacherGradesPage({
  classes = [],
  selectedClassroomId = '',
  onSelectClassroom,
  onNavigate,
  teacherAssignments = [],
  selectedAssignmentId = '',
  onSelectAssignment,
  classroomDetails,
  classroomDetailsLoading = false,
  assignmentDetails,
  assignmentRoster = [],
  assignmentRosterLoading = false,
  onOpenStudent,
}) {
  const classAssignments = teacherAssignments.filter(
    (assignment) => String(assignment.classroomId) === String(selectedClassroomId)
  );
  const averageGrade =
    classroomDetails?.students?.length > 0
      ? (
          classroomDetails.students.reduce((sum, student) => sum + toNumber(student.averageGrade), 0) /
          classroomDetails.students.length
        ).toFixed(1)
      : '0.0';
  const averageSubmissionRate =
    classroomDetails?.students?.length > 0
      ? (
          classroomDetails.students.reduce((sum, student) => sum + toNumber(student.submissionRate), 0) /
          classroomDetails.students.length
        ).toFixed(0)
      : '0';
  const rosterById = assignmentRoster.reduce((acc, row) => ({ ...acc, [row.id]: row }), {});

  return (
    <div className="teacher-page">
      <TeacherClassTabs
        classes={classes}
        selectedClassroomId={selectedClassroomId}
        onSelectClassroom={onSelectClassroom}
        activePage="grades"
        onNavigate={onNavigate}
      />

      <section className="teacher-panel teacher-page-header teacher-page-header-split">
        <div>
          <p className="teacher-page-eyebrow">Оценки</p>
          <h1>Табела за оценки</h1>
          <p className="teacher-page-description">
            Преглед по ученик со фокус на една задача, слично на едноставен Classroom gradebook.
          </p>
        </div>
        <div className="teacher-detail-facts teacher-detail-facts-compact">
          <article className="teacher-detail-fact">
            <span>Просек</span>
            <strong>{averageGrade}</strong>
          </article>
          <article className="teacher-detail-fact">
            <span>Предадено</span>
            <strong>{averageSubmissionRate}%</strong>
          </article>
          <article className="teacher-detail-fact">
            <span>Задачи</span>
            <strong>{classAssignments.length}</strong>
          </article>
        </div>
      </section>

      <section className="teacher-panel teacher-gradebook-toolbar">
        <div className="teacher-section-heading">
          <div>
            <p className="teacher-section-label">Колони</p>
            <h2>Фокус задача</h2>
          </div>
        </div>

        {classAssignments.length === 0 ? (
          <p className="empty-state">Нема задачи за оваа паралелка.</p>
        ) : (
          <div className="teacher-gradebook-controls">
            <label className="teacher-inline-select teacher-gradebook-select">
              <span>Избери задача</span>
              <select
                value={selectedAssignmentId || classAssignments[0]?.id || ''}
                onChange={(event) => onSelectAssignment?.(event.target.value)}
              >
                {classAssignments.map((assignment) => (
                  <option key={assignment.id} value={assignment.id}>
                    {assignment.title}
                  </option>
                ))}
              </select>
            </label>

            <div className="teacher-gradebook-summary">
              <span>{assignmentDetails?.title || 'Нема избрана задача'}</span>
              <strong>
                {assignmentDetails?.submissionCount || 0} предавања · {assignmentDetails?.maxPoints || 'Нема'} поени
              </strong>
            </div>
          </div>
        )}
      </section>

      <section className="teacher-panel teacher-gradebook-panel">
        <div className="teacher-section-heading">
          <div>
            <p className="teacher-section-label">Оценки</p>
            <h2>Преглед по ученик</h2>
          </div>
        </div>

        {classroomDetailsLoading ? (
          <p className="empty-state">Се вчитуваат учениците...</p>
        ) : !classroomDetails ? (
          <p className="empty-state">Избери паралелка за табелата.</p>
        ) : (
          <div className="teacher-table-wrap">
            <table className="teacher-table teacher-grade-table">
              <thead>
                <tr>
                  <th>Ученик</th>
                  <th>Просек</th>
                  <th>Предадено</th>
                  <th>Статус на задача</th>
                  <th>Поени</th>
                  <th>Акција</th>
                </tr>
              </thead>
              <tbody>
                {classroomDetails.students.length === 0 ? (
                  <tr>
                    <td colSpan={6}>Нема ученици во оваа паралелка.</td>
                  </tr>
                ) : (
                  classroomDetails.students.map((student) => {
                    const focusedRow = rosterById[student.id];

                    return (
                      <tr key={student.id}>
                        <td>{student.fullName}</td>
                        <td>{student.averageGrade ?? 'Нема'}</td>
                        <td>{formatRate(student.submissionRate)}</td>
                        <td>
                          {assignmentRosterLoading
                            ? 'Се вчитува...'
                            : focusedRow?.statusLabel || assignmentDetails?.title || 'Нема задача'}
                        </td>
                        <td>{focusedRow?.totalScore || 'Нема'}</td>
                        <td>
                          <button
                            type="button"
                            className="inline-action"
                            onClick={() => onOpenStudent?.(student.id)}
                          >
                            Профил
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default TeacherGradesPage;
