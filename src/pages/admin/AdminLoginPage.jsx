function AdminLoginPage({
  theme,
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  loading,
  error,
}) {
  const handleSubmit = (event) => {
    event.preventDefault();
    if (loading) {
      return;
    }

    onSubmit();
  };

  return (
    <main className={`auth-root theme-${theme}`}>
      <section className="auth-card admin-login-card">
        <p className="auth-eyebrow">/admin/login</p>
        <h1>Администраторски пристап</h1>
        <p className="auth-help">
          Најавете се како училиштен администратор за да ги подготвите наставниците,
          учениците, паралелките и предметите.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Е-пошта
            <input
              type="email"
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
              placeholder="admin@edu.mk"
              required
              disabled={loading}
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
              disabled={loading}
            />
          </label>

          {error ? <p className="auth-error">{error}</p> : null}

          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? 'Се најавува...' : 'Најава како администратор'}
          </button>
        </form>
      </section>
    </main>
  );
}

export default AdminLoginPage;
