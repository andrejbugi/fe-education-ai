function renderField(field, value, onChange, disabled) {
  if (field.type === 'textarea') {
    return (
      <textarea
        value={value}
        onChange={(event) => onChange(field.id, event.target.value)}
        placeholder={field.placeholder || ''}
        rows={field.rows || 4}
        disabled={disabled}
      />
    );
  }

  return (
    <input
      type={field.type || 'text'}
      value={value}
      onChange={(event) => onChange(field.id, event.target.value)}
      placeholder={field.placeholder || ''}
      disabled={disabled}
    />
  );
}

function AdminPersonEditPage({
  entityType,
  values,
  fields,
  loading,
  saving,
  error,
  theme,
  paletteStyle,
  schoolName,
  onChange,
  onBack,
  onSubmit,
}) {
  const isTeacher = entityType === 'teacher';
  const title = isTeacher ? 'Уреди наставник' : 'Уреди ученик';
  const helper = isTeacher
    ? 'Промени ги основните профилни полиња за наставникот. Ова е едноставна admin форма врз PATCH endpoint-от.'
    : 'Промени ги основните профилни полиња за ученикот. Ова е едноставна admin форма врз PATCH endpoint-от.';

  const handleSubmit = (event) => {
    event.preventDefault();
    if (saving || loading) {
      return;
    }

    onSubmit();
  };

  return (
    <main className={`dashboard-root admin-root theme-${theme}`} style={paletteStyle}>
      <div className="dashboard-main admin-main">
        <section className="dashboard-card hero-card admin-hero-card">
          <p className="hero-eyebrow">{isTeacher ? '/admin/teachers/:id/edit' : '/admin/students/:id/edit'}</p>
          <h1 className="hero-title">{title}</h1>
          <p className="hero-meta">
            {schoolName || 'Admin workspace'}
            {' · '}
            {helper}
          </p>
          <div className="hero-actions">
            <button type="button" className="btn btn-ghost" onClick={onBack} disabled={saving}>
              Назад кон dashboard
            </button>
          </div>
        </section>

        <section className="dashboard-card content-card admin-edit-shell">
          <form className="admin-edit-form" onSubmit={handleSubmit}>
            <div className="admin-section-head">
              <div>
                <p className="hero-eyebrow">{isTeacher ? 'Teacher edit' : 'Student edit'}</p>
                <h2 className="section-title">{values.full_name || values.email || 'Корисник'}</h2>
              </div>
            </div>

            {loading ? (
              <p className="empty-state">Се вчитуваат деталите...</p>
            ) : (
              <div className="admin-create-grid">
                {fields.map((field) => (
                  <label
                    key={field.id}
                    className={`admin-modal-field ${field.fullWidth ? 'is-full-width' : ''}`}
                  >
                    <span>{field.label}</span>
                    {renderField(field, values[field.id] || '', onChange, saving)}
                  </label>
                ))}
              </div>
            )}

            {error ? <p className="auth-error">{error}</p> : null}

            <div className="admin-modal-actions">
              <button type="button" className="btn btn-ghost" onClick={onBack} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving || loading}>
                {saving ? 'Се снима...' : isTeacher ? 'Сними наставник' : 'Сними ученик'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

export default AdminPersonEditPage;
