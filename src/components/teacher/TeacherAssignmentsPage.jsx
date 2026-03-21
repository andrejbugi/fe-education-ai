import { useState } from 'react';
import TeacherClassTabs from './TeacherClassTabs';
import AssignToMultipleClassesModal from './AssignToMultipleClassesModal';
import CreateTopicModal from './CreateTopicModal';
import CreateClassworkMenu from './CreateClassworkMenu';

function TeacherAssignmentsPage({
  classes = [],
  subjects = [],
  selectedClassroomId = '',
  onSelectClassroom,
  onNavigate,
  teacherAssignments = [],
  assignmentListFilter = 'all',
  onAssignmentListFilterChange,
  assignmentTypeFilter = 'all',
  onAssignmentTypeFilterChange,
  selectedAssignmentId = '',
  onSelectAssignment,
  assignmentDetails,
  assignmentDetailsLoading = false,
  assignmentRoster = [],
  assignmentRosterLoading = false,
  assignmentStatusDraft = 'draft',
  onAssignmentStatusDraftChange,
  assignmentStatusSaving = false,
  assignmentStatusError = '',
  onSaveAssignmentStatus,
  onOpenCreate,
  onOpenEdit,
  onCreateTopic,
  onExportAssignment,
  formatAssignmentTypeLabel,
  formatAssignmentStatusLabel,
  getAssignmentTypeMonogram,
}) {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);

  const classroomAssignments = selectedClassroomId
    ? teacherAssignments.filter(
        (assignment) => String(assignment.classroomId) === String(selectedClassroomId)
      )
    : teacherAssignments;

  const listFilteredAssignments = classroomAssignments.filter((assignment) => {
    if (assignmentListFilter === 'drafts') {
      return assignment.status === 'draft';
    }
    if (assignmentListFilter === 'published') {
      return assignment.status === 'published';
    }
    if (assignmentListFilter === 'with-submissions') {
      return Number(assignment.submissionCount || 0) > 0;
    }

    return true;
  });

  const assignmentTypes = Array.from(
    new Set(listFilteredAssignments.map((assignment) => String(assignment.type || '').trim().toLowerCase()))
  ).filter(Boolean);
  const typeFilteredAssignments =
    assignmentTypeFilter === 'all'
      ? listFilteredAssignments
      : listFilteredAssignments.filter(
          (assignment) => String(assignment.type || '').trim().toLowerCase() === assignmentTypeFilter
        );
  const groupedAssignments = assignmentTypes
    .map((type) => ({
      id: type,
      label: formatAssignmentTypeLabel(type),
      items: typeFilteredAssignments.filter(
        (assignment) => String(assignment.type || '').trim().toLowerCase() === type
      ),
    }))
    .filter((group) => group.items.length > 0);

  const draftsCount = classroomAssignments.filter((assignment) => assignment.status === 'draft').length;
  const publishedCount = classroomAssignments.filter((assignment) => assignment.status === 'published').length;
  const withSubmissionsCount = classroomAssignments.filter(
    (assignment) => Number(assignment.submissionCount || 0) > 0
  ).length;
  const defaultTopicSubjectId =
    assignmentDetails?.subjectId ||
    classroomAssignments[0]?.subjectId ||
    subjects[0]?.id ||
    '';

  return (
    <div className="teacher-page">
      <TeacherClassTabs
        classes={classes}
        selectedClassroomId={selectedClassroomId}
        onSelectClassroom={onSelectClassroom}
        activePage="assignments"
        onNavigate={onNavigate}
      />

      <section className="teacher-page-grid teacher-page-grid-wide teacher-page-grid-assignments">
        <section className="teacher-panel">
          <div className="teacher-section-heading">
            <div>
              <p className="teacher-section-label">Classwork</p>
              <h2>Листа на задачи</h2>
            </div>
            <div className="teacher-action-row teacher-action-row-tight">
              <CreateClassworkMenu
                onCreateAssignment={onOpenCreate}
                onCreateTopic={() => setIsTopicModalOpen(true)}
              />
            </div>
          </div>

          <div className="teacher-chip-row">
            <button
              type="button"
              className={`teacher-filter-chip ${assignmentListFilter === 'all' ? 'is-active' : ''}`}
              onClick={() => onAssignmentListFilterChange?.('all')}
            >
              Сите <span>{classroomAssignments.length}</span>
            </button>
            <button
              type="button"
              className={`teacher-filter-chip ${assignmentListFilter === 'drafts' ? 'is-active' : ''}`}
              onClick={() => onAssignmentListFilterChange?.('drafts')}
            >
              Нацрти <span>{draftsCount}</span>
            </button>
            <button
              type="button"
              className={`teacher-filter-chip ${assignmentListFilter === 'published' ? 'is-active' : ''}`}
              onClick={() => onAssignmentListFilterChange?.('published')}
            >
              Објавени <span>{publishedCount}</span>
            </button>
            <button
              type="button"
              className={`teacher-filter-chip ${
                assignmentListFilter === 'with-submissions' ? 'is-active' : ''
              }`}
              onClick={() => onAssignmentListFilterChange?.('with-submissions')}
            >
              Со предавања <span>{withSubmissionsCount}</span>
            </button>
          </div>

          <div className="teacher-chip-row teacher-chip-row-secondary">
            <button
              type="button"
              className={`teacher-filter-chip ${assignmentTypeFilter === 'all' ? 'is-active' : ''}`}
              onClick={() => onAssignmentTypeFilterChange?.('all')}
            >
              Сите типови
            </button>
            {assignmentTypes.map((type) => (
              <button
                key={type}
                type="button"
                className={`teacher-filter-chip ${assignmentTypeFilter === type ? 'is-active' : ''}`}
                onClick={() => onAssignmentTypeFilterChange?.(type)}
              >
                {formatAssignmentTypeLabel(type)}
              </button>
            ))}
          </div>

          {classroomAssignments.length === 0 ? (
            <p className="empty-state">Нема задачи за избраната паралелка.</p>
          ) : groupedAssignments.length === 0 ? (
            <p className="empty-state">Нема задачи за моменталниот филтер.</p>
          ) : (
            <div className="teacher-assignment-groups">
              {groupedAssignments.map((group) => (
                <section key={group.id} className="teacher-assignment-group">
                  <div className="teacher-assignment-group-head">
                    <h3>{group.label}</h3>
                    <span>{group.items.length}</span>
                  </div>
                  <div className="teacher-roster-list">
                    {group.items.map((assignment) => (
                      <button
                        key={assignment.id}
                        type="button"
                        className={`teacher-assignment-row ${
                          String(selectedAssignmentId) === String(assignment.id) ? 'is-active' : ''
                        }`}
                        onClick={() => onSelectAssignment?.(assignment.id)}
                      >
                        <div className="teacher-assignment-row-mark">
                          {getAssignmentTypeMonogram(assignment.type)}
                        </div>
                        <div className="teacher-assignment-row-copy">
                          <div className="teacher-assignment-row-head">
                            <strong>{assignment.title}</strong>
                            <span className={`teacher-status-pill tone-${assignment.status}`}>
                              {formatAssignmentStatusLabel(assignment.status)}
                            </span>
                          </div>
                          <p>
                            {assignment.subjectName} · {assignment.classroomName}
                          </p>
                          <p>
                            {formatAssignmentTypeLabel(assignment.type)} · Рок: {assignment.dueAt}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </section>

        <section className="teacher-panel teacher-assignment-detail-panel">
          <div className="teacher-section-heading">
            <div>
              <p className="teacher-section-label">Преглед</p>
              <h2>Детали за задача</h2>
            </div>
          </div>

          {assignmentDetailsLoading ? (
            <p className="empty-state">Се вчитуваат деталите...</p>
          ) : !assignmentDetails ? (
            <p className="empty-state">Одбери задача од листата за детали.</p>
          ) : (
            <>
              <div className="teacher-assignment-detail-hero">
                <div>
                  <div className="teacher-assignment-row-head">
                    <h3>{assignmentDetails.title}</h3>
                    <span className={`teacher-status-pill tone-${assignmentDetails.status}`}>
                      {formatAssignmentStatusLabel(assignmentDetails.status)}
                    </span>
                  </div>
                  <p>
                    {assignmentDetails.subjectName} · {assignmentDetails.classroomName}
                  </p>
                  <p>
                    {formatAssignmentTypeLabel(assignmentDetails.type)} · Рок: {assignmentDetails.dueAt}
                  </p>
                  {assignmentDetails.topic ? <p>Тема: {assignmentDetails.topic}</p> : null}
                  {assignmentDetails.description ? <p>{assignmentDetails.description}</p> : null}
                </div>

                <div className="teacher-stat-grid">
                  <article className="teacher-stat-box">
                    <span>Поднесувања</span>
                    <strong>{assignmentDetails.submissionCount}</strong>
                  </article>
                  <article className="teacher-stat-box">
                    <span>Поени</span>
                    <strong>{assignmentDetails.maxPoints || 'Нема'}</strong>
                  </article>
                  <article className="teacher-stat-box">
                    <span>Материјали</span>
                    <strong>{assignmentDetails.resourcesCount}</strong>
                  </article>
                  <article className="teacher-stat-box">
                    <span>Чекори</span>
                    <strong>{assignmentDetails.stepsCount}</strong>
                  </article>
                </div>
              </div>

              <div className="teacher-action-row">
                {assignmentDetails.status !== 'published' ? (
                  <button type="button" className="btn btn-secondary" onClick={onOpenEdit}>
                    Измени
                  </button>
                ) : null}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsExportOpen(true)}
                >
                  Додели во повеќе паралелки
                </button>
              </div>

              {assignmentDetails.status !== 'published' ? (
                <section className="teacher-subpanel">
                  <div className="teacher-section-heading">
                    <h3>Статус</h3>
                  </div>
                  <div className="teacher-inline-form">
                    <label className="teacher-inline-select">
                      <span>Промени статус</span>
                      <select
                        value={assignmentStatusDraft}
                        onChange={(event) => onAssignmentStatusDraftChange?.(event.target.value)}
                        disabled={assignmentStatusSaving}
                      >
                        <option value="draft">Нацрт</option>
                        <option value="published">Објавено</option>
                      </select>
                    </label>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={onSaveAssignmentStatus}
                      disabled={assignmentStatusSaving || assignmentStatusDraft === assignmentDetails.status}
                    >
                      {assignmentStatusSaving ? 'Се зачувува...' : 'Зачувај статус'}
                    </button>
                  </div>
                  {assignmentStatusError ? <p className="form-error">{assignmentStatusError}</p> : null}
                </section>
              ) : null}

              {assignmentDetails.steps.length > 0 ? (
                <section className="teacher-subpanel">
                  <div className="teacher-section-heading">
                    <h3>Чекори</h3>
                  </div>
                  <ul className="teacher-activity-list list-reset">
                    {assignmentDetails.steps.map((step, index) => (
                      <li key={step.id || step.localId || `step-${index}`}>
                        {index + 1}. {step.title || `Чекор ${index + 1}`}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <section className="teacher-subpanel">
                <div className="teacher-section-heading">
                  <h3>Ученици по задача</h3>
                </div>
                {assignmentRosterLoading ? (
                  <p className="empty-state">Се вчитува напредокот...</p>
                ) : assignmentRoster.length === 0 ? (
                  <p className="empty-state">Нема податоци за напредок по ученици.</p>
                ) : (
                  <table className="teacher-table">
                    <thead>
                      <tr>
                        <th>Ученик</th>
                        <th>Статус</th>
                        <th>Предадено</th>
                        <th>Поени</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignmentRoster.map((student) => (
                        <tr key={student.id}>
                          <td>{student.fullName}</td>
                          <td>{student.statusLabel}</td>
                          <td>{student.submittedAt || 'Нема'}</td>
                          <td>{student.totalScore || 'Нема'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>
            </>
          )}
        </section>
      </section>

      <AssignToMultipleClassesModal
        open={isExportOpen}
        assignment={assignmentDetails}
        classes={classes.filter((classroom) => String(classroom.id) !== String(selectedClassroomId))}
        onClose={() => setIsExportOpen(false)}
        onConfirm={(targetClassroomIds) => {
          onExportAssignment?.(assignmentDetails, targetClassroomIds);
          setIsExportOpen(false);
        }}
      />

      <CreateTopicModal
        open={isTopicModalOpen}
        subjects={subjects}
        defaultSubjectId={defaultTopicSubjectId}
        onClose={() => setIsTopicModalOpen(false)}
        onConfirm={({ subjectId, name }) => onCreateTopic?.(subjectId, name)}
      />
    </div>
  );
}

export default TeacherAssignmentsPage;
