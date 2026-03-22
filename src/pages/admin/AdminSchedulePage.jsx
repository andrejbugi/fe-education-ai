const SCHEDULE_DAYS = [
  { id: 'monday', label: 'Пон' },
  { id: 'tuesday', label: 'Вто' },
  { id: 'wednesday', label: 'Сре' },
  { id: 'thursday', label: 'Чет' },
  { id: 'friday', label: 'Пет' },
];

function getSlotKey(dayOfWeek, periodNumber) {
  return `${dayOfWeek}-${periodNumber}`;
}

function normalizeTeacherOption(teacher) {
  return {
    id: teacher?.id ? String(teacher.id) : '',
    full_name: teacher?.full_name || teacher?.name || 'Без име',
    room_name: teacher?.room_name || teacher?.teacher_profile?.room_name || '',
    room_label: teacher?.room_label || teacher?.teacher_profile?.room_label || '',
    subject_ids: Array.isArray(teacher?.subject_ids)
      ? teacher.subject_ids.map((id) => String(id))
      : Array.isArray(teacher?.subjectIds)
        ? teacher.subjectIds.map((id) => String(id))
        : [],
    classroom_ids: Array.isArray(teacher?.classroom_ids)
      ? teacher.classroom_ids.map((id) => String(id))
      : Array.isArray(teacher?.classroomIds)
        ? teacher.classroomIds.map((id) => String(id))
        : [],
  };
}

function mergeTeacherOptions(primaryTeachers = [], fallbackTeachers = []) {
  const merged = new Map();

  [...primaryTeachers, ...fallbackTeachers].forEach((teacher) => {
    const normalized = normalizeTeacherOption(teacher);
    if (!normalized.id) {
      return;
    }

    const existing = merged.get(normalized.id);
    merged.set(normalized.id, {
      ...normalized,
      subject_ids:
        existing?.subject_ids?.length > 0
          ? existing.subject_ids
          : normalized.subject_ids,
      classroom_ids:
        existing?.classroom_ids?.length > 0
          ? existing.classroom_ids
          : normalized.classroom_ids,
      room_name: existing?.room_name || normalized.room_name,
      room_label: existing?.room_label || normalized.room_label,
      full_name: existing?.full_name || normalized.full_name,
    });
  });

  return [...merged.values()];
}

function getNormalizedIds(values = []) {
  return Array.isArray(values) ? values.map((value) => String(value)) : [];
}

function getSlotPreviewRoom(slot, subject, teacher, classroom) {
  const roomName =
    slot?.room_name ||
    slot?.display_room_name ||
    subject?.room_name ||
    teacher?.room_name ||
    classroom?.roomName ||
    '';
  const roomLabel =
    slot?.room_label ||
    slot?.display_room_label ||
    subject?.room_label ||
    teacher?.room_label ||
    classroom?.roomLabel ||
    '';

  if (roomName && roomLabel && roomName !== roomLabel) {
    return `${roomName} · ${roomLabel}`;
  }

  return roomName || roomLabel || 'Ќе се користи стандардната просторија.';
}

function AdminSchedulePage({
  classrooms = [],
  teacherRoster = [],
  selectedClassroomId = '',
  onSelectClassroom,
  schedulePayload,
  draftSlots = [],
  loading = false,
  saving = false,
  error = '',
  onChangeSlot,
  onClearSlot,
  onSave,
  onBack,
}) {
  const activeClassroom =
    classrooms.find((item) => String(item.id) === String(selectedClassroomId)) || classrooms[0] || null;
  const subjects = Array.isArray(schedulePayload?.available_subjects)
    ? schedulePayload.available_subjects
    : [];
  const teachers = mergeTeacherOptions(
    Array.isArray(schedulePayload?.available_teachers) ? schedulePayload.available_teachers : [],
    teacherRoster
  );
  const maxPeriod = Math.max(
    7,
    draftSlots.reduce((maximum, slot) => Math.max(maximum, Number(slot?.period_number || 0)), 0)
  );
  const periods = Array.from({ length: maxPeriod }, (_, index) => index + 1);
  const slotMap = new Map(
    draftSlots.map((slot) => [getSlotKey(String(slot.day_of_week || ''), Number(slot.period_number || 0)), slot])
  );

  return (
    <section className="admin-schedule-shell">
      <section className="admin-schedule-hero">
        <div>
          <p className="hero-eyebrow">Weekly schedule</p>
          <h2>Распоред по паралелка</h2>
          <p className="admin-schedule-copy">
            Намести предмет, наставник и просторија по термин. Ова е повторлив неделен распоред,
            па календарите за наставници и ученици потоа се градат директно од овие слотови.
          </p>
        </div>
        <div className="admin-schedule-hero-actions">
          <button type="button" className="btn btn-ghost" onClick={onBack}>
            Назад во setup
          </button>
          <button type="button" className="btn btn-primary" onClick={onSave} disabled={saving || loading}>
            {saving ? 'Се снима...' : 'Сними распоред'}
          </button>
        </div>
      </section>

      <section className="admin-schedule-toolbar">
        <label className="admin-modal-field admin-schedule-classroom-field">
          <span>Паралелка</span>
          <select
            value={selectedClassroomId}
            onChange={(event) => onSelectClassroom?.(event.target.value)}
            disabled={loading || classrooms.length === 0}
          >
            {classrooms.length === 0 ? (
              <option value="">Нема паралелки</option>
            ) : (
              classrooms.map((classroom) => (
                <option key={classroom.id} value={classroom.id}>
                  {classroom.name}
                </option>
              ))
            )}
          </select>
        </label>

        <div className="admin-schedule-toolbar-note">
          <strong>{activeClassroom?.name || 'Избери паралелка'}</strong>
          <span>
            {activeClassroom?.subtitle || 'Распоредот се снима по паралелка и може да има room override по час.'}
          </span>
        </div>
      </section>

      {error ? <p className="auth-error">{error}</p> : null}

      {!activeClassroom ? (
        <section className="admin-empty-panel">
          <p>Креирај паралелка прво, па потоа додади неделен распоред.</p>
        </section>
      ) : loading ? (
        <section className="admin-empty-panel">
          <p>Се вчитува распоредот...</p>
        </section>
      ) : (
        <section className="admin-schedule-board">
          <div className="admin-schedule-grid">
            <div className="admin-schedule-grid-corner">Термин</div>
            {SCHEDULE_DAYS.map((day) => (
              <div key={day.id} className="admin-schedule-day-head">
                <strong>{day.label}</strong>
                <span>{day.id}</span>
              </div>
            ))}

            {periods.map((periodNumber) => (
              <div key={`period-row-${periodNumber}`} className="admin-schedule-period-row">
                <div className="admin-schedule-period-badge">
                  <strong>{periodNumber}</strong>
                  <span>час</span>
                </div>

                {SCHEDULE_DAYS.map((day) => {
                  const slot = slotMap.get(getSlotKey(day.id, periodNumber)) || null;
                  const subjectId = String(slot?.subject_id || '');
                  const teacherId = String(slot?.teacher_id || '');
                  const selectedSubject =
                    subjects.find((item) => String(item.id) === subjectId) || null;
                  const subjectTeacherIds = getNormalizedIds(
                    selectedSubject?.teacher_ids || selectedSubject?.teacherIds
                  );
                  const classroomTeacherIds = getNormalizedIds(activeClassroom?.teacherIds);
                  const filteredTeachers = teachers.filter((teacher) => {
                    const teacherClassroomIds = Array.isArray(teacher?.classroom_ids)
                      ? teacher.classroom_ids
                      : [];
                    const teacherSubjectIds = Array.isArray(teacher?.subject_ids)
                      ? teacher.subject_ids
                      : [];

                    const supportsClassroom =
                      teacherClassroomIds.length > 0
                        ? teacherClassroomIds.includes(String(activeClassroom.id))
                        : classroomTeacherIds.length === 0 ||
                          classroomTeacherIds.includes(String(teacher.id));
                    const supportsSubject =
                      !subjectId ||
                      (teacherSubjectIds.length > 0
                        ? teacherSubjectIds.includes(subjectId)
                        : subjectTeacherIds.length === 0 ||
                          subjectTeacherIds.includes(String(teacher.id)));

                    return supportsClassroom && supportsSubject;
                  });
                  const selectedTeacher =
                    teachers.find((item) => String(item.id) === teacherId) || null;

                  return (
                    <article
                      key={`${day.id}-${periodNumber}`}
                      className="admin-schedule-slot-card"
                    >
                      <label className="admin-modal-field">
                        <span>Предмет</span>
                        <select
                          value={subjectId}
                          onChange={(event) =>
                            onChangeSlot?.(day.id, periodNumber, 'subject_id', event.target.value)
                          }
                        >
                          <option value="">Избери предмет</option>
                          {subjects.map((subject) => (
                            <option key={subject.id} value={subject.id}>
                              {subject.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="admin-modal-field">
                        <span>Наставник</span>
                        <select
                          value={teacherId}
                          onChange={(event) =>
                            onChangeSlot?.(day.id, periodNumber, 'teacher_id', event.target.value)
                          }
                        >
                          <option value="">Избери наставник</option>
                          {filteredTeachers.map((teacher) => (
                            <option key={teacher.id} value={teacher.id}>
                              {teacher.full_name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <div className="admin-schedule-slot-room-grid">
                        <label className="admin-modal-field">
                          <span>Room name</span>
                          <input
                            type="text"
                            value={slot?.room_name || ''}
                            placeholder="пр. Кабинет 12"
                            onChange={(event) =>
                              onChangeSlot?.(day.id, periodNumber, 'room_name', event.target.value)
                            }
                          />
                        </label>

                        <label className="admin-modal-field">
                          <span>Room label</span>
                          <input
                            type="text"
                            value={slot?.room_label || ''}
                            placeholder="пр. A-12"
                            onChange={(event) =>
                              onChangeSlot?.(day.id, periodNumber, 'room_label', event.target.value)
                            }
                          />
                        </label>
                      </div>

                      <div className="admin-schedule-slot-footer">
                        <div>
                          <strong>{selectedSubject?.name || 'Празен термин'}</strong>
                          <p>{getSlotPreviewRoom(slot, selectedSubject, selectedTeacher, activeClassroom)}</p>
                        </div>
                        <button
                          type="button"
                          className="admin-inline-clear"
                          onClick={() => onClearSlot?.(day.id, periodNumber)}
                        >
                          Исчисти
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}

export default AdminSchedulePage;
