import { useState } from 'react';
import TeacherClassTabs from './TeacherClassTabs';

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatRate(value, suffix = '%') {
  if (value === null || value === undefined || value === '') {
    return 'Нема';
  }

  return `${value}${suffix}`;
}

function formatCompactDate(value) {
  if (!value) {
    return 'Без рок';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  return parsed.toLocaleDateString('mk-MK', {
    month: 'short',
    day: 'numeric',
  });
}

function getLastName(value) {
  const parts = String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return parts[parts.length - 1] || '';
}

function getColumnAverage(rows, assignmentId) {
  const scores = rows
    .map((row) => toNumber(row?.submissionsByAssignment?.[assignmentId]?.totalScore))
    .filter((value) => value !== null);

  if (scores.length === 0) {
    return 'Нема';
  }

  return (scores.reduce((sum, value) => sum + value, 0) / scores.length).toFixed(1);
}

function getSubmissionLabel(submission, assignment) {
  if (!submission) {
    return 'Нема предавање';
  }

  if (submission.totalScore !== undefined && submission.totalScore !== null && submission.totalScore !== '') {
    return assignment?.maxPoints ? `${submission.totalScore}/${assignment.maxPoints}` : String(submission.totalScore);
  }

  return submission.statusLabel || 'Прегледај';
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
  gradebookRows = [],
  gradebookLoading = false,
  onOpenSubmissionReview,
  onOpenStudent,
}) {
  const [sortBy, setSortBy] = useState('lastName');

  const classAssignments = teacherAssignments.filter(
    (assignment) => String(assignment.classroomId) === String(selectedClassroomId)
  );
  const rows = Array.isArray(gradebookRows) && gradebookRows.length > 0 ? gradebookRows : [];
  const sortedRows = [...rows].sort((left, right) => {
    if (sortBy === 'firstName') {
      return String(left.fullName || '').localeCompare(String(right.fullName || ''), 'mk');
    }

    if (sortBy === 'averageGrade') {
      return (toNumber(right.averageGrade) || 0) - (toNumber(left.averageGrade) || 0);
    }

    return getLastName(left.fullName).localeCompare(getLastName(right.fullName), 'mk');
  });
  const averageGrade =
    classroomDetails?.students?.length > 0
      ? (
          classroomDetails.students.reduce((sum, student) => sum + (toNumber(student.averageGrade) || 0), 0) /
          classroomDetails.students.length
        ).toFixed(1)
      : '0.0';
  const averageSubmissionRate =
    classroomDetails?.students?.length > 0
      ? (
          classroomDetails.students.reduce((sum, student) => sum + (toNumber(student.submissionRate) || 0), 0) /
          classroomDetails.students.length
        ).toFixed(0)
      : '0';
  const selectedAssignment =
    classAssignments.find((assignment) => String(assignment.id) === String(selectedAssignmentId)) ||
    classAssignments[0] ||
    null;

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
          <h1>Табела по стил на classroom</h1>
          <p className="teacher-page-description">
            Матрица со ученици по редови и задачи по колони, со брз влез во ученичка работа.
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
            <span>Колони</span>
            <strong>{classAssignments.length}</strong>
          </article>
        </div>
      </section>

      <section className="teacher-panel teacher-gradebook-toolbar teacher-gradebook-toolbar-stacked">
        <div className="teacher-gradebook-toolbar-head">
          <div className="teacher-section-heading">
            <div>
              <p className="teacher-section-label">Табела</p>
              <h2>Оценки по задача</h2>
            </div>
          </div>

          <label className="teacher-inline-select teacher-gradebook-select">
            <span>Подреди по</span>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="lastName">Презиме</option>
              <option value="firstName">Име</option>
              <option value="averageGrade">Просек</option>
            </select>
          </label>
        </div>

        {selectedAssignment ? (
          <div className="teacher-gradebook-summary teacher-gradebook-summary-wide">
            <span>Избрана задача</span>
            <strong>{selectedAssignment.title}</strong>
            <p>
              {selectedAssignment.dueAt || 'Без рок'} · {selectedAssignment.submissionCount || 0} предавања ·{' '}
              {selectedAssignment.maxPoints || 'Нема'} поени
            </p>
          </div>
        ) : (
          <p className="empty-state">Нема избрана задача.</p>
        )}
      </section>

      <section className="teacher-panel teacher-gradebook-panel">
        <div className="teacher-section-heading">
          <div>
            <p className="teacher-section-label">Матрица</p>
            <h2>Просек на паралелка и ученички резултати</h2>
          </div>
        </div>

        {classroomDetailsLoading ? (
          <p className="empty-state">Се вчитуваат учениците...</p>
        ) : !classroomDetails ? (
          <p className="empty-state">Избери паралелка за табелата.</p>
        ) : classAssignments.length === 0 ? (
          <p className="empty-state">Нема задачи за оваа паралелка.</p>
        ) : gradebookLoading && rows.length === 0 ? (
          <p className="empty-state">Се вчитуваат ученичките оценки...</p>
        ) : (
          <div className="teacher-gradebook-matrix-wrap">
            <table className="teacher-gradebook-matrix">
              <thead>
                <tr>
                  <th className="teacher-gradebook-student-column">Ученик</th>
                  <th>Просек</th>
                  {classAssignments.map((assignment) => (
                    <th
                      key={assignment.id}
                      className={
                        String(selectedAssignment?.id) === String(assignment.id)
                          ? 'teacher-gradebook-column-is-active'
                          : ''
                      }
                    >
                      <button
                        type="button"
                        className="teacher-gradebook-column-button"
                        onClick={() => onSelectAssignment?.(assignment.id)}
                      >
                        <span>{formatCompactDate(assignment.dueDate || assignment.dueAt)}</span>
                        <strong>{assignment.title}</strong>
                        <small>{assignment.maxPoints ? `${assignment.maxPoints} поени` : 'Без поени'}</small>
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="teacher-gradebook-average-row">
                  <th className="teacher-gradebook-student-column">Просек на паралелка</th>
                  <td>{averageGrade}</td>
                  {classAssignments.map((assignment) => (
                    <td
                      key={`average-${assignment.id}`}
                      className={
                        String(selectedAssignment?.id) === String(assignment.id)
                          ? 'teacher-gradebook-column-is-active'
                          : ''
                      }
                    >
                      {getColumnAverage(rows, assignment.id)}
                    </td>
                  ))}
                </tr>

                {sortedRows.length === 0 ? (
                  <tr>
                    <td colSpan={classAssignments.length + 2}>Нема ученици во оваа паралелка.</td>
                  </tr>
                ) : (
                  sortedRows.map((student) => (
                    <tr key={student.id}>
                      <th className="teacher-gradebook-student-column">
                        <button
                          type="button"
                          className="teacher-gradebook-student-button"
                          onClick={() => onOpenStudent?.(student.id)}
                        >
                          <strong>{student.fullName}</strong>
                          <span>Предадено: {formatRate(student.submissionRate)}</span>
                        </button>
                      </th>
                      <td>{student.averageGrade ?? 'Нема'}</td>
                      {classAssignments.map((assignment) => {
                        const submission = student.submissionsByAssignment?.[assignment.id] || null;
                        const isActiveColumn = String(selectedAssignment?.id) === String(assignment.id);

                        return (
                          <td
                            key={`${student.id}-${assignment.id}`}
                            className={isActiveColumn ? 'teacher-gradebook-column-is-active' : ''}
                          >
                            <button
                              type="button"
                              className={`teacher-gradebook-cell ${
                                submission ? `tone-${submission.status || 'submitted'}` : 'is-empty'
                              }`}
                              onClick={() => {
                                onSelectAssignment?.(assignment.id);
                                if (submission) {
                                  onOpenSubmissionReview?.({
                                    assignmentId: assignment.id,
                                    studentId: student.id,
                                    studentName: student.fullName,
                                    className: classroomDetails.name,
                                    classroomId: classroomDetails.id,
                                  });
                                }
                              }}
                              aria-label={`${student.fullName} · ${assignment.title}`}
                            >
                              <strong>{getSubmissionLabel(submission, assignment)}</strong>
                              <span>{submission?.statusLabel || 'Нема предавање'}</span>
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {selectedAssignment ? (
          <div className="teacher-gradebook-footnote">
            <p>
              Избери колона за да ја смениш фокус задачата. Клик на ученичка ќелија отвора преглед на
              предавањето ако постои.
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
}

export default TeacherGradesPage;
