import { useEffect, useState } from 'react';

function CreateAssignmentModal({
  onClose,
  onSave,
  loading,
  classrooms = [],
  subjects = [],
  error = '',
}) {
  const [form, setForm] = useState({
    title: '',
    subjectId: '',
    classroomId: '',
    description: '',
    dueDate: '',
    type: 'Домашна задача',
    points: '',
  });

  useEffect(() => {
    setForm((previous) => ({
      ...previous,
      subjectId: previous.subjectId || (subjects[0] ? String(subjects[0].id) : ''),
      classroomId: previous.classroomId || (classrooms[0] ? String(classrooms[0].id) : ''),
    }));
  }, [subjects, classrooms]);

  const updateField = (key, value) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  const handleSave = () => {
    onSave?.(form);
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <section className="modal-card">
        <h2>Креирај задача</h2>
        <form className="modal-form">
          <label>
            Наслов
            <input
              type="text"
              placeholder="Наслов на задача"
              value={form.title}
              onChange={(event) => updateField('title', event.target.value)}
            />
          </label>
          <label>
            Предмет
            <select
              value={form.subjectId}
              onChange={(event) => updateField('subjectId', event.target.value)}
              disabled={subjects.length === 0}
            >
              {subjects.length === 0 ? (
                <option value="">Нема предмети</option>
              ) : (
                subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))
              )}
            </select>
          </label>
          <label>
            Клас
            <select
              value={form.classroomId}
              onChange={(event) => updateField('classroomId', event.target.value)}
              disabled={classrooms.length === 0}
            >
              {classrooms.length === 0 ? (
                <option value="">Нема класови</option>
              ) : (
                classrooms.map((classroom) => (
                  <option key={classroom.id} value={classroom.id}>
                    {classroom.name}
                  </option>
                ))
              )}
            </select>
          </label>
          <label>
            Опис
            <textarea
              rows={3}
              placeholder="Краток опис..."
              value={form.description}
              onChange={(event) => updateField('description', event.target.value)}
            />
          </label>
          <label>
            Рок
            <input
              type="date"
              value={form.dueDate}
              onChange={(event) => updateField('dueDate', event.target.value)}
            />
          </label>
          <label>
            Тип
            <select
              value={form.type}
              onChange={(event) => updateField('type', event.target.value)}
            >
              <option>Домашна задача</option>
              <option>Проект</option>
              <option>Квиз</option>
              <option>Тест</option>
              <option>Вежба</option>
            </select>
          </label>
          <label>
            Прикачен материјал
            <input type="file" />
          </label>
          <label>
            Поени / тежина
            <input
              type="number"
              min="1"
              max="100"
              placeholder="20"
              value={form.points}
              onChange={(event) => updateField('points', event.target.value)}
            />
          </label>
        </form>
        {error ? <p className="auth-error">{error}</p> : null}
        <div className="hero-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={loading || classrooms.length === 0 || subjects.length === 0}
          >
            {loading ? 'Се зачувува...' : 'Зачувај'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Затвори
          </button>
        </div>
      </section>
    </div>
  );
}

export default CreateAssignmentModal;
