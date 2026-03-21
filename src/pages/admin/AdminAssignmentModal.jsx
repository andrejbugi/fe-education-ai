function getEntityTitle(entityType) {
  if (entityType === 'classroom') {
    return 'Поврзи паралелка';
  }
  if (entityType === 'teacher') {
    return 'Уреди наставник';
  }
  if (entityType === 'student') {
    return 'Уреди ученик';
  }

  return 'Поврзи предмет';
}

function getEntityHelper(entityType) {
  if (entityType === 'classroom') {
    return 'Во backend v1 паралелката директно поврзува наставници и ученици. Предметите се појавуваат преку наставничките предметни задолженија.';
  }
  if (entityType === 'teacher') {
    return 'Во backend v1 наставникот директно се поврзува со предмети и паралелки преку teacher assignment endpoints.';
  }
  if (entityType === 'student') {
    return 'Во backend v1 ученикот директно се поврзува само со паралелки. Наставници и предмети се прикажуваат изведено од тие classroom assignments.';
  }

  return 'Во backend v1 предметот директно се доделува на наставници. Паралелките потоа се добиваат преку наставничките classroom assignments.';
}

function renderSelectedList(items, emptyText, onRemove) {
  if (items.length === 0) {
    return <p className="admin-assignment-empty">{emptyText}</p>;
  }

  return (
    <div className="admin-assignment-chip-list">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className="admin-assignment-chip"
          onClick={() => onRemove(item.id)}
        >
          <span>{item.name}</span>
          <span aria-hidden="true">×</span>
        </button>
      ))}
    </div>
  );
}

function AdminAssignmentModal({
  entityType,
  entity,
  teachers,
  students,
  subjects,
  classrooms,
  values,
  onAddTeacher,
  onRemoveTeacher,
  onAddStudent,
  onRemoveStudent,
  onAddClassroom,
  onRemoveClassroom,
  onAddSubject,
  onRemoveSubject,
  onClose,
  onSubmit,
  loading,
  error,
  theme,
  paletteStyle,
}) {
  const selectedTeachers = teachers.filter((teacher) => values.teacherIds.includes(String(teacher.id)));
  const selectedStudents = students.filter((student) => values.studentIds.includes(String(student.id)));
  const selectedClassrooms = classrooms.filter((classroom) =>
    values.classroomIds.includes(String(classroom.id))
  );
  const selectedSubjects = subjects.filter((subject) => values.subjectIds.includes(String(subject.id)));
  const teacherOptions = teachers.filter((teacher) => !values.teacherIds.includes(String(teacher.id)));
  const studentOptions = students.filter((student) => !values.studentIds.includes(String(student.id)));
  const classroomOptions = classrooms.filter(
    (classroom) => !values.classroomIds.includes(String(classroom.id))
  );
  const subjectOptions = subjects.filter((subject) => !values.subjectIds.includes(String(subject.id)));
  const derivedSubjects = subjects.filter((subject) =>
    selectedTeachers.some((teacher) => teacher.subjectIds.includes(String(subject.id)))
  );
  const derivedClassrooms = classrooms.filter((classroom) =>
    selectedTeachers.some((teacher) => teacher.classroomIds.includes(String(classroom.id)))
  );
  const derivedTeachersForStudent = teachers.filter((teacher) =>
    teacher.classroomIds.some((classroomId) => values.classroomIds.includes(String(classroomId)))
  );
  const derivedSubjectsForStudent = subjects.filter((subject) =>
    derivedTeachersForStudent.some((teacher) => teacher.subjectIds.includes(String(subject.id)))
  );
  const derivedStudentsForTeacher = students.filter((student) =>
    student.classroomIds.some((classroomId) => values.classroomIds.includes(String(classroomId)))
  );
  const isClassroom = entityType === 'classroom';
  const isSubject = entityType === 'subject';
  const isTeacher = entityType === 'teacher';
  const isStudent = entityType === 'student';

  const handleSubmit = (event) => {
    event.preventDefault();
    if (loading) {
      return;
    }

    onSubmit();
  };

  return (
    <div
      className={`admin-modal-backdrop dashboard-root admin-root theme-${theme}`}
      style={paletteStyle}
      role="presentation"
      onClick={onClose}
    >
      <section
        className="admin-modal admin-assignment-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-assignment-title"
        onClick={(event) => event.stopPropagation()}
      >
        <form className="admin-modal-form admin-assignment-form" onSubmit={handleSubmit}>
          <div className="admin-modal-header">
            <div>
              <h2 id="admin-assignment-title">{getEntityTitle(entityType)}</h2>
              <p>{getEntityHelper(entityType)}</p>
            </div>
          </div>

          <section className="admin-assignment-section">
            <div className="admin-assignment-section-head">
              <strong>{entity?.name || 'Избран ентитет'}</strong>
              <span>{entity?.subtitle || entity?.code || 'Без дополнителни детали'}</span>
            </div>
          </section>

          {isClassroom || isSubject ? (
            <section className="admin-assignment-section">
              <label className="admin-modal-field">
                <span>Наставници</span>
                <select
                  value=""
                  onChange={(event) => {
                    if (event.target.value) {
                      onAddTeacher(event.target.value);
                    }
                  }}
                  disabled={loading || teacherOptions.length === 0}
                >
                  <option value="">
                    {teacherOptions.length > 0 ? 'Додади наставник...' : 'Нема повеќе наставници'}
                  </option>
                  {teacherOptions.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </label>
              {renderSelectedList(
                selectedTeachers,
                isClassroom
                  ? 'Сè уште нема доделени наставници за оваа паралелка.'
                  : 'Сè уште нема наставници за овој предмет.',
                onRemoveTeacher
              )}
            </section>
          ) : null}

          {isTeacher || isStudent ? (
            <section className="admin-assignment-section">
              <label className="admin-modal-field">
                <span>Паралелки</span>
                <select
                  value=""
                  onChange={(event) => {
                    if (event.target.value) {
                      onAddClassroom(event.target.value);
                    }
                  }}
                  disabled={loading || classroomOptions.length === 0}
                >
                  <option value="">
                    {classroomOptions.length > 0 ? 'Додади паралелка...' : 'Нема повеќе паралелки'}
                  </option>
                  {classroomOptions.map((classroom) => (
                    <option key={classroom.id} value={classroom.id}>
                      {classroom.name}
                    </option>
                  ))}
                </select>
              </label>
              {renderSelectedList(
                selectedClassrooms,
                isTeacher
                  ? 'Сè уште нема доделени паралелки за овој наставник.'
                  : 'Сè уште нема доделени паралелки за овој ученик.',
                onRemoveClassroom
              )}
            </section>
          ) : null}

          {isTeacher ? (
            <section className="admin-assignment-section">
              <label className="admin-modal-field">
                <span>Предмети</span>
                <select
                  value=""
                  onChange={(event) => {
                    if (event.target.value) {
                      onAddSubject(event.target.value);
                    }
                  }}
                  disabled={loading || subjectOptions.length === 0}
                >
                  <option value="">
                    {subjectOptions.length > 0 ? 'Додади предмет...' : 'Нема повеќе предмети'}
                  </option>
                  {subjectOptions.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </label>
              {renderSelectedList(
                selectedSubjects,
                'Сè уште нема доделени предмети за овој наставник.',
                onRemoveSubject
              )}
            </section>
          ) : null}

          {isClassroom ? (
            <section className="admin-assignment-section">
              <label className="admin-modal-field">
                <span>Ученици</span>
                <select
                  value=""
                  onChange={(event) => {
                    if (event.target.value) {
                      onAddStudent(event.target.value);
                    }
                  }}
                  disabled={loading || studentOptions.length === 0}
                >
                  <option value="">
                    {studentOptions.length > 0 ? 'Додади ученик...' : 'Нема повеќе ученици'}
                  </option>
                  {studentOptions.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name}
                    </option>
                  ))}
                </select>
              </label>
              {renderSelectedList(
                selectedStudents,
                'Сè уште нема доделени ученици за оваа паралелка.',
                onRemoveStudent
              )}
            </section>
          ) : null}

          {isClassroom || isSubject || isTeacher || isStudent ? (
            <section className="admin-assignment-section admin-assignment-section-secondary">
              <div className="admin-assignment-section-head">
                <strong>
                  {isClassroom
                    ? 'Предмети преку наставници'
                    : isSubject
                      ? 'Паралелки преку наставници'
                      : isTeacher
                        ? 'Ученици преку паралелки'
                        : 'Наставници и предмети преку паралелки'}
                </strong>
                <span>Derived from the current backend relations</span>
              </div>
              <div className="admin-assignment-derived-grid">
                {isClassroom ? (
                  <div className="admin-assignment-chip-list is-static">
                    {derivedSubjects.length > 0 ? (
                      derivedSubjects.map((item) => (
                        <span key={item.id} className="admin-assignment-chip is-readonly">
                          {item.name}
                        </span>
                      ))
                    ) : (
                      <p className="admin-assignment-empty">
                        Предметите ќе се појават кога избраните наставници ќе имаат subject assignments.
                      </p>
                    )}
                  </div>
                ) : null}
                {isSubject ? (
                  <div className="admin-assignment-chip-list is-static">
                    {derivedClassrooms.length > 0 ? (
                      derivedClassrooms.map((item) => (
                        <span key={item.id} className="admin-assignment-chip is-readonly">
                          {item.name}
                        </span>
                      ))
                    ) : (
                      <p className="admin-assignment-empty">
                        Паралелките ќе се појават кога избраните наставници ќе имаат classroom assignments.
                      </p>
                    )}
                  </div>
                ) : null}
                {isTeacher ? (
                  <div className="admin-assignment-chip-list is-static">
                    {derivedStudentsForTeacher.length > 0 ? (
                      derivedStudentsForTeacher.map((item) => (
                        <span key={item.id} className="admin-assignment-chip is-readonly">
                          {item.name}
                        </span>
                      ))
                    ) : (
                      <p className="admin-assignment-empty">
                        Учениците ќе се појават од паралелките што се поврзани со наставникот.
                      </p>
                    )}
                  </div>
                ) : null}
                {isStudent ? (
                  <>
                    <div className="admin-assignment-derived-block">
                      <strong>Наставници</strong>
                      <div className="admin-assignment-chip-list is-static">
                        {derivedTeachersForStudent.length > 0 ? (
                          derivedTeachersForStudent.map((item) => (
                            <span key={item.id} className="admin-assignment-chip is-readonly">
                              {item.name}
                            </span>
                          ))
                        ) : (
                          <p className="admin-assignment-empty">
                            Наставниците ќе се појават кога паралелката ќе има teacher assignments.
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="admin-assignment-derived-block">
                      <strong>Предмети</strong>
                      <div className="admin-assignment-chip-list is-static">
                        {derivedSubjectsForStudent.length > 0 ? (
                          derivedSubjectsForStudent.map((item) => (
                            <span key={item.id} className="admin-assignment-chip is-readonly">
                              {item.name}
                            </span>
                          ))
                        ) : (
                          <p className="admin-assignment-empty">
                            Предметите ќе се појават преку наставниците на избраните паралелки.
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            </section>
          ) : null}

          {error ? <p className="auth-error">{error}</p> : null}

          <div className="admin-modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Се зачувува...' : 'Save assignments'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default AdminAssignmentModal;
