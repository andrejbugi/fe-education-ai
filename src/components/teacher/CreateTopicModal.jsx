import { useEffect, useState } from 'react';

function CreateTopicModal({
  open = false,
  subjects = [],
  defaultSubjectId = '',
  onClose,
  onConfirm,
}) {
  const [subjectId, setSubjectId] = useState(defaultSubjectId || '');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      return;
    }

    setSubjectId(defaultSubjectId || subjects[0]?.id || '');
    setName('');
    setError('');
    setLoading(false);
  }, [open, defaultSubjectId, subjects]);

  if (!open) {
    return null;
  }

  const handleSubmit = async () => {
    if (!subjectId || !name.trim()) {
      setError('Избери предмет и внеси име за темата.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onConfirm?.({
        subjectId,
        name: name.trim(),
      });
      onClose?.();
    } catch (submitError) {
      setError(submitError.message || 'Не успеа креирањето на темата.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="teacher-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="teacher-modal teacher-topic-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="teacher-topic-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="teacher-modal-header">
          <div>
            <p className="teacher-modal-eyebrow">Нова тема</p>
            <h2 id="teacher-topic-modal-title">Креирај тема</h2>
            <p>Темата ќе може повторно да се избира при креирање задача.</p>
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

        <div className="teacher-modal-form">
          <label className="teacher-search-field">
            <span>Име</span>
            <input
              type="text"
              placeholder="На пример: Дробки"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoFocus
            />
          </label>

          <label className="teacher-inline-select">
            <span>Предмет</span>
            <select
              value={subjectId}
              onChange={(event) => setSubjectId(event.target.value)}
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
        </div>

        {error ? <p className="form-error">{error}</p> : null}

        <div className="teacher-modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Откажи
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!name.trim() || !subjectId || loading}
          >
            {loading ? 'Се креира...' : 'Креирај'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateTopicModal;
