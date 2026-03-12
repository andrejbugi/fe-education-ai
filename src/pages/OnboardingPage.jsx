function OnboardingPage({ theme, selectedRole, onSelectRole, onContinue }) {
  return (
    <main className={`auth-root theme-${theme}`}>
      <section className="auth-card">
        <p className="auth-eyebrow">Добредојдовте</p>
        <h1>Избери улога за почеток</h1>
        <p className="auth-help">
          Овој чекор го подготвува прототипот за реален ученички/наставнички тек.
        </p>
        <div className="onboarding-controls">
          <div className="role-switch">
            <button
              type="button"
              className={`role-btn ${selectedRole === 'student' ? 'active' : ''}`}
              onClick={() => onSelectRole('student')}
            >
              Ученик
            </button>
            <button
              type="button"
              className={`role-btn ${selectedRole === 'teacher' ? 'active' : ''}`}
              onClick={() => onSelectRole('teacher')}
            >
              Наставник
            </button>
          </div>
          <button
            type="button"
            className="btn btn-primary auth-submit onboarding-submit"
            onClick={onContinue}
          >
            Продолжи
          </button>
        </div>
      </section>
    </main>
  );
}

export default OnboardingPage;
