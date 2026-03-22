const FIELD_LABELS = {
  school: 'Креирај училиште',
  classroom: 'Креирај паралелка',
  subject: 'Креирај предмет',
};

const ENTITY_HELPERS = {
  school:
    'Постави основни податоци за новото училиште, па продолжи со паралелки, предмети и луѓе.',
  classroom: 'Додади нова паралелка за да можеш подоцна да поврзеш ученици и наставници.',
  subject: 'Додади нов предмет за да може наставниците да добиваат предметни задолженија.',
};

const SUBMIT_LABELS = {
  school: 'Креирај училиште',
  classroom: 'Креирај паралелка',
  subject: 'Креирај предмет',
};

function renderField(field, value, onChange, disabled) {
  const commonProps = {
    disabled,
    value,
    onChange: (event) => onChange(field.id, event.target.value),
  };

  if (field.type === 'select') {
    return (
      <select {...commonProps} required={field.required}>
        {field.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      {...commonProps}
      type={field.type || 'text'}
      placeholder={field.placeholder || ''}
      required={field.required}
      pattern={field.pattern}
      title={field.title}
      maxLength={field.maxLength}
      autoCapitalize={field.autoCapitalize}
    />
  );
}

function AdminCreateEntityModal({
  entityType,
  values,
  fields,
  onChange,
  onClose,
  onSubmit,
  loading,
  error,
  theme,
  paletteStyle,
}) {
  const title = FIELD_LABELS[entityType] || 'Креирај';
  const submitLabel = SUBMIT_LABELS[entityType] || 'Create';

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
        className="admin-modal admin-create-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-create-title"
        onClick={(event) => event.stopPropagation()}
      >
        <form className="admin-modal-form admin-create-form" onSubmit={handleSubmit}>
          <div className="admin-modal-header">
            <div>
              <h2 id="admin-create-title">{title}</h2>
              <p>{ENTITY_HELPERS[entityType] || ''}</p>
            </div>
          </div>

          <div className="admin-create-grid">
            {fields.map((field) => (
              <label
                key={field.id}
                className={`admin-modal-field ${field.fullWidth ? 'is-full-width' : ''}`}
              >
                <span>{field.label}</span>
                {renderField(field, values[field.id] || '', onChange, loading)}
              </label>
            ))}
          </div>

          {error ? <p className="auth-error">{error}</p> : null}

          <div className="admin-modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Се зачувува...' : submitLabel}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default AdminCreateEntityModal;
