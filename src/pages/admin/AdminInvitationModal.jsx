function AdminInvitationModal({
  role,
  email,
  onEmailChange,
  onClose,
  onSubmit,
  loading,
  error,
}) {
  const title = role === 'teacher' ? 'Покани наставник' : 'Покани ученик';
  const helperText =
    role === 'teacher'
      ? 'Внеси е-пошта на наставникот. Ако веќе постои профил со таа е-пошта, системот ќе ја поврзе истата сметка со ова училиште по прифаќање на поканата.'
      : 'Внеси е-пошта на ученикот. Ако веќе постои профил со таа е-пошта, системот ќе ја поврзе истата сметка со ова училиште по прифаќање на поканата.';

  const handleSubmit = (event) => {
    event.preventDefault();
    if (loading) {
      return;
    }

    onSubmit();
  };

  return (
    <div className="admin-modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="admin-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-invite-title"
        onClick={(event) => event.stopPropagation()}
      >
        <form className="admin-modal-form" onSubmit={handleSubmit}>
          <div className="admin-modal-header">
            <div>
              <h2 id="admin-invite-title">{title}</h2>
              <p>{helperText}</p>
            </div>
          </div>

          <label className="admin-modal-field">
            <span>Е-пошта</span>
            <input
              type="email"
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
              placeholder={
                role === 'teacher' ? 'teacher@school.mk' : 'student@school.mk'
              }
              autoFocus
              required
              disabled={loading}
            />
          </label>

          <div className="admin-modal-preview">
            <p className="admin-modal-preview-label">Подготвена покана</p>
            <div className="admin-modal-preview-row">
              <span className="admin-person-avatar is-invite">
                {role === 'teacher' ? 'Н' : 'У'}
              </span>
              <div>
                <strong>{email || 'Внесете е-пошта'}</strong>
                <p>{role === 'teacher' ? 'Наставничка покана' : 'Ученичка покана'}</p>
              </div>
            </div>
          </div>

          {error ? <p className="auth-error">{error}</p> : null}

          <div className="admin-modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading || !email.trim()}>
              {loading ? 'Се испраќа...' : 'Испрати покана'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default AdminInvitationModal;
