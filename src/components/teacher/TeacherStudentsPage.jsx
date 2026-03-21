import { useState } from 'react';
import TeacherClassTabs from './TeacherClassTabs';

function TeacherStudentsPage({
  classes = [],
  selectedClassroomId = '',
  onSelectClassroom,
  activePage = 'students',
  onNavigate,
  teacherName,
  school,
  subjects = [],
  students = [],
  selectedStudentId = '',
  onSelectStudent,
  studentDetails,
  studentDetailsLoading = false,
  reviewQueue = [],
  onOpenSubmissionReview,
  onNotify,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [openMenuId, setOpenMenuId] = useState('');
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredStudents = normalizedSearch
    ? students.filter((student) => student.fullName.toLowerCase().includes(normalizedSearch))
    : students;

  return (
    <div className="teacher-page">
      <TeacherClassTabs
        classes={classes}
        selectedClassroomId={selectedClassroomId}
        onSelectClassroom={onSelectClassroom}
        activePage={activePage}
        onNavigate={onNavigate}
      />

      <section className="teacher-page-grid teacher-page-grid-wide">
        <section className="teacher-panel teacher-people-panel">
          <div className="teacher-people-section teacher-people-section-teachers">
            <div className="teacher-section-heading teacher-section-heading-tight">
              <div>
                <p className="teacher-section-label">Наставници</p>
                <h2>Наставнички тим</h2>
              </div>
            </div>

            <div className="teacher-person-row teacher-person-row-teacher">
              <div className="teacher-avatar-circle">{String(teacherName || 'Н').slice(0, 1)}</div>
              <div className="teacher-person-copy">
                <strong>{teacherName || 'Наставник'}</strong>
                <p>{school || 'Училиште'}</p>
                <p>
                  {subjects.length > 0
                    ? subjects.map((subject) => subject.name).join(', ')
                    : 'Предметите ќе се појават тука'}
                </p>
              </div>
            </div>
          </div>

          <div className="teacher-people-divider" />

          <div className="teacher-people-section teacher-people-section-students">
            <div className="teacher-section-heading teacher-section-heading-people">
              <div>
                <p className="teacher-section-label">Ученици</p>
                <h2>{filteredStudents.length} ученици</h2>
              </div>
            </div>

            <label className="teacher-search-field teacher-search-field-compact">
              <span>Пребарај ученик</span>
              <input
                type="search"
                placeholder="Име и презиме"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>

            {filteredStudents.length === 0 ? (
              <p className="empty-state">Нема ученици за ова пребарување.</p>
            ) : (
              <div className="teacher-roster-list teacher-people-list">
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className={`teacher-person-row ${
                      String(selectedStudentId) === String(student.id) ? 'is-active' : ''
                    }`}
                  >
                    <label className="teacher-person-select">
                      <input
                        type="checkbox"
                        checked={String(selectedStudentId) === String(student.id)}
                        onChange={() => onSelectStudent?.(student.id)}
                      />
                      <div className="teacher-avatar-circle">
                        {String(student.fullName || 'У').slice(0, 1)}
                      </div>
                      <div className="teacher-person-copy">
                        <strong>{student.fullName}</strong>
                        <p>
                          Просек: {student.averageGrade ?? 'Нема'} · Стапка на предавање:{' '}
                          {student.submissionRate ?? 'Нема'}
                        </p>
                      </div>
                    </label>

                    <div className="teacher-row-menu-wrap">
                      <button
                        type="button"
                        className="teacher-icon-button"
                        aria-label={`Акции за ${student.fullName}`}
                        onClick={() =>
                          setOpenMenuId((current) => (current === student.id ? '' : student.id))
                        }
                      >
                        ⋮
                      </button>

                      {openMenuId === student.id ? (
                        <div className="teacher-row-menu">
                          <button
                            type="button"
                            onClick={() => {
                              onSelectStudent?.(student.id);
                              setOpenMenuId('');
                            }}
                          >
                            Погледни профил
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onSelectStudent?.(student.id);
                              onNavigate?.('assignments');
                              setOpenMenuId('');
                            }}
                          >
                            Погледни задачи
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onSelectStudent?.(student.id);
                              onNavigate?.('grades');
                              setOpenMenuId('');
                            }}
                          >
                            Погледни оценки
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="teacher-panel teacher-student-profile-panel">
          <div className="teacher-section-heading">
            <div>
              <p className="teacher-section-label">Профил</p>
              <h2>Избран ученик</h2>
            </div>
          </div>

          {studentDetailsLoading ? (
            <p className="empty-state">Се вчитува профилот...</p>
          ) : !studentDetails ? (
            <p className="empty-state">Одбери ученик за детали.</p>
          ) : (
            <>
              <div className="teacher-student-hero teacher-student-hero-profile">
                <div className="teacher-avatar-large">
                  {String(studentDetails.fullName || 'У').slice(0, 1)}
                </div>
                <div>
                  <h3>{studentDetails.fullName}</h3>
                  <p>{studentDetails.email}</p>
                  <p>
                    {studentDetails.classrooms.length > 0
                      ? studentDetails.classrooms.map((classroom) => classroom.name).join(', ')
                      : 'Без поврзани паралелки'}
                  </p>
                </div>
              </div>

              <section className="teacher-subpanel teacher-subpanel-flat">
                <div className="teacher-section-heading">
                  <h3>Предмети</h3>
                </div>
                {studentDetails.subjects.length === 0 ? (
                  <p className="empty-state">Нема предмети.</p>
                ) : (
                  <ul className="teacher-simple-list list-reset">
                    {studentDetails.subjects.map((subject) => (
                      <li key={subject.id} className="teacher-simple-row">
                        <div>
                          <strong>{subject.name}</strong>
                          <p>
                            Тековна оценка: {subject.currentGrade} · Непредадени:{' '}
                            {subject.missingAssignments}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="teacher-subpanel teacher-subpanel-flat">
                <div className="teacher-section-heading">
                  <h3>Редица за преглед</h3>
                </div>
                {reviewQueue.length === 0 ? (
                  <p className="empty-state">Нема предавања за преглед во оваа паралелка.</p>
                ) : (
                  <ul className="teacher-simple-list list-reset">
                    {reviewQueue.slice(0, 5).map((item) => (
                      <li key={item.id} className="teacher-simple-row">
                        <div>
                          <strong>{item.assignmentTitle}</strong>
                          <p>
                            {item.studentName} · {item.submittedAt}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="inline-action"
                          onClick={() => onOpenSubmissionReview?.(item)}
                        >
                          Отвори
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </section>
      </section>
    </div>
  );
}

export default TeacherStudentsPage;
