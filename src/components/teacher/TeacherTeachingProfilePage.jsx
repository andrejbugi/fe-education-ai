function TeacherTeachingProfilePage({
  teacherName,
  teacherEmail,
  school,
  classes = [],
  subjects = [],
  homerooms = [],
}) {
  return (
    <div className="teacher-page">
      <section className="teacher-panel teacher-teaching-profile teacher-page-header">
        <div className="teacher-student-hero teacher-student-hero-profile">
          <div className="teacher-avatar-large">{String(teacherName || 'Н').slice(0, 1)}</div>
          <div>
            <p className="teacher-page-eyebrow">Што предава наставникот</p>
            <h1>{teacherName || 'Наставник'}</h1>
            <p>{teacherEmail || 'Нема е-пошта'}</p>
            <p>{school || 'Нема училиште'}</p>
          </div>
        </div>

        <div className="teacher-chip-row teacher-chip-row-secondary">
          {subjects.length === 0 ? (
            <span className="teacher-tag">Нема внесени предмети</span>
          ) : (
            subjects.map((subject) => <span key={subject.id} className="teacher-tag">{subject.name}</span>)
          )}
        </div>
      </section>

      <section className="teacher-panel">
        <div className="teacher-section-heading">
          <div>
            <p className="teacher-section-label">Паралелки</p>
            <h2>Наставнички ангажман</h2>
          </div>
        </div>

        {classes.length === 0 ? (
          <p className="empty-state">Нема достапни паралелки.</p>
        ) : (
          <div className="teacher-roster-list">
            {classes.map((classroom, index) => {
              const subject = subjects[index % (subjects.length || 1)];
              const isHomeroom = homerooms.some(
                (item) => String(item.classroomId) === String(classroom.id)
              );

              return (
                <div key={classroom.id} className="teacher-simple-row teacher-simple-row-spacious">
                  <div>
                    <strong>{classroom.name}</strong>
                    <p>
                      {subject?.name || 'Предмет ќе се поврзе'} · {classroom.gradeLevel} одделение
                    </p>
                  </div>
                  <span className="teacher-tag">
                    {isHomeroom ? 'Класен раководител' : 'Наставник'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default TeacherTeachingProfilePage;
