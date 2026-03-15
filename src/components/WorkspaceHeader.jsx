import ThemeToggle from './ThemeToggle';

function WorkspaceHeader({
  title,
  currentStepIndex,
  totalSteps,
  onBack,
  theme,
  onToggleTheme,
}) {
  const safeTotalSteps = totalSteps > 0 ? totalSteps : 1;
  const safeCurrentStepIndex = currentStepIndex >= 0 ? currentStepIndex + 1 : 1;
  const progress = Math.round((safeCurrentStepIndex / safeTotalSteps) * 100);

  return (
    <header className="workspace-header">
      <button type="button" className="back-button" onClick={onBack}>
        Назад
      </button>
      <div className="workspace-header-main">
        <p className="workspace-label">Работен простор</p>
        <h1>{title}</h1>
        <p className="workspace-progress-text">
          Чекор {safeCurrentStepIndex} од {safeTotalSteps}
        </p>
        <div className="progress-track" aria-hidden="true">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />
    </header>
  );
}

export default WorkspaceHeader;
