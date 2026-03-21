import { useEffect, useState } from 'react';

function AssignToMultipleClassesModal({
  open = false,
  assignment = null,
  classes = [],
  onClose,
  onConfirm,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setSearchTerm('');
    setSelectedIds([]);
  }, [open, assignment?.id]);

  if (!open || !assignment) {
    return null;
  }

  const filteredClasses = classes.filter((classroom) =>
    `${classroom.name} ${classroom.gradeLevel} ${classroom.academicYear}`
      .toLowerCase()
      .includes(searchTerm.trim().toLowerCase())
  );

  const toggleClassroom = (classroomId) => {
    setSelectedIds((current) =>
      current.includes(classroomId)
        ? current.filter((id) => id !== classroomId)
        : [...current, classroomId]
    );
  };

  return (
    <div className="teacher-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="teacher-modal teacher-export-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="teacher-export-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="teacher-modal-header">
          <div>
            <p className="teacher-modal-eyebrow">Извоз на задача</p>
            <h2 id="teacher-export-modal-title">Додели во повеќе паралелки</h2>
            <p>{assignment.title}</p>
          </div>
          <button
            type="button"
            className="teacher-icon-button"
            onClick={onClose}
            aria-label="Затвори"
          >
            ×
          </button>
        </div>

        <label className="teacher-search-field teacher-search-field-block">
          <span>Пребарај паралелка</span>
          <input
            type="search"
            placeholder="На пример: VII-1"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </label>

        <div className="teacher-modal-list">
          {filteredClasses.length === 0 ? (
            <p className="empty-state">Нема совпаѓања за ова пребарување.</p>
          ) : (
            filteredClasses.map((classroom) => (
              <label key={classroom.id} className="teacher-modal-list-row">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(classroom.id)}
                  onChange={() => toggleClassroom(classroom.id)}
                />
                <div>
                  <strong>{classroom.name}</strong>
                  <p>
                    {classroom.gradeLevel} одделение · {classroom.students} ученици
                  </p>
                </div>
              </label>
            ))
          )}
        </div>

        <div className="teacher-modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Откажи
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={selectedIds.length === 0}
            onClick={() => onConfirm?.(selectedIds)}
          >
            Додели
          </button>
        </div>
      </div>
    </div>
  );
}

export default AssignToMultipleClassesModal;
