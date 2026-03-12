function LoginPage({
  theme,
  role,
  email,
  password,
  selectedSchool,
  schoolOptions,
  onEmailChange,
  onPasswordChange,
  onSelectSchool,
  onSubmit,
  onBack,
}) {
  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <main className={`auth-root theme-${theme}`}>
      <section className="auth-card">
        <button type="button" className="back-link" onClick={onBack}>
          Назад
        </button>
        <p className="auth-eyebrow">Најава</p>
        <h1>Најава во системот</h1>
        <p className="auth-help">
          Улога: {role === 'teacher' ? 'Наставник' : 'Ученик'}
        </p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Е-пошта
            <input
              type="email"
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
              placeholder="student@school.mk"
              required
            />
          </label>

          <label>
            Лозинка
            <input
              type="password"
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              placeholder="••••••••"
              required
            />
          </label>

          {role === 'teacher' ? (
            <label>
              Училиште
              <select
                value={selectedSchool}
                onChange={(event) => onSelectSchool(event.target.value)}
              >
                {schoolOptions.map((school) => (
                  <option key={school} value={school}>
                    {school}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <button type="submit" className="btn btn-primary auth-submit">
            Најава
          </button>
          <a href="#forgot" className="forgot-link">
            Ја заборавив лозинката
          </a>
        </form>
      </section>
    </main>
  );
}

export default LoginPage;
