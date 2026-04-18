function LoginPage({
  theme,
  role,
  email,
  password,
  selectedSchoolId,
  schoolOptions,
  showSchoolSelector,
  schoolSelectionMessage,
  schoolSelectionOnly,
  onEmailChange,
  onPasswordChange,
  onSelectSchool,
  onSubmit,
  onBack,
  loading,
  error,
  submitText,
  submitDisabled = false,
}) {
  const handleSubmit = (event) => {
    event.preventDefault();
    if (loading || submitDisabled) {
      return;
    }
    onSubmit();
  };

  return (
    <main className={`auth-root theme-${theme}`}>
      <section className="auth-card">
        <button
          type="button"
          className="back-link back-link-icon"
          onClick={onBack}
          aria-label="Назад"
        >
          <span aria-hidden="true">←</span>
        </button>
        <h1>{role === 'teacher' ? 'Наставник' : 'Ученик'}</h1>
        <form className="auth-form" onSubmit={handleSubmit}>
          {schoolSelectionMessage ? <p className="auth-help">{schoolSelectionMessage}</p> : null}

          {!schoolSelectionOnly ? (
            <label>
              Е-пошта
              <input
                type="email"
                value={email}
                onChange={(event) => onEmailChange(event.target.value)}
                placeholder="student@school.mk"
                required
                disabled={loading}
              />
            </label>
          ) : null}

          {!schoolSelectionOnly ? (
            <label>
              Лозинка
              <input
                type="password"
                value={password}
                onChange={(event) => onPasswordChange(event.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </label>
          ) : null}

          {role === 'teacher' && showSchoolSelector ? (
            <label>
              Училиште
              <select
                value={selectedSchoolId}
                onChange={(event) => onSelectSchool(event.target.value)}
                disabled={loading}
                required
              >
                {schoolOptions.map((school) => (
                  <option key={`${school.id}-${school.name}`} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {error ? <p className="auth-error">{error}</p> : null}

          <button
            type="submit"
            className="btn btn-primary auth-submit"
            disabled={loading || submitDisabled}
          >
            {loading ? 'Се најавува...' : submitText || 'Најава'}
          </button>
          <a href="/password-reset" className="forgot-link">
            Ја заборавив лозинката
          </a>
        </form>
      </section>
    </main>
  );
}

export default LoginPage;
