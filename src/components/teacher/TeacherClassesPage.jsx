import TeacherClassTabs from './TeacherClassTabs';

function TeacherClassesPage({
  classes = [],
  selectedClassroomId = '',
  onSelectClassroom,
  classroomDetails,
  classroomDetailsLoading = false,
  onOpenStudent,
  onOpenAssignment,
  onNavigate,
}) {
  const selectedClassroom =
    classes.find((classroom) => String(classroom.id) === String(selectedClassroomId)) || classes[0];

  return (
    <div className="teacher-page">
      <section className="teacher-page-header teacher-panel">
        <div>
          <p className="teacher-page-eyebrow">Паралелки</p>
          <h1>Преглед на паралелки</h1>
          <p className="teacher-page-description">
            Едноставен преглед на сите паралелки со брз пристап до ученици, задачи и оценување.
          </p>
        </div>
      </section>

      <TeacherClassTabs
        classes={classes}
        selectedClassroomId={selectedClassroomId}
        onSelectClassroom={onSelectClassroom}
        activePage="classes"
        onNavigate={onNavigate}
      />

      <section className="teacher-page-grid teacher-page-grid-wide">
        <section className="teacher-panel teacher-list-panel">
          <div className="teacher-section-heading">
            <div>
              <p className="teacher-section-label">Листа</p>
              <h2>Сите паралелки</h2>
            </div>
          </div>

          {classes.length === 0 ? (
            <p className="empty-state">Нема достапни паралелки.</p>
          ) : (
            <div className="teacher-roster-list">
              {classes.map((classroom) => (
                <button
                  key={classroom.id}
                  type="button"
                  className={`teacher-roster-row ${
                    String(selectedClassroomId) === String(classroom.id) ? 'is-active' : ''
                  }`}
                  onClick={() => onSelectClassroom?.(classroom.id)}
                >
                  <div className="teacher-roster-row-copy">
                    <strong>{classroom.name}</strong>
                    <p>
                      {classroom.gradeLevel} одделение · {classroom.academicYear}
                    </p>
                  </div>
                  <div className="teacher-roster-row-meta">
                    <span>{classroom.students} ученици</span>
                    <span>{classroom.assignmentCount || 0} задачи</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="teacher-panel teacher-detail-panel">
          <div className="teacher-section-heading">
            <div>
              <p className="teacher-section-label">Детали</p>
              <h2>{selectedClassroom?.name || 'Избрана паралелка'}</h2>
            </div>
          </div>

          {classroomDetailsLoading ? (
            <p className="empty-state">Се вчитуваат деталите...</p>
          ) : !classroomDetails ? (
            <p className="empty-state">Одбери паралелка за детали.</p>
          ) : (
            <>
              <div className="teacher-detail-summary teacher-detail-summary-hero">
                <div>
                  <strong>{classroomDetails.name}</strong>
                  <p>
                    {classroomDetails.gradeLevel} одделение · {classroomDetails.academicYear}
                  </p>
                  <p>
                    Предмети:{' '}
                    {classroomDetails.subjects.length > 0
                      ? classroomDetails.subjects.map((subject) => subject.name).join(', ')
                      : 'Нема податоци'}
                  </p>
                </div>
                <div className="teacher-detail-facts">
                  <article className="teacher-detail-fact">
                    <span>Ученици</span>
                    <strong>{classroomDetails.students.length}</strong>
                  </article>
                  <article className="teacher-detail-fact">
                    <span>Активни задачи</span>
                    <strong>{classroomDetails.activeAssignments.length}</strong>
                  </article>
                </div>
              </div>

              <div className="teacher-page-grid teacher-page-grid-equal">
                <section className="teacher-subpanel teacher-subpanel-flat">
                  <div className="teacher-section-heading">
                    <h3>Ученици</h3>
                  </div>
                  {classroomDetails.students.length === 0 ? (
                    <p className="empty-state">Нема ученици.</p>
                  ) : (
                    <ul className="teacher-simple-list list-reset">
                      {classroomDetails.students.map((student) => (
                        <li key={student.id} className="teacher-simple-row">
                          <div>
                            <strong>{student.fullName}</strong>
                            <p>
                              Просек: {student.averageGrade ?? 'Нема'} · Предавање:{' '}
                              {student.submissionRate ?? 'Нема'}
                            </p>
                          </div>
                          <button
                            type="button"
                            className="inline-action"
                            onClick={() => onOpenStudent?.(student.id)}
                          >
                            Отвори
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="teacher-subpanel teacher-subpanel-flat">
                  <div className="teacher-section-heading">
                    <h3>Активни задачи</h3>
                  </div>
                  {classroomDetails.activeAssignments.length === 0 ? (
                    <p className="empty-state">Нема активни задачи.</p>
                  ) : (
                    <ul className="teacher-simple-list list-reset">
                      {classroomDetails.activeAssignments.map((assignment) => (
                        <li key={assignment.id} className="teacher-simple-row">
                          <div>
                            <strong>{assignment.title}</strong>
                            <p>
                              {assignment.status} {assignment.dueAt ? `· ${assignment.dueAt}` : ''}
                            </p>
                          </div>
                          <button
                            type="button"
                            className="inline-action"
                            onClick={() => onOpenAssignment?.(assignment.id)}
                          >
                            Отвори
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            </>
          )}
        </section>
      </section>
    </div>
  );
}

export default TeacherClassesPage;
